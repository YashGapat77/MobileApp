import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Dimensions, Animated } from 'react-native';
// Note: In a real app we would use @react-native-community/netinfo
// For now we'll simulate it or just provide the UI component

const { width } = Dimensions.get('window');

const OfflineNotice = () => {
    const [isConnected, _setIsConnected] = useState(true);
    const [slideAnim] = useState(new Animated.Value(0));

    // Simulate network check (mock)
    useEffect(() => {
        // In a real app, subscribe to NetInfo here
        // const unsubscribe = NetInfo.addEventListener(state => {
        //   setIsConnected(state.isConnected);
        // });
        // return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isConnected) {
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [isConnected, slideAnim]);

    if (isConnected) return null;

    return (
        <Animated.View
            style={[
                styles.offlineContainer,
                {
                    transform: [
                        {
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-30, 0],
                            }),
                        },
                    ],
                },
            ]}
        >
            <Text style={styles.offlineText}>No Internet Connection</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    offlineContainer: {
        backgroundColor: '#b52424',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        width,
        position: 'absolute',
        top: 0, // Adjust based on SafeAreaView
        zIndex: 999,
    },
    offlineText: {
        color: '#fff',
    },
});

export default OfflineNotice;
