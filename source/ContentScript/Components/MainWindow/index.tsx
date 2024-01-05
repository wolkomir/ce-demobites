import React from 'react'
import { Flex, Image } from '@mantine/core';

import useStyles from "./mainWindow.style"
import { getImagePath } from '../../../Utils';
import { URLS } from '../../../Config';
import FramseSizeButton from '../FrameSizeButton';

export default function MainWindow(
  {initialWindowWidth, initialWindowHeight}:
  {initialWindowWidth: number, initialWindowHeight: number}) {
  const { classes } = useStyles();

  const goToPage = (page: string) => {
    window.open(page, "_blank");
  }
  
  return (
    <div className={classes.container}>
      <Flex style={{justifyContent: 'space-between', alignItems: 'center'}}>
        <Image style={{cursor: 'pointer'}} onClick={() => goToPage(URLS.MAIN_WEBSITE)} src={getImagePath("logo.png")} width={20} height={25} alt="Demobites" />
        <FramseSizeButton initialWidth={initialWindowWidth} initialHeight={initialWindowHeight} />
        <Image style={{cursor: 'pointer'}} src={getImagePath("blur_off.png")} width={22} height={22} alt="Blue" />
        <Image style={{cursor: 'pointer'}} src={getImagePath("library_icon.png")} width={18.5} height={13} alt="Library" />
      </Flex>
    </div>
  )
}
