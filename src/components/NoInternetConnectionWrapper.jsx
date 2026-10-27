import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import useNetworkStatus from '../hooks/useNetworkStatus';
// import Header from '../components/Header';
// import Footer from '../components/Footer';

const HEADER_HEIGHT = 80; // wrapper header height (adjust if needed)
const FOOTER_HEIGHT = 86; // wrapper footer height (adjust if needed)
// If the wrapped screen renders its own Header, we estimate its height here.
// If you know the exact height of the inner header, pass headerOffset prop to the wrapper.
const INNER_HEADER_ESTIMATE = 56;

const NoInternetConnectionWrapper = ({
  children,
  onRetry,
  onRestore,
  suppressInnerHeaderFooter = false,
  headerOffset,
}) => {
  const {isOnline} = useNetworkStatus() || {
    isOnline: true,
    isSlow: false,
  };
  const [showOnlinePopup, setShowOnlinePopup] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Slow network and timeout blocking removed
  const isSlow = false;

  // Animations for the green online popup
  const slideOnline = useRef(new Animated.Value(-80)).current;
  const fadeOnline = useRef(new Animated.Value(0)).current;

  // Animations for the offline popup
  const slideOffline = useRef(new Animated.Value(-80)).current;
  const fadeOffline = useRef(new Animated.Value(0)).current;

  // Loading state for Try again button
  const [retryLoading, setRetryLoading] = useState(false);
  // optional handle to clear fallback timeout
  const retryTimeoutRef = useRef(null);

  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 20;

  useEffect(() => {
    // ONLINE popup flow (shows briefly when we come back online)
    if (isOnline && wasOffline) {
      // hide offline popup if visible
      Animated.parallel([
        Animated.timing(slideOffline, {
          toValue: -80,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeOffline, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      setShowOnlinePopup(true);
      Animated.parallel([
        Animated.timing(slideOnline, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeOnline, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      if (onRestore) {
        onRestore();
      }

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideOnline, {
            toValue: -80,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(fadeOnline, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowOnlinePopup(false);
          setWasOffline(false);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }

    // OFFLINE popup flow (show while offline)
    if (!isOnline) {
      setWasOffline(true);
      setShowOnlinePopup(false);

      // bring the offline popup into view
      Animated.parallel([
        Animated.timing(slideOffline, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeOffline, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // reset online anim values
      slideOnline.setValue(-80);
      fadeOnline.setValue(0);
    } else {
      // ensure offline popup hidden when online (in case)
      Animated.parallel([
        Animated.timing(slideOffline, {
          toValue: -80,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeOffline, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    isOnline,
    wasOffline,
    slideOnline,
    fadeOnline,
    slideOffline,
    fadeOffline,
    onRestore,
  ]);

  // clear retry fallback timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // stop loading when network comes back
  useEffect(() => {
    if (isOnline && retryLoading) {
      setRetryLoading(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  }, [isOnline, retryLoading]);

  const handleRetry = async () => {
    if (retryLoading) {
      return;
    } // ignore double taps
    setRetryLoading(true);

    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        // If onRetry returns a Promise, await it. Otherwise, call and fallback to timeout.
        const result = onRetry && onRetry();

        if (result && typeof result.then === 'function') {
          // onRetry returned a promise — await it
          await result;
          // after resolve we'll wait a short moment for network to update (or rely on isOnline useEffect)
        } else {
          // onRetry is sync — keep loading for a fallback duration in case network check is async
          retryTimeoutRef.current = setTimeout(() => {
            setRetryLoading(false);
            retryTimeoutRef.current = null;
          }, 6000); // 6s fallback
        }
      } else {
        setRetryLoading(false);
      }
    } catch (err) {
      // if onRetry threw or rejected, stop loading
      setRetryLoading(false);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    }
  };

  // --- automatic detection of Header/Footer inside children (so we don't duplicate) ---
  const hasInnerHeaderOrFooter = nodes => {
    let found = false;
    React.Children.forEach(nodes, child => {
      if (!child || found) {
        return;
      }
      if (typeof child === 'object' && child.type) {
        const type = child.type;
        const typeName =
          (type && (type.displayName || type.name)) ||
          (typeof type === 'string' ? type : null);

        // We check for these if we define them eventually
        // if (type === Header || type === Footer) {
        //   found = true;
        //   return;
        // }

        if (typeName === 'Header' || typeName === 'Footer') {
          found = true;
          return;
        }

        if (child.props && child.props.children) {
          if (hasInnerHeaderOrFooter(child.props.children)) {
            found = true;
            return;
          }
        }
      }
    });
    return found;
  };

  const detectedInnerHF = hasInnerHeaderOrFooter(children);
  const renderWrapperHeaderFooter =
    !suppressInnerHeaderFooter && !detectedInnerHF;
  // ----------------------------------------------------------------------

  // compute popup top offset so it appears below the header
  // priority:
  // 1) headerOffset prop (explicit)
  // 2) if wrapper renders header -> use HEADER_HEIGHT
  // 3) if child contains header -> use INNER_HEADER_ESTIMATE
  // 4) otherwise use status bar only
  const resolvedHeaderOffset =
    typeof headerOffset === 'number'
      ? headerOffset
      : renderWrapperHeaderFooter
      ? HEADER_HEIGHT
      : detectedInnerHF
      ? INNER_HEADER_ESTIMATE
      : 0;

  const popupTop = statusBarHeight + resolvedHeaderOffset + 8;

  // NOTE: we intentionally always render children so content is visible both online & offline

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor={isOnline ? '#e8f5e9' : '#fff'}
        barStyle="dark-content"
      />

      {/* Wrapper Header */}
      {/* {renderWrapperHeaderFooter && (
        <View
          style={[styles.headerContainer, { opacity: headerOpacity }]}
          pointerEvents={headerPointer}
        >
          <Header onPress={onHeaderPress} onNavigate={onHeaderNavigate} showMenu={showMenu} />
        </View>
      )} */}

      {/* OFFLINE top alert popup (BLACK) — shows while offline and overlays content */}
      {!isOnline && (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.offlinePopup,
            {
              transform: [{translateY: slideOffline}],
              opacity: fadeOffline,
              top: popupTop,
            },
          ]}>
          <View style={styles.offlineInner}>
            <Text style={styles.offlineText}>
              ⚠️ You are offline — check your connection
            </Text>

            <TouchableOpacity
              style={[
                styles.offlineRetry,
                retryLoading && styles.offlineRetryDisabled,
              ]}
              onPress={handleRetry}
              activeOpacity={0.8}
              disabled={retryLoading}>
              {retryLoading ? (
                <View style={styles.retryContent}>
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={styles.retrySpinner}
                  />
                  <Text style={styles.offlineRetryText}>Checking...</Text>
                </View>
              ) : (
                <Text style={styles.offlineRetryText}>Try again</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Top green "Back online" popup */}
      {showOnlinePopup && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.onlinePopup,
            {
              transform: [{translateY: slideOnline}],
              opacity: fadeOnline,
              top: popupTop,
            },
          ]}>
          <Text style={styles.onlineText}>
            ✓ Back online — connection restored
          </Text>
        </Animated.View>
      )}

      {/* Main content area - reserve header/footer space only if wrapper renders them */}
      <View
        style={[
          styles.contentArea,
          renderWrapperHeaderFooter
            ? styles.wrapperContentSpacing
            : styles.wrapperContentSpacing,
        ]}>
        <View style={styles.childrenContainer}>
          {isSlow ? (
            <View style={styles.blockedContent}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.blockedText}>Connection too slow</Text>
              <Text style={styles.blockedSubText}>
                Please use 4G, 5G or Wi-Fi
              </Text>
              <TouchableOpacity
                style={styles.slowRetryButton}
                onPress={() => {
                  if (onRetry) {
                    onRetry();
                  }
                }}>
                <Text style={styles.slowRetryText}>↻ Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            children
          )}
        </View>
      </View>

      {/* Wrapper Footer */}
      {/* {renderWrapperHeaderFooter && (
        <View style={[styles.footerContainer, { opacity: footerOpacity }]} pointerEvents={footerPointer}>
          <Footer onPress={onFooterPress} />
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 1200,
    backgroundColor: '#FFFFFF',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_HEIGHT,
    zIndex: 1200,
    backgroundColor: '#F5F5DC',
  },

  contentArea: {
    flex: 1,
  },

  childrenContainer: {
    flex: 1,
  },

  /* ONLINE popup */
  onlinePopup: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#4caf50',
    borderRadius: 10,
    zIndex: 2000,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  onlineText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  /* OFFLINE popup - black background */
  offlinePopup: {
    position: 'absolute',
    left: 12,
    right: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#000000',
    borderRadius: 10,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  offlineInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offlineText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },
  offlineRetry: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineRetryDisabled: {
    opacity: 0.9,
  },
  offlineRetryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retrySpinner: {
    marginRight: 8,
  },
  wrapperContentSpacing: {
    marginTop: 0,
    marginBottom: 0,
  },
  blockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  blockedText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  blockedSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  slowRetryButton: {
    marginTop: 24,
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  slowRetryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default NoInternetConnectionWrapper;
