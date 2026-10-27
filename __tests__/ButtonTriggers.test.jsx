import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {Alert, Linking} from 'react-native';

import LoginScreen from '../src/screens/LoginScreen';
import WebViewScreen from '../src/screens/WebViewScreen';
import ServerSlowScreen from '../src/screens/ServerSlowScreen';
import * as authService from '../src/services/authService';

const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
const mockUpdateCookies = jest.fn();
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {username: 'admin', loginTime: 123456789},
    sessionCookies: 'PHPSESSID=test_session_id',
    dashboardUrl: 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php',
    signIn: mockSignIn,
    signOut: mockSignOut,
    updateCookies: mockUpdateCookies,
    isLoading: false,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(cb => cb()),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('../src/hooks/useNetworkStatus', () =>
  jest.fn(() => ({
    isOnline: true,
    isCompletelyOffline: false,
    isSlow: false,
  })),
);

describe('Button Triggers and Touch Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  describe('LoginScreen Button Triggers', () => {
    it('triggering Sign In button with empty inputs triggers validation errors without crashing', async () => {
      const {getByText, queryByText} = render(<LoginScreen />);
      const signInBtn = getByText('Sign In');

      await act(async () => {
        fireEvent.press(signInBtn);
      });

      expect(queryByText('Username is required')).toBeTruthy();
      expect(queryByText('Password is required')).toBeTruthy();
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('triggering password eye toggle button flips visibility icon without crashing', async () => {
      const {getByText, queryByText} = render(<LoginScreen />);
      const eyeBtn = getByText('👁️');

      await act(async () => {
        fireEvent.press(eyeBtn);
      });

      expect(queryByText('🙈')).toBeTruthy();

      const hideBtn = getByText('🙈');
      await act(async () => {
        fireEvent.press(hideBtn);
      });

      expect(queryByText('👁️')).toBeTruthy();
    });

    it('triggering Sign In button with filled credentials calls loginUser and signIn safely', async () => {
      jest.spyOn(authService, 'loginUser').mockResolvedValueOnce({
        success: true,
        cookies: 'PHPSESSID=session_ok_123',
        dashboardUrl: 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php',
      });

      const {getByPlaceholderText, getByText} = render(<LoginScreen />);
      const usernameInput = getByPlaceholderText('Username');
      const passwordInput = getByPlaceholderText('••••••••••••');
      const signInBtn = getByText('Sign In');

      fireEvent.changeText(usernameInput, 'admin_user');
      fireEvent.changeText(passwordInput, 'valid_pass_123');

      await act(async () => {
        fireEvent.press(signInBtn);
      });

      await waitFor(() => {
        expect(authService.loginUser).toHaveBeenCalledWith('admin_user', 'valid_pass_123');
        expect(mockSignIn).toHaveBeenCalledWith(
          'admin_user',
          'valid_pass_123',
          'PHPSESSID=session_ok_123',
          'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php',
        );
      });
    });
  });

  describe('WebViewScreen Button Triggers', () => {
    it('triggering native logout button (fabLogout) prompts confirmation alert and signs out on confirm', async () => {
      const {getByText} = render(<WebViewScreen />);
      const logoutBtn = getByText('⎋');

      await act(async () => {
        fireEvent.press(logoutBtn);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'End Session',
        'Are you sure you want to securely logout?',
        expect.any(Array),
      );

      // Simulate confirming logout
      const alertCall = Alert.alert.mock.calls[0];
      const buttons = alertCall[2];
      const confirmLogout = buttons.find(b => b.text === 'Logout');
      expect(confirmLogout).toBeDefined();

      await act(async () => {
        await confirmLogout.onPress();
      });

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('validates navigation handler allows menu hash/javascript and blocks external logout paths', () => {
      const {UNSAFE_getByType} = render(<WebViewScreen />);
      const {WebView} = require('react-native-webview');
      const webViewInstance = UNSAFE_getByType(WebView);
      const onShouldStartLoad = webViewInstance.props.onShouldStartLoadWithRequest;

      // 1. Menu triggers via anchor hash or inline JS should be allowed
      expect(onShouldStartLoad({url: 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php#menu'})).toBe(true);
      expect(onShouldStartLoad({url: 'javascript:void(0);'})).toBe(true);
      expect(onShouldStartLoad({url: '#'})).toBe(true);

      // 2. Normal category or product navigation allowed
      expect(onShouldStartLoad({url: 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php?cat=5'})).toBe(true);

      // 3. Explicit server logout link intercepted
      expect(onShouldStartLoad({url: 'https://smrfoodsmills.com/smrapp/app_mobile_view/logout.php'})).toBe(false);
      expect(Alert.alert).toHaveBeenCalledWith(
        'End Session',
        'Are you sure you want to securely logout?',
        expect.any(Array),
      );
    });
  });

  describe('ServerSlowScreen Button Triggers', () => {
    it('triggering Try Again button executes onRetryOverride callback', async () => {
      const mockRetry = jest.fn();
      const {getByText} = render(<ServerSlowScreen onRetryOverride={mockRetry} />);
      const retryBtn = getByText('↻ TRY AGAIN');

      await act(async () => {
        fireEvent.press(retryBtn);
      });

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });
});
