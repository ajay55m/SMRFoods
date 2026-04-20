import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Platform, BackHandler, Alert, StatusBar, AppState,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { parseCookies, autoLogin } from '../services/authService';

import SkeletonUI from '../components/SkeletonUI';
import NoInternetConnectionWrapper from '../components/NoInternetConnectionWrapper';
import ServerSlowScreen from './ServerSlowScreen';

const FALLBACK_URL = 'https://smrfoodsmills.com/smrapp/app_mobile_view/category.php';
const LOGIN_PATTERNS = ['checklog.php', '/login', '/signin', '/sign-in', '/auth'];

// Skeleton Loader Component
const WebViewSkeleton = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonTopBar}>
      <SkeletonUI width={40} height={40} borderRadius={20} />
      <SkeletonUI width={120} height={20} borderRadius={4} style={{ marginLeft: 16 }} />
    </View>
    <View style={styles.skeletonCard}>
      <SkeletonUI width="100%" height={200} borderRadius={8} />
      <SkeletonUI width="70%" height={24} borderRadius={4} style={{ marginTop: 20 }} />
      <SkeletonUI width="90%" height={16} borderRadius={4} style={{ marginTop: 12 }} />
      <SkeletonUI width="40%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
    <View style={styles.skeletonCard}>
      <SkeletonUI width="100%" height={100} borderRadius={8} />
      <SkeletonUI width="60%" height={14} borderRadius={4} style={{ marginTop: 12 }} />
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <SkeletonUI width={80} height={30} borderRadius={15} />
        <SkeletonUI width={80} height={30} borderRadius={15} style={{ marginLeft: 8 }} />
      </View>
    </View>
  </View>
);

export default function WebViewScreen() {
  const { sessionCookies, dashboardUrl, signOut, user, updateCookies } = useAuth();
  const webViewRef = useRef(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isReauthing = useRef(false);
  const isRedirecting = useRef(false);
  const isRecovering = useRef(false);
  const appState = useRef(AppState.currentState);

  const targetUrl = dashboardUrl || FALLBACK_URL;

  // Cookie injection script
  const buildCookieScript = useCallback((cookieStr) => {
    const cookies = parseCookies(cookieStr);
    return `(function(){
      ${cookies.map(c => `document.cookie="${c};path=/";`).join('\n')}
      var s=document.createElement('style');
      s.innerHTML='a[href*="logout"],a[href*="signout"],.logout,.sign-out,[id*="logout"]{display:none!important}';
      document.head&&document.head.appendChild(s);
      window.addEventListener('offline',function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'network',isOnline:false}));});
      window.addEventListener('online', function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'network',isOnline:true}));});
      true;
    })();`;
  }, []);

  const cookieScript = buildCookieScript(sessionCookies);

  // Silent re-auth
  // Gets a fresh PHP session using stored credentials, injects it, reloads.
  const doSilentReAuth = useCallback(async () => {
    if (isReauthing.current) return;
    isReauthing.current = true;

    try {
      const freshCookies = await autoLogin();

      if (freshCookies) {
        await updateCookies(freshCookies);
        const script = buildCookieScript(freshCookies);
        webViewRef.current?.injectJavaScript(`
          ${script}
          window.location.replace("${targetUrl}");
          true;
        `);
      } else {
        // No stored creds or network totally down
        signOut();
      }
    } catch (e) {
      console.warn('doSilentReAuth error:', e);
    } finally {
      isReauthing.current = false;
      isRedirecting.current = false;
    }
  }, [buildCookieScript, targetUrl, updateCookies, signOut]);

  // Re-auth on foreground
  // This guarantees a fresh session is always ready before the user sees anything.
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        doSilentReAuth();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [doSilentReAuth]);

  // Block server login page and silently re-auth instead
  const onShouldStartLoadWithRequest = useCallback(request => {
    const url = (request.url || '').toLowerCase();
    const isLoginPage = LOGIN_PATTERNS.some(p => url.includes(p));

    if (isLoginPage && !isRedirecting.current) {
      isRedirecting.current = true;
      doSilentReAuth();
      return false; // Block the login page from rendering
    }
    return true;
  }, [doSilentReAuth]);

  // Hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (canGoBack) { webViewRef.current?.goBack(); return true; }
        Alert.alert('Logout?', 'Do you want to logout?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: signOut },
        ]);
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }, [canGoBack, signOut]),
  );

  const onNavChange = nav => setCanGoBack(nav.canGoBack);

  const onMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'network') {
        if (!data.isOnline) {
          setError(true);
        } else if (error) {
          setError(false);
          setLoading(true);
          isRecovering.current = true;
          webViewRef.current?.reload();
        }
      }
    } catch (_) { }
  };

  // Render
  return (
    <NoInternetConnectionWrapper 
      onRetry={() => { setError(false); setLoading(true); isRecovering.current = true; webViewRef.current?.reload(); }}
      onRestore={() => { setError(false); setLoading(true); isRecovering.current = true; webViewRef.current?.reload(); }}
      headerOffset={Platform.OS === 'ios' ? 50 : 45} // Align popup below appHeader
      isLoading={loading}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Header Area for App Navigation */}
        <View style={styles.appHeader}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.fabBack}
              activeOpacity={0.8}
              onPress={() => webViewRef.current?.goBack()}
            >
              <Text style={[styles.fabIcon, { marginBottom: 2 }]}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 34 }} /> /* Spacer to keep logout on right */
          )}

          <TouchableOpacity style={styles.fabLogout} activeOpacity={0.8}
            onPress={() => Alert.alert('End Session', 'Are you sure you want to securely logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive', onPress: signOut },
            ])}>
            <Text style={styles.fabIcon}>⎋</Text>
          </TouchableOpacity>
        </View>

        <WebView
          key={user?.loginTime ?? 'anonymous'}
          ref={webViewRef}
          source={{ uri: targetUrl }}
          style={styles.webview}
          injectedJavaScript={cookieScript}
          injectedJavaScriptBeforeContentLoaded={cookieScript}
          onNavigationStateChange={onNavChange}
          onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            if (isRecovering.current) {
              isRecovering.current = false;
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }
          }}
          onError={() => { setError(true); isRecovering.current = false; }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"
          incognito={false}
          allowsBackForwardNavigationGestures={Platform.OS === 'ios'}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36"
          renderError={() => <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />}
        />


        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <WebViewSkeleton />
          </View>
        )}

        {error && (
          <View style={[StyleSheet.absoluteFillObject, { top: Platform.OS === 'ios' ? 44 : 40, zIndex: 20 }]}>
            <ServerSlowScreen 
              onRetryOverride={() => {
                setError(false);
                setLoading(true);
                isRecovering.current = true;
                webViewRef.current?.reload();
              }} 
            />
          </View>
        )}
      </SafeAreaView>
    </NoInternetConnectionWrapper>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9FAFB',
    padding: 20,
    paddingTop: 20,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  appHeader: {
    backgroundColor: '#F5F5DC',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5DC',
  },
  fabBack: {
    backgroundColor: '#333e3aff', width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
    shadowColor: '#1B3A2D', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  fabLogout: {
    backgroundColor: '#B32A4A', width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
    shadowColor: '#B32A4A', shadowOpacity: 0.2, shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  fabIcon: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});