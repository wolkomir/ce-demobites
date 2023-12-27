import React from 'react';
import {createRoot} from 'react-dom/client';
import {
  MantineProvider,
  createEmotionCache,
  MantineThemeOverride,
} from '@mantine/core';
import browser from 'webextension-polyfill';
import Layout from './Layout';
import {Message, MESSAGE_ACTION} from '../Config';
import {CustomFonts} from './customFonts';

console.log('🦄', 'helloworld from content script and hot reloading');

const extensionContainer = document.createElement('div');
extensionContainer.id = 'linkedin-assistance-extension';
extensionContainer.setAttribute(
  'style',
  'z-index:2147483646; position:relative'
);

extensionContainer.addEventListener('click', (evt) => {
  evt.stopPropagation();
});

extensionContainer.addEventListener('keypress', (evt) => {
  evt.stopPropagation();
});

extensionContainer.addEventListener('keyup', (evt) => {
  evt.stopPropagation();
});

extensionContainer.addEventListener('keydown', (evt) => {
  evt.stopPropagation();
});

const shadowRoot = extensionContainer.attachShadow({mode: 'open'});
const mountPoint = document.createElement('div');
const emotionRoot = document.createElement('div');
shadowRoot.appendChild(mountPoint);
shadowRoot.appendChild(emotionRoot);

document.documentElement.appendChild(extensionContainer);

const emotionCache = createEmotionCache({
  key: 'mantine',
  container: emotionRoot,
});
const extensionTheme: MantineThemeOverride = {
  globalStyles: () => ({
    // '*,div, *::before, *::after': {
    //   boxSizing: 'border-box',
    // },
  }),
  colors: {
    brand: [
      '#EAE4F6',
      '#EAE4F6',
      '#D5C9ED',
      '#D5C9ED',
      '#C0AEE4',
      '#715A9D',
      '#34317D',
      '#9778D2',
      '#9778D2',
      '#715A9D',
    ],
  },
  fontFamily: 'Poppins, sans-serif',
  // components: {Portal: {target: emotionRoot}},
};

const root = createRoot(mountPoint);

root.render(
  <MantineProvider
    theme={extensionTheme}
    // withGlobalStyles
    withNormalizeCSS
    emotionCache={emotionCache}
  >
    <CustomFonts />
    <Layout />
  </MantineProvider>
);

const onMessageListener = async (msg: Message) => {
  if (msg.action === MESSAGE_ACTION.IS_SCRIPT_INJECTED) {
    return Promise.resolve(true);
  }
};

browser.runtime.onMessage.addListener(onMessageListener);
