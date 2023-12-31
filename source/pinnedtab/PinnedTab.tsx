import React, {useEffect} from 'react';
import browser from 'webextension-polyfill';
import fixWebmDuration from "fix-webm-duration";

import './styles.scss';
import { MESSAGE_ACTION, Message } from '../Config';
import { blobToBinary } from '../Utils/extensionUtils';

const MAXIMUM_LENGTH_OF_BINARY_DATA = 45000000;


const PinnedTab = () => {

  let recorder:MediaRecorder|null = null;
  const data:Blob[] = [];
  let intervalIdForKeepAlive = 0;
  let maximumDurationInSeconds: number = 0;
  let intervalId: number = 0;
  let startTime: number = 0;

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

  const startStopRecordingTimer = () => {
    intervalId = window.setInterval(() => {
      const currentTime = Date.now();
      const secondsRemainingToStopRecording = Math.ceil(maximumDurationInSeconds - (currentTime-startTime)/1000);
      if (secondsRemainingToStopRecording <= 0) {
        window.clearInterval(intervalId);
        intervalId = 0;
        browser.runtime.sendMessage({action: MESSAGE_ACTION.STOP_RECORDING})
      } else if(secondsRemainingToStopRecording < 10) {
        browser.runtime.sendMessage({action: MESSAGE_ACTION.RECORDING_TIME_REMAINING, data: {secondsRemainingToStopRecording}})
      }
    }, 1000)
  }

  const onMessageListener = async (msg: Message) => {
    switch (msg.action) {
      case MESSAGE_ACTION.START_RECORDING: {
        data.splice(0, data.length);
        const {selectedMicrophoneDeviceLabel, maxDurationInSeconds, targetTabId} = msg.data
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
                const mediaStreamTracks: MediaStreamTrack[] = [];
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
                    browser.runtime.sendMessage({action: MESSAGE_ACTION.RECORDING_CANCELLED, data: {error: "Recording cancelled. You might have not allowed to record audio."}})
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
                recorder.ondataavailable = (event: any) => data.push(event.data);
                recorder.onstart = () => {
                  startTime = Date.now();
                  browser.runtime.sendMessage({action: MESSAGE_ACTION.RECORDING_STARTED})
                  
                }
                recorder.onstop = async () => {
                  const duration = Date.now() - startTime;
                  const blobWithoutDuration = new Blob(data, {type: 'video/webm'});
                  const blob = await fixWebmDuration(blobWithoutDuration, duration, {logger: false});
                  
                  mediaStreamTracks.forEach((track) => track.stop());
                  recorder = null;
                  const binaryData = await blobToBinary(blob);
                  const binaryDataParts:string[] = [];
                  for (let i = 0; i < binaryData.length; i += MAXIMUM_LENGTH_OF_BINARY_DATA) {
                    binaryDataParts.push(binaryData.substring(i, i + MAXIMUM_LENGTH_OF_BINARY_DATA));
                  }
                  for (let i = 0; i < binaryDataParts.length; i++) {
                    setTimeout(() => {
                      browser.runtime.sendMessage({action: MESSAGE_ACTION.RECORDING_COMPLETED, data: {blobUrl: URL.createObjectURL(blob), binaryData:binaryDataParts[i], binaryDataPart: i, binaryDataTotalParts: binaryDataParts.length, binaryDataLength: binaryData.length}});  
                    }, 50);
                  }
                };
                maximumDurationInSeconds = maxDurationInSeconds;
                recorder.start();
                startStopRecordingTimer();
              }
            );
          });
        
        return true;
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
        return true;
    }
    return true;
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener)
    intervalIdForKeepAlive = window.setInterval(() => {
       browser.runtime.sendMessage({action: 'keep_alive'});
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
