import {Global} from '@mantine/core';
import React from 'react';
import {getFontPath} from '../Utils';

export function CustomFonts() {
  return (
    <Global
      styles={[
        {
          '@font-face': {
            fontFamily: 'Poppins',
            src: `url('${getFontPath('poppins-regular.ttf')}') format("woff2")`,
            fontWeight: 400,
            fontStyle: 'normal',
          },
        },
        {
          '@font-face': {
            fontFamily: 'Poppins',
            src: `url('${getFontPath('poppins-bold.ttf')}') format("woff2")`,
            fontWeight: 700,
            fontStyle: 'bold',
          },
        },
      ]}
    />
  );
}
