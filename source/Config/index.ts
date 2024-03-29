const BASE_URL = "https://api.demobites.com/ce/";

export enum MESSAGE_ACTION {
  KEEP_ALIVE = 'keep_alive',
  IS_SCRIPT_INJECTED = "IS_SCRIPT_INJECTED",
  TOGGLE_POPUP = "TOGGLE_POPUP",
  HIDE_POPUP = "HIDE_POPUP",
  SHOW_POPUP = "SHOW_POPUP",
  START_RECORDING = "START_RECORDING",
  RECORDING_STARTED = "RECORDING_STARTED",
  CANCEL_RECORDING = "CANCEL_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  RECORDING_STOPPED_DUE_TO_TIME_LIMIT = "RECORDING_STOPPED_DUE_TO_TIME_LIMIT",
  RECORDING_STOPPED_BEFORE_STARTING = "RECORDING_STOPPED_BEFORE_STARTING",
  RECORDING_CANCELLED = "RECORDING_CANCELLED",
  PROCESSING_RECORDING = "PROCESSING_RECORDING",
  RECORDING_COMPLETED = "RECORDING_COMPLETED",
  UPLOAD_RECORDING = "UPLOAD_RECORDING",
  DELETE_RECORDING = "DELETE_RECORDING",
  UPLOAD_RECORDING_COMPLETED = "UPLOAD_RECORDING_COMPLETED",
  GET_SETUP_DATA = "GET_SETUP_DATA",
  RECORDING_TIME_REMAINING = "RECORDING_TIME_REMAINING",
  MICROPHONE_DEVICE_PERMISSION_GRANTED = "MICROPHONE_DEVICE_PERMISSION_GRANTED",
  MICROPHONE_DEVICE_PERMISSION_DENIED = "MICROPHONE_DEVICE_PERMISSION_DENIED",
  RESET_RECORDING_SESSION_IF_NOT_RECORDING = "RESET_RECORDING_SESSION_IF_NOT_RECORDING",
}

export const PARAMETER_KEY = {
  CID: 'cid',
  STATE: 'state',
  PRE_SIGNED_URL_JSON_INTERACTION_DATA: 'pre-signed-url-json-interaction-data',
  PRE_SIGNED_URL_VIDEO_FILE: 'pre-signed-url-video-file',
  MAX_DURATION: 'max-duration',
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