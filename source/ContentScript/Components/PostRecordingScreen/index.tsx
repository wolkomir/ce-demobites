import React, { useEffect, useState } from 'react'

import useStyles from "./postRecordingScreen.style"
import { State } from '../../../Config';
import { getImagePath } from '../../../Utils';

export default function PostRecordingScreen(
  {
    currentState,
    didFinishedDueToTimeLimit,
    timeLimit,
    uploadRecording,
    deleteRecording,
  } : 
  {
    currentState: State,
    didFinishedDueToTimeLimit: boolean,
    timeLimit: number,
    uploadRecording: () => void,
    deleteRecording: () => void,
  }) {

  const { classes } = useStyles();

  return (
    <div
      className={classes.container}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      { 
        currentState === State.ProcessingRecording && (
        <div className={classes.infoContainer}>
              <span>Processing Recording...</span>
        </div>)
      }
      {
        currentState === State.RecordingCompleted && (
          <>
            <div className={classes.infoContainer}>
              <span>{didFinishedDueToTimeLimit ? `Reached max ${timeLimit} seconds...` : 'Recording is done, now...'}</span>
              <img src={getImagePath('upload-and-process-button.png')} alt="" onClick={uploadRecording} style={{marginLeft: 10, cursor: 'pointer'}} width={147} height={30} />
            </div>
            <div 
              className={classes.deleteButtonContainer}
              onClick={deleteRecording}
            >
              <img src={getImagePath("trash-icon.png")} alt="Delete Recording" width={7} height={8} style={{marginRight: 8}} />
              <span className={classes.deleteRecordingText}>Delete recording</span>
            </div>
          </>
        )
      }
      {
        currentState === State.UploadingRecording && (
          <div className={classes.infoContainer}>
            <span>Don't close this tab till upload ends</span>
          </div>
        )
      }
    </div>
  )
}
