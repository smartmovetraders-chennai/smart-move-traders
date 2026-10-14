import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width } = Dimensions.get('window');

export default function BrandSplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Release native OS splash immediately so our rich animated component takes over
    SplashScreen.hideAsync().catch(() => {});

    // 1. Entrance animation (scale + fade in)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Hold for 2.4 seconds, then smoothly fade out
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, exitAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: exitAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />
      <View style={styles.contentWrap}>
        <Animated.View
          style={[
            styles.brandBlock,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Golden Bull Brand Logo */}
          <View style={styles.logoFrame}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Business Titles */}
          <Text style={styles.brandTitle}>SMART MOVE TRADERS</Text>
          <View style={styles.goldLine} />
          <Text style={styles.brandSubtitle}>Wholesale Smartphone Billing System</Text>

          {/* Rule 32(5) Badge */}
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>GST Rule 32(5) Margin Scheme</Text>
          </View>
        </Animated.View>

        {/* Bottom Loading Progress */}
        <Animated.View style={[styles.bottomBlock, { opacity: fadeAnim }]}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={styles.loadingText}>Initializing Financial Engine...</Text>
          <Text style={styles.securityText}>24/7 Secure Cloud Sync</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrap: {
    width: Math.min(width * 0.88, 380),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    height: '100%',
  },
  brandBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoFrame: {
    width: 130,
    height: 130,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  logo: {
    width: 124,
    height: 124,
    borderRadius: 24,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
    textAlign: 'center',
  },
  goldLine: {
    width: 44,
    height: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 10,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  badgePill: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomBlock: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  securityText: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
