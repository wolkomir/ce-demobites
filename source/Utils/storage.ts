import browser from 'webextension-polyfill';
export const storage = browser.storage['local'];

export const getItem = async (key: string) => {
  const item = await storage.get({[key]: ''});
  return item[key];
};

export const setItem = async (key: string, value: any) => {
  await storage.set({[key]: value});
  return true;
};

export const removeItem = async (key: string) => {
  await storage.remove(key);
  return true;
};

export const clearStorage = async () => {
  await storage.clear();
  return true;
};
