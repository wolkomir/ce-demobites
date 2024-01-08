import React, { useEffect, useState } from "react";
import browser, { Runtime } from "webextension-polyfill";

import useStyles from "./layout.style";
import {
  DEVICES,
  Message,
  MESSAGE_ACTION,
  PERMISSIONS,
  State,
  WAITING_TIME_FOR_STARTING_RECORDING_IN_SECONDS,
} from "../../Config";
import {
  getPermissionStatus, sendMessageToExtensionPages,
} from "../../Utils/extensionUtils";

import _ from "lodash";
import { Button, Flex, Select, Text } from "@mantine/core";
import { MainWindow, RecordingCountDown, PostRecordingScreen } from "../Components";

type SelectOption = {
  value: string;
  label: string;
}

const NoMicrophone: SelectOption = {
  value: "",
  label: "No Audio"
}

const PERMISSION_IFRAME_ID = "demobites_permissionsIFrame";

const Layout = () => {
  const { classes } = useStyles();
  const [willShowPopup, setWillShowPopup] = useState(false);
  const [micrphoneDevices, setMicrophoneDevices] = useState<SelectOption[]>([]);
  const [selectedMicrophoneDeviceLabel, setSelectedMicrophoneDeviceLabel] = useState<string | null>(NoMicrophone.value);
  const [isLoading, setLoading] = useState(true);
  const [currentState, setCurrentState] = useState<State>(State.Initial);
  const [maxDurationInSeconds, setMaxDurationInSeconds] = useState(0);
  const [initialWindowWidth, setInitialWindowWidth] = useState(0);
  const [initialWindowHeight, setInitialWindowHeight] = useState(0);
  const [didFinishedDueToTimeLimit, setDidFinishedDueToTimeLimit] = useState(false);
  
  const onMessageListener = async (msg: Message, sender: Runtime.MessageSender, sendResponse: any) => {
    switch (msg.action) {
      case MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_GRANTED: {
        // getMicrophoneDevices();
        const {microphoneDevices} = msg.data;
        setSelectedMicrophoneDeviceLabel(microphoneDevices.length > 0 ? microphoneDevices[0].value : NoMicrophone.value)
        setMicrophoneDevices([...microphoneDevices, NoMicrophone]);
        if (!willShowPopup) {
          removePermissionIframeIfExists();
        }
        break;
      }
      case MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_DENIED: {
        setMicrophoneDevices([NoMicrophone]);
        if (!willShowPopup) {
          removePermissionIframeIfExists();
        }
        break;
      }
      case MESSAGE_ACTION.TOGGLE_POPUP: {
        setWillShowPopup((prev) => {
          return !prev;
        });
        break;
      }
      case MESSAGE_ACTION.HIDE_POPUP: {
        setWillShowPopup(false);
        break;
      }
      case MESSAGE_ACTION.SHOW_POPUP: {
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.RECORDING_STOPPED_BEFORE_STARTING: {
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.RECORDING_CANCELLED: {
        const {error} = msg.data;
        alert(error)
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.PROCESSING_RECORDING: {
        setCurrentState(State.ProcessingRecording);
        setDidFinishedDueToTimeLimit(msg.data.didFinishedDueToTimeLimit)
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.RECORDING_COMPLETED: {
        setCurrentState(State.RecordingCompleted);
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.UPLOAD_RECORDING_COMPLETED: {
        sendResponse({status: true});
        const {success, error} = msg.data;
        if (success) {
          setWillShowPopup(false);
          setCurrentState(State.Initial);
          setTimeout(() => {
            alert("Recording uploaded successfully");  
          }, 0);
        } else {
          alert(error ? error : "Some error occurred. Please try again later.");
        }
        return;
      }
      default:
        break;
    }
    sendResponse({success:true});
  };

  const askForMicrophonePermission = async () => {
    removePermissionIframeIfExists();
    const iframe = document.createElement("iframe");
    iframe.setAttribute("hidden", "hidden");
    iframe.setAttribute("id", PERMISSION_IFRAME_ID);
    iframe.setAttribute("allow", "microphone");
    iframe.src = chrome.runtime.getURL("assets/requestPermission.html");
    document.body.appendChild(iframe);
  }

  const removePermissionIframeIfExists = () => {
    const existingIframe = document.getElementById(PERMISSION_IFRAME_ID);
    if (existingIframe) {
      existingIframe.remove();
    }
  }

  const fetchSetupData = async () => {
    const setupDataResponse = await sendMessageToExtensionPages(MESSAGE_ACTION.GET_SETUP_DATA);
    if (setupDataResponse?.success && setupDataResponse.maxDurationInSeconds) {
      setMaxDurationInSeconds(parseInt(setupDataResponse.maxDurationInSeconds, 10));
      if (willShowPopup) {
        askForMicrophonePermission();
      } else {
        setLoading(false);
      }
      
    } else {
      if (setupDataResponse?.error) {
        setWillShowPopup(false);
        alert(setupDataResponse.error);
      }
    }
  }

  const setInitialWindowSize = async () => {
    const windowSize = await sendMessageToExtensionPages(MESSAGE_ACTION.GET_WINDOW_SIZE);
    if (windowSize) {
      const {windowWidth, windowHeight} = windowSize;
      setInitialWindowWidth(windowWidth);
      setInitialWindowHeight(windowHeight);
    }
    
  }

  useEffect(() => {
    if (willShowPopup) {
      setInitialWindowSize();
    }
  }, [willShowPopup]);

  useEffect(() => {
    setInitialWindowWidth(window.innerWidth);
    setInitialWindowHeight(window.innerHeight);
    browser.runtime.onMessage.addListener(onMessageListener);
    sendMessageToExtensionPages(MESSAGE_ACTION.RESET_RECORDING_SESSION_IF_NOT_RECORDING);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, []);

  useEffect(() => {
    if (maxDurationInSeconds === 0) {
      setLoading(true);
      fetchSetupData();
      // setTimeout(() => {
      //   if (willShowPopup) {
      //     const existingIframe = document.getElementById(PERMISSION_IFRAME_ID);
      //     if (!existingIframe) {
      //       askForMicrophonePermission();
      //     }
      //   }
      // }, 1000);
    } else if (willShowPopup) {
      setLoading(true);
      askForMicrophonePermission();
    } else if (!willShowPopup) {
      removePermissionIframeIfExists();
    }
  }, [willShowPopup, maxDurationInSeconds, currentState])

  useEffect(() => {
    if (micrphoneDevices.length > 0) {
      setLoading(false);
    }
  }, [micrphoneDevices])

  const startRecording = () => {
    setWillShowPopup(false);
    sendMessageToExtensionPages(MESSAGE_ACTION.INITIATE_RECORDING, {selectedMicrophoneDeviceLabel, maxDurationInSeconds});
    setCurrentState(State.WaitingForRecordingStart);
  }

  const uploadRecording = () => {
    setCurrentState(State.UploadingRecording);
    sendMessageToExtensionPages(MESSAGE_ACTION.UPLOAD_RECORDING);
  }

  const deleteRecording = async () => {
    await sendMessageToExtensionPages(MESSAGE_ACTION.DELETE_RECORDING);
    setCurrentState(State.Initial);
    alert("Recording deleted successfully");
  }

  if (currentState === State.WaitingForRecordingStart) {
    return <RecordingCountDown 
      onCountDownEnd={() => {
        setCurrentState(State.Recording);
        sendMessageToExtensionPages(MESSAGE_ACTION.READY_TO_START_RECORDING);
      }}
    />
  }
  
  if (!willShowPopup) return null;

  const renderContent = () => {
    switch(currentState) {
      case State.Initial: {
        return (
          <MainWindow 
            initialWindowWidth={initialWindowWidth} 
            initialWindowHeight={initialWindowHeight}
            microphoneDevices={micrphoneDevices}
            selectedMicrophone={selectedMicrophoneDeviceLabel}
            onMicrodeviceChange={setSelectedMicrophoneDeviceLabel}
            startRecording={startRecording}
          />
        )
      }
      /*
      case State.ProcessingRecording: {
        return (
          <div className={classes.recordingCompletionActionsContainer}>
            <Flex gap={20}>
              <Text>Processing Recording...</Text>
            </Flex>
          </div>
        )
      }
      case State.RecordingCompleted: {
        return (
          <div className={classes.recordingCompletionActionsContainer}>
            <Flex gap={20}>
              <Text>Recording is done</Text>
              <Button onClick={uploadRecording}><Text>Upload</Text></Button>
              <Button onClick={deleteRecording}><Text>Delete Recording</Text></Button>
            </Flex>
          </div>
        )
      }
      */
      case State.ProcessingRecording:
      case State.RecordingCompleted:
      case State.UploadingRecording: {
        return (
          // <div className={classes.recordingCompletionActionsContainer}>
          //   <Flex gap={20}>
          //     <Text>Don't close this tab till upload ends</Text>
          //   </Flex>
          // </div>
          <PostRecordingScreen
            currentState={currentState}
            timeLimit={maxDurationInSeconds}
            didFinishedDueToTimeLimit={didFinishedDueToTimeLimit}
            uploadRecording={uploadRecording}
            deleteRecording={deleteRecording}
          />
        )
      }
      default: 
        return null;
    }
  }

  
  return (
    <div
      style={{
        position: "fixed",
        width: "100%",
        height: "100vh",
        maxHeight: "100vh",
        backgroundColor: `${currentState === State.Initial ? "transparent" : "rgba(0, 0, 0, 0.3)"}`,
        top: 0,
        left: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 241721312,
      }}
      onClick={() => {
        if (currentState === State.Initial) {
          setWillShowPopup(false);
        }
      }}
    >
      {
        renderContent()
      }
    </div>
  );
  
};

export default Layout;
