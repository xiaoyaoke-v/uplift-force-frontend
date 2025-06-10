const TOKEN_KEY = 'uplift_force_token_key';

// Helper to safely access localStorage only in client environment
const getLocalStorage = (): Storage | undefined => {
  return typeof window !== 'undefined' ? window.localStorage : undefined;
};

const getToken = (): string => {
  const ls = getLocalStorage();
  if (ls) {
    try {
      return ls.getItem(TOKEN_KEY) ?? '';
    } catch (e) {
      console.error("Error getting token from localStorage", e);
      return '';
    }
  }
  return '';
};

const setToken = (token: string) => {
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error("Error setting token to localStorage", e);
    }
  }
};

const removeToken = () => {
  const ls = getLocalStorage();
  if (ls) {
    try {
      ls.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error removing token from localStorage", e);
    }
  }
};

export { getToken, setToken, removeToken };