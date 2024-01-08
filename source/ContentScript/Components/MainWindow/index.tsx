import React from 'react'
import { Flex, Image, Select, Tooltip } from '@mantine/core';

import useStyles from "./mainWindow.style"
import { getImagePath } from '../../../Utils';
import { URLS } from '../../../Config';
import FramseSizeButton from '../FrameSizeButton';

export type SelectOption = {
  value: string;
  label: string;
}

type MainWindowProps = {
  initialWindowWidth: number,
  initialWindowHeight: number,
  microphoneDevices: SelectOption[],
  selectedMicrophone: string | null,
  onMicrodeviceChange: (microphone: string) => void,
  startRecording: () => void,
};

export default function MainWindow(props: MainWindowProps) {

  const {
    initialWindowWidth,
    initialWindowHeight,
    microphoneDevices,
    selectedMicrophone,
    onMicrodeviceChange,
    startRecording
  } = props;

  const { classes } = useStyles();
  
  const goToPage = (page: string) => {
    window.open(page, "_blank");
  }

  /*
  const DropdownComponent = forwardRef<HTMLDivElement>(
    (_, ref) => (
      <div ref={ref} className={classes.dropdownContainer}>
        
      </div>
    )
  );
  */
  
  return (
    <div className={classes.container} onClick={(event) => {event.stopPropagation()}}>
      <Flex style={{justifyContent: 'space-between', alignItems: 'center', width:'100%'}}>
        <Image style={{cursor: 'pointer'}} onClick={() => goToPage(URLS.MAIN_WEBSITE)} src={getImagePath("logo.png")} width={20} height={25} alt="Demobites" />
        <FramseSizeButton initialWidth={initialWindowWidth} initialHeight={initialWindowHeight} />
        <Tooltip position={"top"} withArrow label="Blur Content">
          <Image style={{cursor: 'pointer'}} src={getImagePath("blur_off.png")} width={22} height={22} alt="Blue" />
        </Tooltip>
        <Tooltip position={"top"} withArrow label="Videos">
          <Image style={{cursor: 'pointer'}} src={getImagePath("library_icon.png")} width={18.5} height={13} alt="Library" />
        </Tooltip>
      </Flex>
      
      <Select
        // dropdownComponent={DropdownComponent}
        // inputContainer={() => (
        //   <div className={classes.roundedButton}>
        //     <img width={13} height={11} src={getImagePath('alert-triangle.png')} alt="Microphone not allowed" />
        //     <span style={{marginLeft: '7px', borderBottom: '1px solid #979797',}}>set audio</span>
        //   </div>
        // )}
        data={microphoneDevices}
        mt={20}
        mb={20}
        value={selectedMicrophone}
        onChange={onMicrodeviceChange}
      />
      <button onClick={startRecording} className={classes.roundedButton} style={{backgroundColor: 'rgba(98,93,245,0.33)'}}>
        <div className={classes.redOval}/>
        <span className={classes.recordText}>Record</span>
      </button>
    </div>
  )
}
