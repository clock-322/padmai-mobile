import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const ringScale   = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(30)).current;
  const titleOpacity= useRef(new Animated.Value(0)).current;
  const subOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const pulse       = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: Ring expands (0–500ms)
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0.25, duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Step 2: Logo pops in (200–700ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1, tension: 70, friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Step 3: Start pulse loop after logo appears
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1.08, duration: 850, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 1,    duration: 850, useNativeDriver: true }),
          ])
        ).start();
      });
    }, 200);

    // Step 4: Title slides up (500ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleY, {
          toValue: 0, duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1, duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // Step 5: Subtitle fades in (750ms)
    setTimeout(() => {
      Animated.timing(subOpacity, {
        toValue: 1, duration: 450,
        useNativeDriver: true,
      }).start();
    }, 750);

    // Step 6: Tagline fades in (1000ms)
    setTimeout(() => {
      Animated.timing(tagOpacity, {
        toValue: 1, duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Step 7: Footer fades in (1300ms)
    setTimeout(() => {
      Animated.timing(footerOpacity, {
        toValue: 1, duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1300);

    // Dismiss after 4 seconds
    const timer = setTimeout(onFinish, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Outer glow ring */}
      <Animated.View
        style={[
          styles.glowRing,
          { opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />

      {/* Logo circle */}
      <Animated.View
        style={[
          styles.logoCircle,
          { opacity: logoOpacity, transform: [{ scale: Animated.multiply(logoScale, pulse) }] },
        ]}
      >
        <Text style={styles.logoEmoji}>🏫</Text>
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          { opacity: titleOpacity, transform: [{ translateY: titleY }] },
        ]}
      >
        Kilbil School
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subOpacity }]}>
        School Management System
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Empowering Education · Connecting Families
      </Animated.Text>

      {/* Footer */}
      <Animated.Text style={[styles.footer, { opacity: footerOpacity }]}>
        © {new Date().getFullYear()} Kilbil School
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 44,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.4,
  },
});

export default SplashScreen;
