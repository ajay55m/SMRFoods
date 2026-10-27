import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, StatusBar, Image} from 'react-native';

export default function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Animated && Animated.timing) {
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    }
  }, [fade]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />

      {/* Background layer */}
      <View style={styles.background} />

      <Animated.View style={[styles.content, {opacity: fade}]}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assests/logo-lotus-smr.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Image
          source={require('../assests/smr-logo.png')}
          style={styles.nameImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoWrapper: {
    width: 140,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#1B3A2D',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F2F4F3',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  nameImage: {
    width: 220,
    height: 60,
    marginTop: 8,
  },
});
