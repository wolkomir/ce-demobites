import React, {useEffect} from 'react';
import browser from 'webextension-polyfill';

import './styles.scss';
import { MESSAGE_ACTION, Message } from '../Config';
import { blobToBinary } from '../Utils/extensionUtils';

const Popup = () => {

  let recorder:MediaRecorder|null = null;
  const data:Blob[] = [];
  let intervalId = 0;
  let secondsRemainingToStopRecording: number = 0;
  let intervalId: number = 0;

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

  const startStopRecordingTimer = () => {
    intervalId = window.setInterval(() => {
      secondsRemainingToStopRecording--;
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
    console.log({ msg });
    switch (msg.action) {
      case MESSAGE_ACTION.START_RECORDING: {
        const {streamId, selectedMicrophoneDeviceId, maxDurationInSeconds} = msg.data
        chrome.tabCapture.capture(
          {
            audio: selectedMicrophoneDeviceId.length > 0 ? true : false,
            video: true,
            videoConstraints: {
              mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId,
                minFrameRate: 20,
                maxFrameRate: 30,
              },
            },
          },
          async (tabMediaStream) => {
            console.log({tabMediaStream});
            const mediaStreamTracks: MediaStreamTrack[] = [];
            if (tabMediaStream) {
              mediaStreamTracks.push(...tabMediaStream.getVideoTracks());
            }
            if (selectedMicrophoneDeviceId.length > 0) {
              const desktopAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  deviceId:  {exact: selectedMicrophoneDeviceId},
                  autoGainControl: true,
                  echoCancellation: true,
                  noiseSuppression: true,
                },
                video: false,
              });
              console.log({desktopAudioStream});
  
              const audioTracks = desktopAudioStream.getAudioTracks();
    
              const audioContext = new AudioContext();
              const destination = audioContext.createMediaStreamDestination();
              // Add each audio track from sourceStream to destinationStream
              audioTracks.forEach((track) => {
                // tabMediaStream!.addTrack(track);
                mediaStreamTracks.push(track);
                console.log('Audio track added to the destination stream:', track);
                const mediaSource = audioContext.createMediaStreamSource(
                  new MediaStream([track])
                );
                mediaSource.connect(destination);
              });
            }
            
  
            recorder = new MediaRecorder(
              new MediaStream(mediaStreamTracks),
              // tabMediaStream,
              {mimeType: 'video/webm'}
            );
            recorder.ondataavailable = (event: any) => data.push(event.data);
            recorder.onstop = async () => {
              const blob = new Blob(data, {type: 'video/webm'});
              // window.open(URL.createObjectURL(blob), '_blank');
              // tabMediaStream!.getTracks().forEach((track) => track.stop());
              // desktopAudioStream.getTracks().forEach((track) => track.stop());
              mediaStreamTracks.forEach((track) => track.stop());
              // Clear state ready for next recording
              recorder = null;
              const binaryData = await blobToBinary(blob);
              console.log({dataInPinnedTab: data, binaryData})
              browser.runtime.sendMessage({action: MESSAGE_ACTION.RECORDING_COMPLETED, data: binaryData})
              // data.splice(0, data.length);
            };
            recorder.start();
            secondsRemainingToStopRecording = maxDurationInSeconds;
            startStopRecordingTimer();
          }
        );
        return true;
      }
      case MESSAGE_ACTION.STOP_RECORDING: {
        stopRecording();
        break;
      }
      default:
        return true;
    }
    return true;
  };

  useEffect(() => {
    browser.runtime.onMessage.addListener(onMessageListener)
    intervalId = window.setInterval(() => {
       browser.runtime.sendMessage({action: 'keep_alive'});
    }, 15000);
    return () => {
      browser.runtime.onMessage.removeListener(onMessageListener)
      if (intervalId > 0) {
        window.clearInterval(intervalId)
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

export default Popup;
