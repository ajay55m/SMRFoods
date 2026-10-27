import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import LoginScreen from '../src/screens/LoginScreen';
import {loginUser} from '../src/services/authService';
import {useAuth} from '../src/context/AuthContext';

// Mocking dependencies
jest.mock('../src/services/authService', () => ({
  loginUser: jest.fn(),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../src/hooks/useNetworkStatus', () =>
  jest.fn(() => ({
    isOnline: true,
    isCompletelyOffline: false,
    isSlow: false,
  })),
);

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({signIn: mockSignIn});
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders correctly and matches snapshot', () => {
    const {toJSON} = render(<LoginScreen />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('shows error hints when fields are empty', async () => {
    const {getByText} = render(<LoginScreen />);

    // Press Sign In without filling inputs
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(getByText('Username is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('makes API call and navigates on success', async () => {
    loginUser.mockResolvedValueOnce({
      success: true,
      cookies: 'fake-cookies',
      dashboardUrl: '/dash',
    });

    const {getByPlaceholderText, getByText} = render(<LoginScreen />);

    // Type credentials
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('••••••••••••'), 'password123');

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(mockSignIn).toHaveBeenCalledWith(
        'testuser',
        'password123',
        'fake-cookies',
        '/dash',
      );
    });
  });

  it('shows error alert on API failure', async () => {
    loginUser.mockResolvedValueOnce({
      success: false,
      error: 'Invalid credentials',
    });

    const {getByPlaceholderText, getByText} = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('••••••••••••'), 'wrongpass');

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Failed',
        'Invalid credentials',
      );
    });
  });
});
