import browser from 'webextension-polyfill';

export const getImagePath = (fileName: string) =>
  browser.runtime.getURL(`assets/Images/${fileName}`);

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getAssets = (fileName: string) =>
  browser.runtime.getURL(`assets/${fileName}`);

export const getFontPath = (fileName: string) =>
  browser.runtime.getURL(`assets/Fonts/${fileName}`);

export const trimAllWhiteSpaces = (str: string) => {
  return str.replace(/[\n\r\t\s]+/g, ' ').trim();
};

export const isRegexExactMatch = (value: string, regexp: string) => {
  const res = value.match(regexp);
  return res && res[0] && res[0] === res.input;
};

export const isValidPhoneNumber = (value: string) => {
  const validPhoneNumberRegExp = /^([+]\d{2})?\d{10}/;
  if (value.match(validPhoneNumberRegExp)) {
    return true;
  }
  return false;
};
