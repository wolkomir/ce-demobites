const BASE_URL = "https://api.demobites.com/ce/";

export enum MESSAGE_ACTION {
  IS_SCRIPT_INJECTED = "IS_SCRIPT_INJECTED",
  TOGGLE_POPUP = "TOGGLE_POPUP",
  HIDE_POPUP = "HIDE_POPUP",
  SHOW_POPUP = "SHOW_POPUP",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  RECORDING_COMPLETED = "RECORDING_COMPLETED",
  UPLOAD_RECORDING = "UPLOAD_RECORDING",
  DELETE_RECORDING = "DELETE_RECORDING",
  UPLOAD_RECORDING_COMPLETED = "UPLOAD_RECORDING_COMPLETED",
}

export const PARAMETER_KEY = {
  CID: 'cid',
  STATE: 'state',
  PRE_SIGNED_URL_JSON_INTERACTION_DATA: 'pre-signed-url-json-interaction-data',
  PRE_SIGNED_URL_VIDEO_FILE: 'pre-signed-url-video-file',
};

export interface Message {
  action: MESSAGE_ACTION;
  data: any;
}

export const API_URL = {
  SETUP: `${BASE_URL}setup`,
  PRE_UPLOAD: `${BASE_URL}prep-upload`
};

export const DEVICES = {
  CAMERA: 'camera',
  MICROPHONE: 'microphone'
};

export const PERMISSIONS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt'
};