import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import useStyles from "./layout.style";
import {
  Message,
  MESSAGE_ACTION,
} from "../../Config";
import { getImagePath, sleep } from "../../Utils";
import {
  sendMessageToExtensionPages,
} from "../../Utils/extensionUtils";

import * as BrowserStorage from "../../Utils/storage";
import _ from "lodash";


const Layout = () => {
  const { classes } = useStyles();
  const [willShowPopup, setWillShowPopup] = useState(false);

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


  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener);
    };
  }, []);
  
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
      </div>
    </div>
  );
  
};

export default Layout;
