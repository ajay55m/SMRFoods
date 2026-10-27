import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import ServerSlowScreen from '../src/screens/ServerSlowScreen';

// Mock navigation
const mockGoBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
}));

jest.mock('../src/hooks/useNetworkStatus', () =>
  jest.fn(() => ({
    isOnline: true,
    isCompletelyOffline: false,
    isSlow: false,
  })),
);

describe('ServerSlowScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot', () => {
    const {toJSON} = render(<ServerSlowScreen />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('handles navigation goBack if possible', () => {
    mockCanGoBack.mockReturnValue(true);
    const {getByText} = render(<ServerSlowScreen />);

    fireEvent.press(getByText('↻ TRY AGAIN'));

    expect(mockGoBack).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('handles navigation replace if cannot go back', () => {
    mockCanGoBack.mockReturnValue(false);
    const {getByText} = render(<ServerSlowScreen />);

    fireEvent.press(getByText('↻ TRY AGAIN'));

    expect(mockReplace).toHaveBeenCalledWith('Login');
    expect(mockGoBack).not.toHaveBeenCalled();
  });

  it('uses override retry if provided', () => {
    const mockOverride = jest.fn();
    const {getByText} = render(
      <ServerSlowScreen onRetryOverride={mockOverride} />,
    );

    fireEvent.press(getByText('↻ TRY AGAIN'));

    expect(mockOverride).toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
