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
  getActiveTab,
  showNotification,
  isScriptableUrl,
} from "../Utils/extensionUtils";
import { getImagePath } from "../Utils";

let isRecording:boolean = false;
let pinnedTabId:number = 0;
let isWaitingForUploadOrDeletingRecording: boolean = false;
let recordingData:Blob | null = null;
let recordingInitiatedOnTabId: number = 0;
let recordingInitiatedOnWindowId: number = 0;
let recordingBinaryDataParts: string[] = [];
let recordingBinaryDataPartsRecieved: number = 0;
let lastTabIdExtensionClickedOn = 0;

const focusThRecordingTab = () => {
  browser.windows.update(recordingInitiatedOnWindowId, {focused: true})
  browser.tabs.update(recordingInitiatedOnTabId, {
    active: true,
  })
}

const stopRecording = () => {
  isWaitingForUploadOrDeletingRecording = true;
  sentMessageToContentScript(recordingInitiatedOnTabId, MESSAGE_ACTION.PROCESSING_RECORDING);
  focusThRecordingTab();
  isRecording = false;
  sentMessageToContentScript(pinnedTabId, MESSAGE_ACTION.STOP_RECORDING);
  browser.action.setIcon({path: getImagePath("not-recording.png")});
  browser.action.setBadgeText({
    text: ''
  });
}

const showTabNotRecordableNotification = () => {
  showNotification();
}

const sendTogglePopupMessage = (tabId: number) => {
  try {
    sentMessageToContentScript(tabId, MESSAGE_ACTION.TOGGLE_POPUP);
  } catch(error) {
    if (tabId === lastTabIdExtensionClickedOn) {
      sendTogglePopupMessage(tabId);
    }
  }
}

const toolbarIconClick = async (tab: Tabs.Tab) => {
  try {
    // if (tab.status !== 'complete') {
    //   return;
    // }
    if (!tab.url || !tab.id) {
      showTabNotRecordableNotification();
      return;
    }
    // await handleContentScriptInjection(tab.id, tab.url);
    
    if (isRecording) {
      stopRecording();
    } else {
      if (isWaitingForUploadOrDeletingRecording) {
        focusThRecordingTab();
      } else {
        if (isScriptableUrl(tab.url)) {
          if (pinnedTabId > 0) {
            resetRecordingSession();
          }
          if (lastTabIdExtensionClickedOn > 0 && lastTabIdExtensionClickedOn !== tab.id) {
            await sentMessageToContentScript(lastTabIdExtensionClickedOn, MESSAGE_ACTION.HIDE_POPUP);
          }
          lastTabIdExtensionClickedOn = tab.id;
          sendTogglePopupMessage(tab.id);
        } else {
          showTabNotRecordableNotification();
        }
      }
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
        return {success: true, error: null};
      } else {
        return {success: false, error: "Something went wrong. Please try again."};
      }
    } else {
      return {success: false, error: "Something went wrong. Please try again."};
    }
  } catch(error) {
    return {success: false, error: "Something went wrong. Please try again."};
  }
}

const resetRecordingSession = () => {
  isWaitingForUploadOrDeletingRecording = false;
  recordingInitiatedOnTabId = 0;
  recordingInitiatedOnWindowId = 0;
  recordingData = null;
  browser.action.setIcon({path: getImagePath("not-recording.png")});
  browser.action.setBadgeText({
    text: ''
  });
  isRecording = false;
  if (pinnedTabId > 0) {
    browser.tabs.remove(pinnedTabId);
    pinnedTabId = 0;
  }
  recordingBinaryDataParts = [];
  recordingBinaryDataPartsRecieved = 0;
}

const onMessageListener = async (
  msg: Message,
  sender: Runtime.MessageSender,
  sendResponse: any
) => {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;
  try {
    switch (msg.action) {
      case MESSAGE_ACTION.RESET_RECORDING_SESSION_IF_NOT_RECORDING: {
        if (isWaitingForUploadOrDeletingRecording && tabId === recordingInitiatedOnTabId) {
          resetRecordingSession();
        }
        break;
      }
      case MESSAGE_ACTION.HIDE_POPUP: {
        sendResponse({status: true});
        if (tabId) {
          sentMessageToContentScript(tabId, MESSAGE_ACTION.HIDE_POPUP);
        }
        return;
      }
      case MESSAGE_ACTION.SHOW_POPUP: {
        sendResponse({status: true});
        if (tabId) {
          sentMessageToContentScript(tabId, MESSAGE_ACTION.SHOW_POPUP);
        }
        return;
      }
      case MESSAGE_ACTION.GET_SETUP_DATA: {
        sendResponse({status: true});
        const response = await fetchSetupData();
        return response;
      }
      case MESSAGE_ACTION.START_RECORDING: {
        if (!tabId) {
          break;
        }
        sendResponse({status: true});
        recordingInitiatedOnTabId = tabId;
        recordingInitiatedOnWindowId = windowId!;
        const {selectedMicrophoneDeviceLabel, maxDurationInSeconds} = msg.data;
          
          try {
            pinnedTabId = (
              await chrome.tabs.create({
                pinned: true,
                url: './pinnedTab.html',
                active: false,
                index: 0,
              })
            ).id!;

            setTimeout(() => {
              if (pinnedTabId > 0) {
                // isRecording = true;
                // chrome.action.setIcon({path: getImagePath("recording.png")});
                sentMessageToContentScript(pinnedTabId, MESSAGE_ACTION.START_RECORDING,
                  {
                    // streamId,
                    selectedMicrophoneDeviceLabel,
                    maxDurationInSeconds,
                    tabId
                  }
                );
                
              }
            }, 1000);
            
          } catch(error) {
            
          }
          
        return;
      }
      case MESSAGE_ACTION.RECORDING_STARTED: {
        sendResponse({status: true});
        if (tabId === pinnedTabId) {
          isRecording = true;
          chrome.action.setIcon({path: getImagePath("recording.png")});
        } else {
          if (tabId) {
            sentMessageToContentScript(tabId, MESSAGE_ACTION.CANCEL_RECORDING);
            resetRecordingSession();
          }
        }
        return;
      }
      case MESSAGE_ACTION.RECORDING_TIME_REMAINING: {
        const {secondsRemainingToStopRecording} = msg.data;
        browser.action.setBadgeText({
          text: `${secondsRemainingToStopRecording}`
        });
        break;
      }
      case MESSAGE_ACTION.RECORDING_CANCELLED: {
        sendResponse({status: true});
        sentMessageToContentScript(recordingInitiatedOnTabId, MESSAGE_ACTION.RECORDING_CANCELLED,msg.data);
        resetRecordingSession();
        return;
      }
      case MESSAGE_ACTION.STOP_RECORDING: {
        sendResponse({status: true});
        stopRecording();
        return;
      }
      case MESSAGE_ACTION.RECORDING_COMPLETED: {
        sendResponse({status: true});
        const {binaryData, blobUrl, binaryDataPart, binaryDataTotalParts, binaryDataLength} = msg.data;
        
        recordingBinaryDataParts[binaryDataPart] = binaryData;
        recordingBinaryDataPartsRecieved++;

        if (recordingBinaryDataPartsRecieved === binaryDataTotalParts) {
          // chrome.tabs.create({
          //   url: blobUrl,
          //   active: true,
          // })
          const fullRecordingBinaryData = recordingBinaryDataParts.join("");
          const blob: Blob = binaryToBlob(fullRecordingBinaryData, 'video/webm');

          recordingData = blob;
          
          if (pinnedTabId > 0) {
            // setTimeout(() => {
            //   browser.tabs.remove(pinnedTabId);
            //   pinnedTabId = 0;
            // }, 2000);
            browser.tabs.remove(pinnedTabId);
            pinnedTabId = 0;
          }

          sentMessageToContentScript(recordingInitiatedOnTabId, MESSAGE_ACTION.RECORDING_COMPLETED);
        }
        return;
      }
      case MESSAGE_ACTION.UPLOAD_RECORDING: {
        sendResponse({status: true});
        const {success, error} = await uploadRecordingData(recordingData!);
        sentMessageToContentScript(recordingInitiatedOnTabId, MESSAGE_ACTION.UPLOAD_RECORDING_COMPLETED,{
            success,
            error
          }
        );
        resetRecordingSession();
        return;
      }
      case MESSAGE_ACTION.DELETE_RECORDING: {
        resetRecordingSession();
        break;
      }
      case MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_GRANTED: {
        sendResponse({status: true});
        try {
          const activeTab = await getActiveTab();
          if (activeTab && activeTab.id) {
            sentMessageToContentScript(activeTab.id, MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_GRANTED, msg.data)
          }
        } catch(e) {

        }
        return;
      }
      case MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_DENIED: {
        sendResponse({status: true});
        try {
          const activeTab = await getActiveTab();
          if (activeTab && activeTab.id) {
            sentMessageToContentScript(activeTab.id, MESSAGE_ACTION.MICROPHONE_DEVICE_PERMISSION_DENIED)
          }
        } catch(e) {

        }
        return;
      }
      default:
        break;
    }
  } catch (error) {}
  sendResponse({status: true});
};

const onInstalled = (details: Runtime.OnInstalledDetailsType) => {
  
};

const tabUpdateHandler = async (
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tabInfo: browser.Tabs.Tab
) => {
  // if (changeInfo.status === "complete" && tabInfo.url) {
  //   console.log("tab UpdateHandler Changed attributes: ", changeInfo);
  // }
};

const tabRemoveHandler = async (tabId: number, removeInfo: browser.Tabs.OnRemovedRemoveInfoType) => {
  if (tabId === recordingInitiatedOnTabId) {
    if (isRecording) {
      try {
        if (pinnedTabId > 0) {
          sentMessageToContentScript(pinnedTabId, MESSAGE_ACTION.CANCEL_RECORDING);
        }
      } catch(e) {
  
      }
      setTimeout(() => {
        resetRecordingSession();  
      }, 1000);
      
    } else if (isWaitingForUploadOrDeletingRecording) {
      resetRecordingSession();
    }
  } else if (tabId === pinnedTabId) {
    pinnedTabId = 0;
    if (recordingInitiatedOnTabId > 0 && isRecording) {
      sentMessageToContentScript(recordingInitiatedOnTabId, MESSAGE_ACTION.RECORDING_CANCELLED,{error: "Recording cancelled as the recording controlling tab was closed."}
      );
    }
    setTimeout(() => {
      resetRecordingSession();  
    }, 500);
    
  }
};


browser.runtime.onMessage.addListener(onMessageListener);
browser[browserAction].onClicked.addListener(toolbarIconClick);
browser.tabs.onUpdated.addListener(tabUpdateHandler);
browser.tabs.onRemoved.addListener(tabRemoveHandler)
browser.runtime.onInstalled.addListener(onInstalled);

// async function createOffscreen() {
//   if (await chrome.offscreen.hasDocument?.()) return;
//   console.log('Creating offscreen');
//   chrome.offscreen.createDocument({
//     url: chrome.runtime.getURL("assets/offscreen.html"),
//     reasons: ["USER_MEDIA" as chrome.offscreen.Reason],
//     justification: 'Getting permission for recording audio from microphone',
//   });
// }

// createOffscreen();
