import React, {useEffect} from 'react';
import browser, { Runtime } from 'webextension-polyfill';
import fixWebmDuration from "fix-webm-duration";

import './styles.scss';
import { MESSAGE_ACTION, Message } from '../Config';
import { blobToBinary, sendMessageToExtensionPages } from '../Utils/extensionUtils';

const MAXIMUM_LENGTH_OF_BINARY_DATA = 45000000;


const PinnedTab = () => {

  let recorder:MediaRecorder|null = null;
  const data:Blob[] = [];
  let intervalIdForKeepAlive = 0;
  let maximumDurationInSeconds: number = 0;
  let intervalId: number = 0;
  let startTime: number = 0;
  let mediaStreamTracks: MediaStreamTrack[] = [];

  const stopRecording = () => {
    if (intervalId > 0) {
      window.clearInterval(intervalId);
    }
    if (recorder) {
      recorder.stop();
  
      // Stopping the tracks makes sure the recording icon in the tab is removed.
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
  }

  const cancelRecording = () => {
    if (recorder) {
      recorder.onstop = null;
      stopRecording();
    }
  }

  const onSecondElapsed = () => {
    const currentTime = Date.now();
    const secondsRemainingToStopRecording = Math.ceil(maximumDurationInSeconds - (currentTime-startTime)/1000);
    if (secondsRemainingToStopRecording <= 0) {
      window.clearInterval(intervalId);
      intervalId = 0;
      sendMessageToExtensionPages(MESSAGE_ACTION.RECORDING_STOPPED_DUE_TO_TIME_LIMIT);
    } else if(secondsRemainingToStopRecording < 10) {
      sendMessageToExtensionPages(MESSAGE_ACTION.RECORDING_TIME_REMAINING, {secondsRemainingToStopRecording});
    }
  }

  const startStopRecordingTimer = () => {
    intervalId = window.setInterval(() => {
      onSecondElapsed();
    }, 1000)
  }

  const recorderOnStart = () => {
    startTime = Date.now();
    sendMessageToExtensionPages(MESSAGE_ACTION.RECORDING_STARTED);
  }

  const recorderOnStop = async () => {
    recorder = null;
    const duration = Date.now() - startTime;
    const blobWithoutDuration = new Blob(data, {type: 'video/webm'});
    const blob = await fixWebmDuration(blobWithoutDuration, duration, {logger: false});
    
    mediaStreamTracks.forEach((track) => track.stop());
    
    const binaryData = await blobToBinary(blob);
    const binaryDataParts:string[] = [];
    for (let i = 0; i < binaryData.length; i += MAXIMUM_LENGTH_OF_BINARY_DATA) {
      binaryDataParts.push(binaryData.substring(i, i + MAXIMUM_LENGTH_OF_BINARY_DATA));
    }
    for (let i = 0; i < binaryDataParts.length; i++) {
      setTimeout(() => {
        sendMessageToExtensionPages(MESSAGE_ACTION.RECORDING_COMPLETED, {blobUrl: URL.createObjectURL(blob), binaryData:binaryDataParts[i], binaryDataPart: i, binaryDataTotalParts: binaryDataParts.length, binaryDataLength: binaryData.length});
      }, 50);
    }
  }

  const onMessageListener = async (msg: Message, sender: Runtime.MessageSender, sendResponse: any) => {
    switch (msg.action) {
      case MESSAGE_ACTION.INITIATE_RECORDING: {
        sendResponse({status: true});
        data.splice(0, data.length);
        const {selectedMicrophoneDeviceLabel, maxDurationInSeconds, targetTabId} = msg.data
        maximumDurationInSeconds = maxDurationInSeconds;
        chrome.tabCapture.getMediaStreamId({
            targetTabId
          }, async (streamId) => {
            chrome.tabCapture.capture(
              {
                audio: selectedMicrophoneDeviceLabel.length > 0 ? true : false,
                video: true,
                videoConstraints: {
                  mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId,
                    minFrameRate: 20,
                    maxFrameRate: 30,
                    maxWidth: 1920,
                    maxHeight: 1080,
                  },
                },
              },
              async (tabMediaStream) => {
                mediaStreamTracks = [];
                if (tabMediaStream) {
                  mediaStreamTracks.push(...tabMediaStream.getVideoTracks());
                }
                
                const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.label);
                const selectedDevice = devices.find((device) => device.label === selectedMicrophoneDeviceLabel);
                const deviceId = selectedDevice ? selectedDevice.deviceId : "";
                if (deviceId.length > 0) {
                  try {
                    
                    const desktopAudioStream = await window.navigator.mediaDevices.getUserMedia({
                      audio: {
                        deviceId:  {exact: deviceId},
                        autoGainControl: true,
                        echoCancellation: true,
                        noiseSuppression: true,
                      },
                      video: false,
                    });
                    
                    const audioTracks = desktopAudioStream.getAudioTracks();
          
                    const audioContext = new AudioContext();
                    const destination = audioContext.createMediaStreamDestination();
                    // Add each audio track from sourceStream to destinationStream
                    audioTracks.forEach((track) => {
                      // tabMediaStream!.addTrack(track);
                      mediaStreamTracks.push(track);
                      const mediaSource = audioContext.createMediaStreamSource(
                        new MediaStream([track])
                      );
                      mediaSource.connect(destination);
                    });
                  } catch(error) {
                    sendMessageToExtensionPages(MESSAGE_ACTION.RECORDING_CANCELLED, {error: "Recording cancelled. You might have not allowed to record audio."});
                    return;
                  }
                }
    
                recorder = new MediaRecorder(
                  new MediaStream(mediaStreamTracks),
                  {mimeType: 'video/webm'}
                  // {
                  //   audioBitsPerSecond: 128000,
                  //   videoBitsPerSecond: 2500000,
                  //   mimeType: 'video/x-matroska;codecs=avc1',
                  // }
                );
                recorder.ondataavailable = (event: any) => {
                  data.push(event.data);
                }
                recorder.onstart = () => {
                  recorderOnStart();
                }
                recorder.onstop = async () => {
                  recorderOnStop();
                };
                // recorder.start();
                // startStopRecordingTimer();
              }
            );
          });
        return;
      }
      case MESSAGE_ACTION.START_RECORDING: {
        if (recorder) {
          recorder.start();
          startStopRecordingTimer();
        } else {
          sendMessageToExtensionPages(MESSAGE_ACTION.RECORDING_CANCELLED, {error: "Recording cancelled. Couldn't start recording."});
        }
        break;
      }
      case MESSAGE_ACTION.STOP_RECORDING: {
        stopRecording();
        break;
      }
      case MESSAGE_ACTION.CANCEL_RECORDING: {
        cancelRecording();
        break;
      }
      default:
        break;
    }
    sendResponse({status: true});
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener)
    intervalIdForKeepAlive = window.setInterval(() => {
      sendMessageToExtensionPages(MESSAGE_ACTION.KEEP_ALIVE);
    }, 15000);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener)
      if (intervalIdForKeepAlive > 0) {
        window.clearInterval(intervalIdForKeepAlive)
      }
    }
  }, [])
  
  return (
    <section id="popup">
      <h2>Demo Bites</h2>
      Don't close this tab while recording. This tab will be closed automatically when recording finished.
    </section>
  );
};

export default PinnedTab;
