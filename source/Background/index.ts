import browser, { Runtime, Tabs } from "webextension-polyfill";
import {
  API_URL,
  Message,
  MESSAGE_ACTION,
  PARAMETER_KEY,
} from "../Config";

import {
  sentMessageToContentScript,
  browserAction,
  sendMessageToAllTab,
  handleContentScriptInjection,
  binaryToBlob,
} from "../Utils/extensionUtils";
import { getImagePath } from "../Utils";

let isRecording:boolean = false;
let pinnedTabId:number = 0;
let isWaitingForUploadOrDeletingRecording: boolean = false;
let recordingData:Blob | null = null;
let recordingInitiatedOnTabId: number = 0;

const stopRecording = () => {
  isRecording = false;
  browser.tabs.sendMessage(pinnedTabId, {
    action: MESSAGE_ACTION.STOP_RECORDING,
  });
  browser.action.setIcon({path: getImagePath("not-recording.png")});
}

const toolbarIconClick = async (tab: Tabs.Tab) => {
  console.log("toolbar button clicked", tab);
  try {
    if (tab.status !== 'complete') return;
    if (!tab.url || !tab.id) return;
    // await handleContentScriptInjection(tab.id, tab.url);
    if (tab?.url && tab?.id) {
      if (tab.status === "complete") {
        if (isRecording) {
          stopRecording();
        } else {
          if (!isWaitingForUploadOrDeletingRecording) {
            await sentMessageToContentScript(tab.id, MESSAGE_ACTION.TOGGLE_POPUP);
          }
        }
        
      } else {
        
      }
    } else {
      
    }
  } catch (error) {
    
  }
};

const fetchSetupData = async () => {
  try {
    const response = await fetch(API_URL.SETUP, {
      method: 'POST',
      body: JSON.stringify({[PARAMETER_KEY.CID]: "1234567"})
    });
    const jsonResponse = await response.json();
    if (jsonResponse[PARAMETER_KEY.STATE] === 'ok') {
      return {success: true, error: null, maxDurationInSeconds: jsonResponse[PARAMETER_KEY.MAX_DURATION]};
    } else {
      return {success: false, error: "Something went wrong. Please try again."};
    }
  } catch(error) {
    console.log({error})
    return {success: false, error: "Something went wrong. Please try again."};
  }
}

const uploadRecordingData = async (data: Blob) => {
  try {
    const uploadPreparationResponse = await fetch(API_URL.PRE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify({[PARAMETER_KEY.CID]: "1234567"})
    });
    const jsonResponse = await uploadPreparationResponse.json();
    if (jsonResponse[PARAMETER_KEY.STATE] === 'ok') {
      const uploadResponse = await fetch(jsonResponse[PARAMETER_KEY.PRE_SIGNED_URL_VIDEO_FILE], {
        method: 'PUT',
        body: data,
        headers: {
          'Content-Type': 'video/webm'
        }
      })
      if (uploadResponse.ok) {
        console.log('File uploaded successfully');
        return {success: true, error: null};
      } else {
        console.error('Error uploading file. Status:', uploadResponse.status);
        return {success: false, error: "Something went wrong. Please try again."};
      }
    } else {
      return {success: false, error: "Something went wrong. Please try again."};
    }
  } catch(error) {
    console.log({error})
    return {success: false, error: "Something went wrong. Please try again."};
  }
}

const resetRecordingSession = () => {
  isWaitingForUploadOrDeletingRecording = false;
  recordingInitiatedOnTabId = 0;
  recordingData = null;
}

const onMessageListener = async (
  msg: Message,
  sender: Runtime.MessageSender,
  sendResponse: any
) => {
  console.log("onMessageListener:::", msg);
  try {
    switch (msg.action) {
      case MESSAGE_ACTION.HIDE_POPUP: {
        if (sender.tab?.id) {
          sentMessageToContentScript(sender.tab.id, MESSAGE_ACTION.HIDE_POPUP);
        }
        break;
      }
      case MESSAGE_ACTION.SHOW_POPUP: {
        if (sender.tab?.id) {
          sentMessageToContentScript(sender.tab.id, MESSAGE_ACTION.SHOW_POPUP);
        }
        break;
      }
      case MESSAGE_ACTION.GET_SETUP_DATA: {
        sendResponse({status: true});
        const response = await fetchSetupData();
        console.log({response});
        return response;
      }
      case MESSAGE_ACTION.START_RECORDING: {
        const targetTabId = sender.tab?.id;
        if (!targetTabId) {
          break;
        }
        recordingInitiatedOnTabId = targetTabId;
        const {selectedMicrophoneDeviceId, maxDurationInSeconds} = msg.data;
        chrome.tabCapture.getMediaStreamId({
          targetTabId
        }, async (streamId) => {
          console.log({selectedMicrophoneDeviceId, streamId})
          chrome.action.setIcon({path: getImagePath("recording.png")});
          isRecording = true;
          pinnedTabId = (
            await chrome.tabs.create({
              pinned: true,
              url: './pinnedTab.html',
              active: false,
              index: 0,
            })
          ).id!;
          setTimeout(() => {
            browser.tabs.sendMessage(pinnedTabId, {
              action: MESSAGE_ACTION.START_RECORDING,
              data: {
                streamId,
                selectedMicrophoneDeviceId,
                maxDurationInSeconds
              }
            });
          }, 1000);
        });
        break;
      }
      case MESSAGE_ACTION.RECORDING_TIME_REMAINING: {
        const {secondsRemainingToStopRecording} = msg.data;
        browser.action.setBadgeText({
          text: `${secondsRemainingToStopRecording}`
        });
        break;
      }
      case MESSAGE_ACTION.STOP_RECORDING: {
        browser.action.setBadgeText({
          text: ''
        });
        stopRecording();
        break;
      }
      case MESSAGE_ACTION.RECORDING_COMPLETED: {
        const {data} = msg;
        
        isWaitingForUploadOrDeletingRecording = true;
        
        const blob: Blob = binaryToBlob(data, 'video/webm');
        
        recordingData = blob;
        // uploadRecordingData(recordingData);
        
        if (pinnedTabId > 0) {
          browser.tabs.remove(pinnedTabId);
        }
        browser.tabs.sendMessage(recordingInitiatedOnTabId, {
          action: MESSAGE_ACTION.RECORDING_COMPLETED
        });
        break;
      }
      case MESSAGE_ACTION.UPLOAD_RECORDING: {
        const {success, error} = await uploadRecordingData(recordingData!);
        browser.tabs.sendMessage(recordingInitiatedOnTabId, {
          action: MESSAGE_ACTION.UPLOAD_RECORDING_COMPLETED,
          data: {
            success,
            error
          }
        });
        resetRecordingSession();
        break;
      }
      case MESSAGE_ACTION.DELETE_RECORDING: {
        resetRecordingSession();
        break;
      }
      default:
        break;
    }
  } catch (error) {}
  sendResponse({status: true});
};

const onInstalled = (details: Runtime.OnInstalledDetailsType) => {
  console.log("extension installed", details.reason);
};

const tabUpdateHandler = async (
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tabInfo: browser.Tabs.Tab
) => {
  if (changeInfo.status === "complete" && tabInfo.url) {
    console.log("tab UpdateHandler Changed attributes: ", changeInfo);
    if (isWaitingForUploadOrDeletingRecording && recordingInitiatedOnTabId === tabId) {
      resetRecordingSession();
    }
  }
};


browser.runtime.onMessage.addListener(onMessageListener);
browser[browserAction].onClicked.addListener(toolbarIconClick);
browser.tabs.onUpdated.addListener(tabUpdateHandler);
browser.runtime.onInstalled.addListener(onInstalled);

// async function createOffscreen() {
//   if (await chrome.offscreen.hasDocument?.()) return;
//   console.log('Creating offscreen');
//   chrome.offscreen.createDocument({
//     url: 'offscreen.html',
//     reasons: ["AUDIO_PLAYBACK"],
//     justification: 'keep service worker running for playing radio',
//   });
// }

// createOffscreen();
