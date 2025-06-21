const TOKEN_KEY = 'uplift_force_token_key';
const REFRESH_TOKEN_KEY = 'uplift_force_refresh_token_key';

// Helper to safely access localStorage
const getLocalStorageItem = (name: string): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(name) || '';
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return '';
  }
};

const setLocalStorageItem = (name: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(name, value);
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

const removeLocalStorageItem = (name: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(name);
  } catch (error) {
    console.error('Error removing localStorage:', error);
  }
};

const getToken = (): string => {
  return getLocalStorageItem(TOKEN_KEY);
};

const setToken = (token: string) => {
  setLocalStorageItem(TOKEN_KEY, token);
};

const removeToken = () => {
  removeLocalStorageItem(TOKEN_KEY);
};

const getRefreshToken = (): string => {
  return getLocalStorageItem(REFRESH_TOKEN_KEY);
};

const setRefreshToken = (token: string) => {
  setLocalStorageItem(REFRESH_TOKEN_KEY, token);
};

const removeRefreshToken = () => {
  removeLocalStorageItem(REFRESH_TOKEN_KEY);
};

export { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken };