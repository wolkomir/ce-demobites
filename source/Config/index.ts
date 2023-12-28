const BASE_URL = "";

export enum MESSAGE_ACTION {
  IS_SCRIPT_INJECTED = "IS_SCRIPT_INJECTED",
  TOGGLE_POPUP = "TOGGLE_POPUP",
  HIDE_POPUP = "HIDE_POPUP",
  SHOW_POPUP = "SHOW_POPUP",
  START_RECORDING = "START_RECORDING",
  STOP_RECORDING = "STOP_RECORDING",
  RECORDING_COMPLETED = "RECORDING_COMPLETED",
}


export const PARAMETER_KEY = {
  
};


export interface Message {
  action: MESSAGE_ACTION;
  data: any;
}

export const API_URL = {
  
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