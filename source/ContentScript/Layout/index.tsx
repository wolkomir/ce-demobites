import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import useStyles from "./layout.style";
import {
  DEVICES,
  Message,
  MESSAGE_ACTION,
  PERMISSIONS,
} from "../../Config";
import {
  getPermissionStatus,
} from "../../Utils/extensionUtils";

import _ from "lodash";
import { Button, Flex, Select, Text } from "@mantine/core";

type SelectOption = {
  value: string;
  label: string;
}

const NoMicrophone: SelectOption = {
  value: "",
  label: "No Audio"
}

enum State {
  Initial = 1,
  ProcessingRecording,
  RecordingCompleted,
  UploadingRecording
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
  
  const onMessageListener = async (msg: Message) => {
    switch (msg.action) {
      case MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_GRANTED: {
        // getMicrophoneDevices();
        const {microphoneDevices} = msg.data;
        setSelectedMicrophoneDeviceLabel(microphoneDevices.length > 0 ? microphoneDevices[0].value : NoMicrophone.value)
        setMicrophoneDevices([...microphoneDevices, NoMicrophone]);
        return true;
      }
      case MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_DENIED: {
        setMicrophoneDevices([NoMicrophone]);
        return true;
      }
      case MESSAGE_ACTION.TOGGLE_POPUP: {
        setWillShowPopup((prev) => {
          return !prev;
        });
        return true;
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
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.RECORDING_COMPLETED: {
        setCurrentState(State.RecordingCompleted);
        setWillShowPopup(true);
        break;
      }
      case MESSAGE_ACTION.UPLOAD_RECORDING_COMPLETED: {
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
        break;
      }
      default:
        return true;
    }
    return true;
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
    const setupDataResponse = await browser.runtime.sendMessage({action: MESSAGE_ACTION.GET_SETUP_DATA});
    const {success, error} = setupDataResponse;
    if (success) {
      setMaxDurationInSeconds(parseInt(setupDataResponse.maxDurationInSeconds, 10));
      askForMicrophonePermission();
    } else {
      if (error) {
        setWillShowPopup(false);
        alert(error);
      } else {
        fetchSetupData();
      }
    }
  }

  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener);
    browser.runtime.sendMessage({action: MESSAGE_ACTION.RESET_RECORDING_SESSION_IF_NOT_RECORDING});
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, []);

  useEffect(() => {
    if (willShowPopup && maxDurationInSeconds === 0) {
      setLoading(true);
      fetchSetupData();
      setTimeout(() => {
        if (willShowPopup) {
          const existingIframe = document.getElementById(PERMISSION_IFRAME_ID);
          if (!existingIframe) {
            askForMicrophonePermission();
          }
        }
      }, 3000);
    } else if (!willShowPopup) {
      removePermissionIframeIfExists();
    }
  }, [willShowPopup, maxDurationInSeconds])

  useEffect(() => {
    if (micrphoneDevices.length > 0) {
      setLoading(false);
    }
  }, [micrphoneDevices])

  const startRecording = () => {
    setWillShowPopup(false);
    browser.runtime.sendMessage({action: MESSAGE_ACTION.START_RECORDING, data: {selectedMicrophoneDeviceLabel, maxDurationInSeconds}});
  }

  const uploadRecording = () => {
    setCurrentState(State.UploadingRecording);
    browser.runtime.sendMessage({action: MESSAGE_ACTION.UPLOAD_RECORDING});
  }

  const deleteRecording = async () => {
    await browser.runtime.sendMessage({action: MESSAGE_ACTION.DELETE_RECORDING});
    setCurrentState(State.Initial);
    alert("Recording deleted successfully");
  }
  
  if (!willShowPopup) return null;

  const renderContent = () => {
    switch(currentState) {
      case State.Initial: {
        return (
          <div className={classes.wrapper} onClick={(event) => {event.stopPropagation()}}>
            <Text size={20} weight={"bold"}>Welcome to Demo Bites</Text>
            {
              isLoading ? <Text size={16} mt={10}>Loading...</Text> : (
                <>
                <Select
                  data={micrphoneDevices}
                  label="Microphone"
                  placeholder="Select a Microphone"
                  defaultValue={micrphoneDevices.length > 1 ? micrphoneDevices[1].value : NoMicrophone.value}
                  checked
                  mt={20}
                  mb={20}
                  onChange={setSelectedMicrophoneDeviceLabel}
                />
                <Button onClick={startRecording}><Text>Record</Text></Button>
                </>
              )
            }
          </div>
        )
      }
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
      case State.UploadingRecording: {
        return (
          <div className={classes.recordingCompletionActionsContainer}>
            <Flex gap={20}>
              <Text>Don't close this tab till upload ends</Text>
            </Flex>
          </div>
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
