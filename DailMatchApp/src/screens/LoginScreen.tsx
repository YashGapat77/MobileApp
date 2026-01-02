import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ImageBackground,
    Dimensions,
    ScrollView,
} from 'react-native';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        try {
            const data = await authAPI.login(email, password);

            if (data.token) {
                // authAPI handles storing authToken and userId
                // We store the full user object for profile use
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                navigation.replace('Home');
            } else {
                Alert.alert('Error', 'Invalid credentials');
            }

        } catch (error: any) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email or password');
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/login_bg_custom.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>SoulFix</Text>
                            <Text style={styles.tagline}>Pin Point Love</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email (e.g. test@test.com)"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity style={styles.forgotButton}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                                <Text style={styles.loginButtonText}>Log In</Text>
                            </TouchableOpacity>

                            <View style={styles.signupContainer}>
                                <Text style={styles.signupText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                                    <Text style={styles.signupLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    logoContainer: {
        height: Dimensions.get('window').height * 0.35, // Take up 35% of screen height
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    tagline: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    formContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 40, // Ensure bottom padding
        minHeight: Dimensions.get('window').height * 0.6, // Ensure it fills the rest roughly
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#000000',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    signupText: {
        color: '#666',
        fontSize: 14,
    },
    signupLink: {
        color: '#000000',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
