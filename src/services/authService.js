import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGIN_URL =
  'https://smrfoodsmills.com/smrapp/app_mobile_view/checklog.php';
const DASHBOARD_URL =
  'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php';
const STORAGE_CREDS_KEY = '@smr_sec_creds';

export async function saveCredentials(username, password) {
  try {
    await Keychain.setGenericPassword(username, password);
  } catch (error) {
    console.warn('Keychain error saving credentials:', error);
  }
  try {
    // Secondary reliable persistence in case Android Keystore is unavailable
    const payload = JSON.stringify({username, password});
    await AsyncStorage.setItem(STORAGE_CREDS_KEY, payload);
  } catch (error) {
    console.warn('AsyncStorage error saving fallback credentials:', error);
  }
}

export async function loadCredentials() {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials && credentials.username && credentials.password) {
      return {username: credentials.username, password: credentials.password};
    }
  } catch (error) {
    console.warn('Keychain error loading credentials:', error);
  }

  // Fallback to AsyncStorage if Keychain returned null or failed
  try {
    const raw = await AsyncStorage.getItem(STORAGE_CREDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.password) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('AsyncStorage error loading fallback credentials:', error);
  }
  return null;
}

export async function clearCredentials() {
  try {
    await Keychain.resetGenericPassword();
  } catch (error) {
    console.warn('Keychain error clearing credentials:', error);
  }
  try {
    await AsyncStorage.removeItem(STORAGE_CREDS_KEY);
  } catch (error) {
    console.warn('AsyncStorage error clearing fallback credentials:', error);
  }
}

export function parseCookies(cookieString) {
  if (!cookieString) {
    return [];
  }
  return cookieString
    .split(/,(?=[^ ])/)
    .map(part => part.trim().split(';')[0].trim())
    .filter(Boolean);
}

export async function loginUser(username, password, retryCookie = null) {
  try {
    const body = new URLSearchParams({uid: username, pwd: password});
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (retryCookie) {
      headers['Cookie'] = retryCookie;
    }

    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: headers,
      body: body.toString(),
      credentials: 'include',
    });

    const text = (await response.text()).trim();
    const arr = text.split('|');

    // Check for anti-bot challenge
    if (text.includes('document.cookie') && text.includes('document.location.reload')) {
      const match = text.match(/document\.cookie\s*=\s*['"]([^'"]+)['"]/);
      if (match && match[1] && !retryCookie) {
        // Retry with the extracted cookie
        return await loginUser(username, password, match[1]);
      }
    }

    const status = arr[0];
    const cookie = arr[1] || '';

    if (status === '0') {
      return {success: true, cookies: cookie, dashboardUrl: DASHBOARD_URL};
    } else if (status === '1') {
      return {success: false, error: 'Invalid username or password.'};
    } else {
      return {success: false, error: 'Unexpected server response.'};
    }
  } catch (err) {
    const error = new Error('Network error. Check your connection.');
    error.isNetworkError = true;
    throw error;
  }
}

export async function autoLogin() {
  const creds = await loadCredentials();
  if (!creds) {
    return null;
  }

  const result = await loginUser(creds.username, creds.password);

  if (result.success) {
    return result.cookies;
  }

  return null;
}
