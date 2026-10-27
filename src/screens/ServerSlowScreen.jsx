import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import NoInternetConnectionWrapper from '../components/NoInternetConnectionWrapper';

const COLORS = {
  primary: '#B32A4A',
  accentGreen: '#49B675',
  bgLight: '#FDFCE7',
  textMain: '#1F2937',
  textSub: '#4B5563',
  white: '#FFFFFF',
  border: '#E5E7EB',
};

const ServerSlowScreen = ({onRetryOverride}) => {
  const navigation = useNavigation();

  const handleTryAgain = () => {
    if (onRetryOverride) {
      onRetryOverride();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Login');
    }
  };

  const content = (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgLight} />

      {/* Header */}
      <View style={styles.fakeHeader}>
        <Image
          source={require('../assests/smr-logo.png')}
          style={styles.logoSmall}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Image
                source={require('../assests/smr-logo.png')}
                style={styles.mainLogoCenter}
                resizeMode="contain"
              />
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeIcon}>📡</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>NETWORK ERROR</Text>
          </View>
          <Text style={styles.titleText}>Connection lost</Text>
          <Text style={styles.subtitleText}>
            To ensure your orders are processed correctly, SMR Foods requires a
            stable 4G, 5G, or Wi-Fi connection.
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleTryAgain}
            style={styles.actionButton}
            activeOpacity={0.9}>
            <Text style={styles.actionButtonText}>↻ TRY AGAIN</Text>
          </TouchableOpacity>

          <Text style={styles.copyrightText}>© 2026 SMR FOODS MILLS.</Text>
        </View>
      </View>
    </SafeAreaView>
  );

  if (onRetryOverride) {
    return content;
  }

  return (
    <NoInternetConnectionWrapper onRetry={handleTryAgain}>
      {content}
    </NoInternetConnectionWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  fakeHeader: {
    height: 60,
    backgroundColor: COLORS.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoSmall: {
    width: 150,
    height: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  outerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(179, 42, 74, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(179, 42, 74, 0.1)',
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  mainLogoCenter: {
    width: 100,
    height: 100,
    opacity: 0.8,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.accentGreen,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  statusBadgeIcon: {
    fontSize: 18,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 100,
  },
  tag: {
    backgroundColor: 'rgba(179, 42, 74, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    width: '100%',
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  copyrightText: {
    marginTop: 20,
    fontSize: 12,
    color: '#9CA3AF',
    letterSpacing: 1,
  },
});

export default ServerSlowScreen;
