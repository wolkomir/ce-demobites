import browser, { Runtime, Tabs } from "webextension-polyfill";
import {
  API_URL,
  Message,
  MESSAGE_ACTION,
} from "../Config";

import {
  sentMessageToContentScript,
  browserAction,
  sendMessageToAllTab,
  handleContentScriptInjection,
} from "../Utils/extensionUtils";

const toolbarIconClick = async (tab: Tabs.Tab) => {
  console.log("toolbar button clicked", tab);
  try {
    if (tab.status !== 'complete') return;
    if (!tab.url || !tab.id) return;
    // await handleContentScriptInjection(tab.id, tab.url);
    if (tab?.url && tab?.id) {
      if (tab.status === "complete") {
        await sentMessageToContentScript(tab.id, MESSAGE_ACTION.TOGGLE_POPUP);
      } else {
        
      }
    } else {
      
    }
  } catch (error) {
    
  }
};

const onMessageListener = async (
  msg: Message,
  sender: Runtime.MessageSender
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
      default:
        break;
    }
  } catch (error) {}
  return true;
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
    
  }
};


browser.runtime.onMessage.addListener(onMessageListener);
browser[browserAction].onClicked.addListener(toolbarIconClick);
browser.tabs.onUpdated.addListener(tabUpdateHandler);
browser.runtime.onInstalled.addListener(onInstalled);
