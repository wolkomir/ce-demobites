const BASE_URL = "";

export enum MESSAGE_ACTION {
  IS_SCRIPT_INJECTED = "IS_SCRIPT_INJECTED",
  TOGGLE_POPUP = "TOGGLE_POPUP",
  HIDE_POPUP = "HIDE_POPUP",
  SHOW_POPUP = "SHOW_POPUP",
  
}


export const PARAMETER_KEY = {
  
};


export interface Message {
  action: MESSAGE_ACTION;
  data: any;
}

export const API_URL = {
  
};

