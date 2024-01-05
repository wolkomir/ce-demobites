import React, { useEffect, useMemo, useState } from 'react'

import useStyles from "./frameSizeButton.style"
import useWindowSize from '../../../Hooks/useWindowSize';
import { sendMessageToExtensionPages } from '../../../Utils/extensionUtils';
import { MESSAGE_ACTION } from '../../../Config';

enum NextFrameState {
  Ratio_16_9 = 1,
  Ratio_4_3,
  Reset
}

export default function FramseSizeButton({initialWidth, initialHeight} : {initialWidth: number, initialHeight: number}) {
  const { classes } = useStyles();
  const windowSize = useWindowSize();
  const [nextFrameType, setNextFrameType] = useState<NextFrameState>(NextFrameState.Ratio_16_9);

  const calculateNextFrameType = async () => {
    const {windowWidth, windowHeight} = await sendMessageToExtensionPages(MESSAGE_ACTION.GET_WINDOW_SIZE);
    
    const target4_3RatioHeight = Math.round(windowWidth * (3 / 4));
    const target16_9RatioHeight = Math.round(windowWidth * (9 / 16));
    const target4_3RatioWidth = Math.round(windowHeight * (4 / 3));
    const target16_9RatioWidth = Math.round(windowHeight * (16 / 9));

    if (target4_3RatioHeight === windowHeight || target4_3RatioWidth === windowWidth) {
      if ((initialWidth/initialHeight) === (4 / 3)
      || (initialWidth/initialHeight) === (16 / 9)) {
        setNextFrameType(NextFrameState.Ratio_16_9);
      }
      setNextFrameType(NextFrameState.Reset);
    } else if (target16_9RatioHeight === windowHeight || windowWidth === target16_9RatioWidth) {
      setNextFrameType(NextFrameState.Ratio_4_3);
    } else {
      setNextFrameType(NextFrameState.Ratio_16_9);
    }
  }

  useEffect(() => {
    calculateNextFrameType();
  }, [windowSize, initialWidth, initialHeight]);

  const className = useMemo(() => {
    if (nextFrameType === NextFrameState.Ratio_16_9) {
      return classes.container_16_9;
    } else if (nextFrameType === NextFrameState.Ratio_4_3) {
      return classes.container_4_3;
    } else {
      return classes.container_reset;
    }
  }, [nextFrameType]);

  const sendMessageToBackgroundToResizeWindow = (windowWidth: number, windowHeight: number) => {
    sendMessageToExtensionPages(MESSAGE_ACTION.RESIZE_WINDOW, {windowWidth, windowHeight});
  }

  const changeWindowSizeByRation = async (widthRation: number, heightRation: number) => {
    const aspectRatio = widthRation / heightRation;
    const {windowWidth: currentWidth, windowHeight: currentHeight} = await sendMessageToExtensionPages(MESSAGE_ACTION.GET_WINDOW_SIZE);
    
    // Calculate the target width and height based on the current dimensions
    let targetWidth = Math.round(currentHeight * aspectRatio);
    let targetHeight = Math.round(currentWidth / aspectRatio);

    // Ensure the calculated dimensions fit within the available space
    if (targetWidth > currentWidth) {
      targetWidth = currentWidth;
      targetHeight = Math.round(currentWidth / aspectRatio);
    } else {
      targetHeight = currentHeight;
      targetWidth = Math.round(currentHeight * aspectRatio);
    }
    sendMessageToBackgroundToResizeWindow(targetWidth, targetHeight);
  }

  const changeWindowSize = () => {
    switch(nextFrameType) {
      case NextFrameState.Ratio_16_9: {
        changeWindowSizeByRation(16, 9);
        break;
      }
      case NextFrameState.Ratio_4_3: {
        changeWindowSizeByRation(4, 3);
        break;
      }
      case NextFrameState.Reset: {
        sendMessageToBackgroundToResizeWindow(initialWidth, initialHeight);
        break;
      }
      default:
        break;
    }
  }

  return (
    <div
      style={{cursor: 'pointer'}}
      onClick={(event) => {
        changeWindowSize();
        event.stopPropagation();
      }}
      className={className}/>
  )
}
