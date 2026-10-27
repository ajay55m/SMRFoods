import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
} from '../src/services/authService';

describe('Auth Service Credentials Persistence', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('saves credentials to both Keychain and AsyncStorage fallback', async () => {
    await saveCredentials('user1', 'pass1');

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith('user1', 'pass1');
    const stored = await AsyncStorage.getItem('@smr_sec_creds');
    expect(JSON.parse(stored)).toEqual({username: 'user1', password: 'pass1'});
  });

  it('loads credentials from Keychain if available', async () => {
    Keychain.getGenericPassword.mockResolvedValueOnce({
      username: 'keychainUser',
      password: 'keychainPassword',
    });

    const creds = await loadCredentials();
    expect(creds).toEqual({
      username: 'keychainUser',
      password: 'keychainPassword',
    });
  });

  it('falls back to AsyncStorage if Keychain fails or returns null', async () => {
    Keychain.getGenericPassword.mockRejectedValueOnce(
      new Error('Keystore hardware unavailable'),
    );
    await AsyncStorage.setItem(
      '@smr_sec_creds',
      JSON.stringify({username: 'fallbackUser', password: 'fallbackPassword'}),
    );

    const creds = await loadCredentials();
    expect(creds).toEqual({
      username: 'fallbackUser',
      password: 'fallbackPassword',
    });
  });

  it('clears credentials from both Keychain and AsyncStorage', async () => {
    await AsyncStorage.setItem(
      '@smr_sec_creds',
      JSON.stringify({username: 'user', password: 'pwd'}),
    );

    await clearCredentials();

    expect(Keychain.resetGenericPassword).toHaveBeenCalled();
    const stored = await AsyncStorage.getItem('@smr_sec_creds');
    expect(stored).toBeNull();
  });
});
