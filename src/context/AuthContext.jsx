/**
 * AuthContext.jsx — SMR Food Mills
 *
 * PERMANENT LOGIN:
 * On every mount (cold start, background restore) we call autoLogin()
 * which silently POSTs to the server and gets a fresh PHP session.
 * If stored credentials exist → user goes straight to WebView, always.
 * Only way to reach LoginScreen is: never logged in, or manual Logout.
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  autoLogin,
  saveCredentials,
  clearCredentials,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [sessionCookies, setSessionCookies] = useState('');
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        // Check if we have a stored user (previously logged in)
        const storedUser = await AsyncStorage.getItem('@smr_user');
        const storedUrl = await AsyncStorage.getItem('@smr_dashboard');

        if (storedUser) {
          // User has logged in before — silently re-authenticate to get fresh session
          const freshCookies = await autoLogin();

          if (freshCookies) {
            // ✅ Got fresh session — go straight to WebView
            setUser(JSON.parse(storedUser));
            setSessionCookies(freshCookies);
            setDashboardUrl(storedUrl || '');
            await AsyncStorage.setItem('@smr_cookies', freshCookies);
          } else {
            // Network down? Use last known cookies and let WebView handle it
            const storedCookies = await AsyncStorage.getItem('@smr_cookies');
            setUser(JSON.parse(storedUser));
            setSessionCookies(storedCookies || '');
            setDashboardUrl(storedUrl || '');
          }
        }
        // If no storedUser → user stays null → LoginScreen is shown
      } catch (e) {
        console.warn('AuthContext restore error:', e);
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    restore();
  }, []);

  /** Called by LoginScreen after successful manual login. */
  const signIn = async (username, password, cookies, url) => {
    const safeUrl =
      typeof url === 'string' && url.trim().length > 0
        ? url.trim()
        : 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php';
    const safeCookies = typeof cookies === 'string' ? cookies : '';
    const userData = {username: username || '', loginTime: Date.now()};

    try {
      await saveCredentials(username || '', password || '');
    } catch (e) {
      console.warn('saveCredentials error:', e);
    }

    try {
      await AsyncStorage.multiSet([
        ['@smr_user', JSON.stringify(userData)],
        ['@smr_cookies', safeCookies],
        ['@smr_dashboard', safeUrl],
      ]);
    } catch (e) {
      console.warn('AsyncStorage save error:', e);
    }

    setUser(userData);
    setSessionCookies(safeCookies);
    setDashboardUrl(safeUrl);
  };

  /** Called by WebViewScreen after a mid-session silent re-auth. */
  const updateCookies = async freshCookies => {
    setSessionCookies(freshCookies);
    await AsyncStorage.setItem('@smr_cookies', freshCookies);
  };

  /** Manual logout — wipes everything. Next open → LoginScreen. */
  const signOut = async () => {
    setUser(null);
    setSessionCookies('');
    setDashboardUrl('');
    try {
      await clearCredentials(); // Keychain
    } catch (e) {
      console.warn('Keychain clear error:', e);
    }
    try {
      await AsyncStorage.multiRemove([
        '@smr_user',
        '@smr_cookies',
        '@smr_dashboard',
      ]);
    } catch (e) {
      console.warn('AsyncStorage clear error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionCookies,
        dashboardUrl,
        isLoading,
        signIn,
        signOut,
        updateCookies,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
