const TOKEN_KEY = 'uplift_force_token_key';
const REFRESH_TOKEN_KEY = 'uplift_force_refresh_token_key';

// Helper to safely access cookies
const getCookie = (name: string): string => {
  if (typeof document === 'undefined') return '';
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for(let i=0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0)===' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return '';
};

const setCookie = (name: string, value: string, days: number) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
};

const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Max-Age=-99999999;';
};

const getToken = (): string => {
  return getCookie(TOKEN_KEY);
};

const setToken = (token: string) => {
  setCookie(TOKEN_KEY, token, 7); // Store for 7 days, adjust as needed
};

const removeToken = () => {
  removeCookie(TOKEN_KEY);
};

const getRefreshToken = (): string => {
  return getCookie(REFRESH_TOKEN_KEY);
};

const setRefreshToken = (token: string) => {
  setCookie(REFRESH_TOKEN_KEY, token, 30); // Store for 30 days, adjust as needed
};

const removeRefreshToken = () => {
  removeCookie(REFRESH_TOKEN_KEY);
};

export { getToken, setToken, removeToken, getRefreshToken, setRefreshToken, removeRefreshToken };