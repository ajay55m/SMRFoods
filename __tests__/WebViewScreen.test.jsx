import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {Alert, Linking} from 'react-native';
import WebViewScreen from '../src/screens/WebViewScreen';
import {useAuth} from '../src/context/AuthContext';

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

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(cb => cb()),
}));

describe('WebViewScreen', () => {
  const mockSignOut = jest.fn();
  const mockUpdateCookies = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: {username: 'testuser', loginTime: 12345},
      sessionCookies: 'PHPSESSID=test12345',
      dashboardUrl: 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php',
      signOut: mockSignOut,
      updateCookies: mockUpdateCookies,
    });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  it('renders correctly with safe androidLayerType', () => {
    const {UNSAFE_getByType} = render(<WebViewScreen />);
    const webViewComponent = UNSAFE_getByType('WebView');
    expect(webViewComponent).toBeTruthy();
    // Verify androidLayerType is NOT hardware (which caused the GPU crash on menu animation)
    expect(webViewComponent.props.androidLayerType).not.toBe('hardware');
  });

  it('allows inline javascript and anchor clicks for menu access', () => {
    const {UNSAFE_getByType} = render(<WebViewScreen />);
    const webViewComponent = UNSAFE_getByType('WebView');
    const {onShouldStartLoadWithRequest} = webViewComponent.props;

    // JavaScript void (used by dropdowns and hamburger menu buttons) must return true
    expect(onShouldStartLoadWithRequest({url: 'javascript:void(0);'})).toBe(true);
    expect(onShouldStartLoadWithRequest({url: 'javascript:;'})).toBe(true);
    expect(onShouldStartLoadWithRequest({url: '#'})).toBe(true);
    expect(onShouldStartLoadWithRequest({url: '#sidebar'})).toBe(true);
    // Linking must not be triggered for internal script/anchor clicks
    expect(Linking.canOpenURL).not.toHaveBeenCalled();
  });

  it('safely routes external mobile schemes (tel, whatsapp, mailto) to Linking', async () => {
    const {UNSAFE_getByType} = render(<WebViewScreen />);
    const webViewComponent = UNSAFE_getByType('WebView');
    const {onShouldStartLoadWithRequest} = webViewComponent.props;

    const resTel = onShouldStartLoadWithRequest({url: 'tel:+919876543210'});
    expect(resTel).toBe(false);
    expect(Linking.canOpenURL).toHaveBeenCalledWith('tel:+919876543210');

    const resWhatsapp = onShouldStartLoadWithRequest({url: 'whatsapp://send?phone=123'});
    expect(resWhatsapp).toBe(false);
    expect(Linking.canOpenURL).toHaveBeenCalledWith('whatsapp://send?phone=123');
  });

  it('intercepts logout links and prompts confirmation alert', () => {
    const {UNSAFE_getByType} = render(<WebViewScreen />);
    const webViewComponent = UNSAFE_getByType('WebView');
    const {onShouldStartLoadWithRequest} = webViewComponent.props;

    const shouldLoad = onShouldStartLoadWithRequest({
      url: 'https://smrfoodsmills.com/smrapp/app_mobile_view/logout.php',
    });

    expect(shouldLoad).toBe(false);
    expect(Alert.alert).toHaveBeenCalledWith(
      'End Session',
      expect.stringContaining('securely logout'),
      expect.any(Array),
    );
  });

  it('prompts logout confirmation when tapping the header logout button', () => {
    const {getByText} = render(<WebViewScreen />);
    const logoutBtn = getByText('⎋');
    fireEvent.press(logoutBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'End Session',
      'Are you sure you want to securely logout?',
      expect.any(Array),
    );
  });
});
