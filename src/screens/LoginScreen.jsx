import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Animated, StatusBar, Alert, Image, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import SkeletonUI from '../components/SkeletonUI';
import NoInternetConnectionWrapper from '../components/NoInternetConnectionWrapper';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedInput, setFocusedInput] = useState(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAppUpdate = async () => {
      try {
        // Quick store scrape or API check for play store update
        const response = await fetch('https://play.google.com/store/apps/details?id=com.smrfoods');
        if (response.ok) {
          const text = await response.text();
          const match = text.match(/\[\[\["(\d+\.\d+\.\d+)"\]\]/);
          
          if (match && match[1]) {
            const storeVersion = match[1];
            const currentVersion = '1.0.5';

            const isUpdateAvailable = (store, current) => {
              const sParts = store.split('.').map(Number);
              const cParts = current.split('.').map(Number);
              for (let i = 0; i < Math.max(sParts.length, cParts.length); i++) {
                const sVal = sParts[i] || 0;
                const cVal = cParts[i] || 0;
                if (sVal > cVal) return true;
                if (sVal < cVal) return false;
              }
              return false;
            };
            
            if (isUpdateAvailable(storeVersion, currentVersion)) {
              Alert.alert(
                'Update Available',
                `A new version (${storeVersion}) is available. Please update the app for the best experience.`,
                [
                  { text: 'Later', style: 'cancel' },
                  { text: 'Update Now', onPress: () => Linking.openURL('market://details?id=com.smrfoods') },
                ]
              );
            }
          }
        }
      } catch (e) {
        // Silently fail if offline or Play Store blocks it
        console.log('Update check skipped or failed');
      }
    };
    checkAppUpdate();
  }, []);
  const passwordRef = useRef(null);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    const e = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!password) e.password = 'Password is required';
    if (Object.keys(e).length) { setErrors(e); shake(); return; }

    setLoading(true);
    try {
      const result = await loginUser(username.trim(), password);
      if (result.success) {
        // Pass password so AuthContext can store it for permanent re-login
        await signIn(username.trim(), password, result.cookies || '', result.dashboardUrl);
      } else {
        shake();
        Alert.alert('Login Failed', result.error);
      }
    } catch (err) {
      const msg = err?.isNetworkError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NoInternetConnectionWrapper onRetry={handleLogin}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
        <View style={styles.background} />

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image source={require('../assests/logo-lotus-smr.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>

            <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.title}>Login</Text>
              <Text style={styles.subtitle}>Authorized terminal access for SMR operations.</Text>

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>USERNAME</Text>
                <View style={[styles.inputRow, focusedInput === 'username' && styles.inputFocused, errors.username && styles.inputError]}>
                  <Text style={styles.icon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#9CA3AF"
                    value={username}
                    onChangeText={v => { setUsername(v); setErrors(p => ({ ...p, username: null })); }}
                    onFocus={() => setFocusedInput('username')}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
                {errors.username && <Text style={styles.err}>{errors.username}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={[styles.inputRow, focusedInput === 'password' && styles.inputFocused, errors.password && styles.inputError]}>
                  <Text style={styles.icon}>🔑</Text>
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: null })); }}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(s => !s)} style={styles.eyeBtn}>
                    <Text style={styles.iconRight}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.err}>{errors.password}</Text>}
              </View>

              {/* Submit */}
              <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                {loading
                  ? <SkeletonUI width={100} height={20} borderRadius={10} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                  : <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Sign In</Text>
                    <Text style={styles.btnIcon}>→</Text>
                  </View>
                }
              </TouchableOpacity>

              <Text style={styles.versionText}>App Version 1.0.5</Text>
            </Animated.View>

          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </NoInternetConnectionWrapper>
  );
}

// Styles
const styles = StyleSheet.create({
  flex: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: '#d9d9d9ff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
  content: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: -60, zIndex: 10, elevation: 10 },
  logoWrapper: {
    width: 140, height: 140, backgroundColor: '#fff', borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
    borderWidth: 1, borderColor: '#F2F4F3',
  },
  logoImage: { width: 100, height: 100 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28, paddingTop: 80,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 28 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#2D4F3E', letterSpacing: 0.5, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F4F3',
    borderWidth: 1.5, borderColor: 'transparent', borderRadius: 12,
    paddingHorizontal: 14, height: 52,
  },
  inputFocused: { borderColor: '#B32A4A', backgroundColor: '#ffffff' },
  inputError: { borderColor: '#DC5565', backgroundColor: '#FEF2F2' },
  icon: { fontSize: 18, marginRight: 10, opacity: 0.7 },
  eyeBtn: { padding: 6 },
  iconRight: { fontSize: 16, opacity: 0.5 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827', paddingVertical: 0 },
  err: { fontSize: 11, fontWeight: '600', color: '#DC5565', marginTop: 6, marginLeft: 4 },
  btn: {
    backgroundColor: '#B32A4A', borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#B32A4A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnDisabled: { opacity: 0.7 },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: 'bold', color: '#fff', marginRight: 6 },
  btnIcon: { fontSize: 16, color: '#fff' },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});