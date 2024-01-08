import React, { useEffect, useState } from 'react'

import useStyles from "./recordingCountDown.style"
import { WAITING_TIME_FOR_STARTING_RECORDING_IN_SECONDS } from '../../../Config';
import { getImagePath } from '../../../Utils';

export default function RecordingCountDown({onCountDownEnd} : {onCountDownEnd: () => void}) {

  const [timeLeftToStartRecording, setTimeLeftToStartRecording] = useState<number>(WAITING_TIME_FOR_STARTING_RECORDING_IN_SECONDS);
  let intervalId = 0;

  const { classes } = useStyles();

  const startRecordingCountDownTimer = () => {
    intervalId = window.setInterval(() => {
      setTimeLeftToStartRecording(previousValue => {
        if (previousValue <= 1) {
          if (intervalId > 0) {
            window.clearInterval(intervalId);
          }
        }
        return previousValue - 1;
      });
    }, 1000);
  }

  useEffect(() => {

    startRecordingCountDownTimer();

    () => {
      if (intervalId > 0) {
        window.clearInterval(intervalId);
      }
    }
  }, [])

  if (timeLeftToStartRecording <= 0) {
    onCountDownEnd();
    return null;
  }

  return (
    <div
      className={classes.container}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <div className={classes.countDownOval}>
       <span className={classes.countDownText}>{timeLeftToStartRecording}</span>
      </div>
      <div className={classes.infoContainer}>
        <img src={getImagePath("arrow-up-right.png")} alt="" width={40} height={40} style={{alignSelf: 'flex-end',}} />
        <div className={classes.infoTextContainer}>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
            <span className={classes.infoText}>Click the</span>
            <div className={classes.recordingIconOval} />
            <span className={classes.infoText}>button to</span>
          </div>
          <span className={classes.infoText}>to stop recording</span>
        </div>
      </div>
    </div>
  )
}
