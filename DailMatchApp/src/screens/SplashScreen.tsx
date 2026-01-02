import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }: any) => {
    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.5);

    useEffect(() => {
        // Animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();

        const checkLogin = async () => {
            try {
                // Wait for animation
                await new Promise(resolve => setTimeout(() => resolve(true), 2500));

                const token = await AsyncStorage.getItem('authToken');
                if (token) {
                    navigation.replace('Home');
                } else {
                    navigation.replace('Login');
                }
            } catch (e) {
                navigation.replace('Login');
            }
        };
        checkLogin();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#FF4B6E" />
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                <Text style={styles.logoText}>SoulFix</Text>
                <Text style={styles.tagline}>Pin Point Love</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FF4B6E', // Brand color
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 20,
        color: '#FFE4E9',
        marginTop: 15,
        letterSpacing: 4,
        textTransform: 'uppercase',
    }
});

export default SplashScreen;
