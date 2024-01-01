import browser from "webextension-polyfill";

import * as BrowserStorage from "./storage";
import { MESSAGE_ACTION, PERMISSIONS } from "../Config";
import _ from "lodash";

export const isFirefox = () =>
  globalThis.navigator?.userAgent.includes("Firefox");

export const browserAction = isFirefox() ? "browserAction" : "action";
export const browserActionContext = isFirefox() ? "browser_action" : "action";

export const getActiveTab = async () => {
  const tabs = await browser.tabs.query({
    currentWindow: true,
    active: true,
  });
  return (tabs && tabs.length > 0 && tabs[0]) || null;
};

export function showNotification(title = "This tab is not recordable", message = "We will not be able to record this tab. Please choose other tab.") {
  const options = {
    type: "basic" as browser.Notifications.TemplateType,
    iconUrl: browser.runtime.getURL("assets/Icons/icon-128.png"),
    title,
    message,
  };
  let id = "demobites_" + new Date().getTime();
  browser.notifications.create(id, options);
}

export const handleContentScriptInjection = async (
  tabId: number,
  url: string
) => {
  try {
    if (!isScriptableUrl(url)) {
      // showNotification('Error', 'Extension is not allowed to access this page');
      return false;
    }
    let isInjected = await isScriptInjected(tabId);
    return true;
  } catch (e: any) {
    await injectContentScript(tabId);
    return true;
  }
};

export const injectContentScript = async (tabId: number) => {
  try {
    if (isFirefox()) {
      await browser.tabs.executeScript(tabId, {
        file: "/js/contentScript.bundle.js",
        allFrames: false,
      });
    } else {
      await browser.scripting.executeScript({
        target: { tabId: tabId, allFrames: false },
        files: ["/js/contentScript.bundle.js"],
      });
    }

    return true;
  } catch (e: any) {
    console.warn("contentScript injection error:::", e.message);
  }
};

export const isScriptInjected = (tabId: number) => {
  try {
    return sentMessageToContentScript(
      tabId,
      MESSAGE_ACTION.IS_SCRIPT_INJECTED,
      { action: MESSAGE_ACTION.IS_SCRIPT_INJECTED }
    );
  } catch (e) {
    return null;
  }
};

export const sentMessageToContentScript = (
  tabId: number,
  action: MESSAGE_ACTION,
  data = {}
) => {
  try {
    return browser.tabs.sendMessage(tabId, { action, data });
  } catch(e) {}
  
};

export const sendMessageToAllTab = (action: MESSAGE_ACTION, data = {}) => {
  browser.tabs
    .query({})
    .then(async (tabs: browser.Tabs.Tab[]) => {
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        try {
          if (tab.id) {
            await browser.tabs.sendMessage(tab.id, { action, data });
          }
        } catch (error) {}
      }
    })
    .catch((error: any) => {
      // console.log({error});
    });
};

export const sendMessageToExtensionPages = async (
  action: MESSAGE_ACTION,
  data = {}
) => {
  try {
    return browser.runtime.sendMessage({ action, data });
  } catch (e) {
    console.error("send message to extension pages error : ", e);
    return null;
  }
};

// Sourced from:
// https://source.chromium.org/chromium/chromium/src/+/main:extensions/common/extension_urls.cc;drc=6b42116fe3b3d93a77750bdcc07948e98a728405;l=29
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts
const blockedPrefixes = [
  "chrome.google.com/webstore", // Host *and* pathname
  "accounts-static.cdn.mozilla.net",
  "accounts.firefox.com",
  "addons.cdn.mozilla.net",
  "addons.mozilla.org",
  "api.accounts.firefox.com",
  "content.cdn.mozilla.net",
  "discovery.addons.mozilla.org",
  "input.mozilla.org",
  "install.mozilla.org",
  "oauth.accounts.firefox.com",
  "profile.accounts.firefox.com",
  "support.mozilla.org",
  "sync.services.mozilla.com",
  "testpilot.firefox.com",
];

export const isScriptableUrl = (url: string) => {
  if (!url || !url.startsWith("http")) return false;
  const cleanUrl = url.replace(/^https?:\/\//, "");
  return !(blockedPrefixes.some((blocked) => cleanUrl.startsWith(blocked)));
};

export const handleUpdateUserInfo = async (
  action: MESSAGE_ACTION,
  data = {}
) => {
  try {
    // return browser.runtime.sendMessage({ action, data });
  } catch (e) {
    console.error("update user info : ", e);
  }
};


export const checkIsEmpty = (data:string):string =>{
  if(!_.isEmpty(data)){
    return data
  }
  return ""
}

export const dateFormat = (timestamp:number): string=> {
  const date = new Date(timestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds

  const options:Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options);
}

export const  getPermissionStatus = async (permissionName: string) => {
  let status = PERMISSIONS.DENIED;
  
  try {
    const permissionStatus = await navigator.permissions.query({name: permissionName as PermissionName});
    status = permissionStatus.state;
  } catch(error) {
    
  }
  return status;
}

export const blobToBinary = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  
  const values = new Int8Array(buffer);
  const stringValues:string[] = [];
  values.forEach((value) => {
    stringValues.push(value.toString(2));
  })
  return stringValues.join(' ');
};

export const binaryToBlob = (binary: string, type: string) => {
  const byteNumbers = binary.split(' ').map((bin: string) => parseInt(bin, 2));
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type });
  return blob;
}