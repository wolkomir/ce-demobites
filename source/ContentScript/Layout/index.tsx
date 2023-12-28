import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import useStyles from "./layout.style";
import {
  DEVICES,
  Message,
  MESSAGE_ACTION,
  PERMISSIONS,
} from "../../Config";
import { getImagePath, sleep } from "../../Utils";
import {
  getPermissionStatus,
  sendMessageToExtensionPages,
} from "../../Utils/extensionUtils";

import * as BrowserStorage from "../../Utils/storage";
import _ from "lodash";
import { Button, Select, Text } from "@mantine/core";

type SelectOption = {
  value: string;
  label: string;
}

const NoMicrophone: SelectOption = {
  value: "",
  label: "No Audio"
}

const Layout = () => {
  const { classes } = useStyles();
  const [willShowPopup, setWillShowPopup] = useState(false);
  const [micrphoneDevices, setMicrophoneDevices] = useState<SelectOption[]>([]);
  const [selectedMicrophoneDeviceId, setSelectedMicrophoneDeviceId] = useState<string | null>(NoMicrophone.value);
  const [isLoading, setLoading] = useState(true);
  
  const onMessageListener = async (msg: Message) => {
    console.log({ msg });
    switch (msg.action) {
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
      default:
        return true;
    }
    return true;
  };

  const getMicrophoneDevices = async () => {
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.label);
    const audioDevices = [NoMicrophone];
    devices.forEach((device) => {
      if (device.kind == "audioinput") {
        audioDevices.push({ label: device.label, value: device.deviceId});
      }
    });
    console.log({audioDevices})
    setSelectedMicrophoneDeviceId(audioDevices.length > 1 ? audioDevices[1].value : NoMicrophone.value)
    setMicrophoneDevices(audioDevices);
  }

  const askForMicrophonePermission = () => {
    navigator.mediaDevices
        .getUserMedia({audio: true})
        .then(() => {
          getMicrophoneDevices();
        })
        .catch((error: any) => {
          console.log("Error while getting microphone access", error)
        })
  }

  const checkMicrophonePermission = async () => {
    const microphonePermissionStatus = await getPermissionStatus(DEVICES.MICROPHONE);
    console.log({microphonePermissionStatus})
    if (microphonePermissionStatus === PERMISSIONS.GRANTED) {
      getMicrophoneDevices();
    } else if (microphonePermissionStatus === PERMISSIONS.PROMPT) {
      askForMicrophonePermission();
    } else {
      setMicrophoneDevices([NoMicrophone]);
    }
  }

  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, []);

  useEffect(() => {
    if (willShowPopup) {
      setLoading(true);
      checkMicrophonePermission();
    }
  }, [willShowPopup])

  useEffect(() => {
    if (micrphoneDevices.length > 0) {
      setLoading(false);
    }
  }, [micrphoneDevices])

  const startRecording = () => {
    setWillShowPopup(false);
    browser.runtime.sendMessage({action: MESSAGE_ACTION.START_RECORDING, data: {selectedMicrophoneDeviceId}});
  }
  
  if (!willShowPopup) return null;

  
  return (
    <div
      style={{
        position: "fixed",
        width: "100%",
        height: "100vh",
        maxHeight: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        top: 0,
        left: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 241721312,
      }}
    >
      <div className={classes.wrapper}>
        Welcome to Demo Bites
        {
          isLoading ? <Text>Loading...</Text> : (
            <>
            <Select
              data={micrphoneDevices}
              label="Microphone"
              placeholder="Select a Microphone"
              defaultValue={micrphoneDevices.length > 1 ? micrphoneDevices[1].value : NoMicrophone.value}
              checked
              mt={20}
              mb={20}
              onChange={setSelectedMicrophoneDeviceId}
            />
            <Button onClick={startRecording}><Text>Record</Text></Button>
            </>
          )
        }
      </div>
    </div>
  );
  
};

export default Layout;
