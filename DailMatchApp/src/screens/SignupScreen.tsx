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
    ScrollView,
    ImageBackground,
} from 'react-native';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = ({ navigation }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');

    const handleSignup = async () => {
        if (!name || !email || !password || !age || !gender) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (parseInt(age) < 18) {
            Alert.alert('Error', 'You must be at least 18 years old');
            return;
        }

        try {
            const userData = {
                name,
                email,
                password,
                age: parseInt(age),
                gender,
            };

            const data = await authAPI.signup(userData);

            if (data.token) {
                // authAPI handles storing authToken and userId
                // We store the full user object for profile use
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                Alert.alert('Success', 'Account created!', [
                    { text: 'Continue', onPress: () => navigation.replace('Onboarding') }
                ]);
            } else {
                Alert.alert('Error', 'Signup failed. Please try again.');
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            Alert.alert('Signup Failed', error.response?.data?.message || 'Unable to create account');
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/signup_bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
            blurRadius={5}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoText}>Create Account</Text>
                            <Text style={styles.tagline}>Join SoulFix today</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your age"
                                    placeholderTextColor="#999"
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="number-pad"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderButton,
                                            gender === 'male' && styles.genderButtonActive,
                                        ]}
                                        onPress={() => setGender('male')}
                                    >
                                        <Text
                                            style={[
                                                styles.genderButtonText,
                                                gender === 'male' && styles.genderButtonTextActive,
                                            ]}
                                        >
                                            Male
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderButton,
                                            gender === 'female' && styles.genderButtonActive,
                                        ]}
                                        onPress={() => setGender('female')}
                                    >
                                        <Text
                                            style={[
                                                styles.genderButtonText,
                                                gender === 'female' && styles.genderButtonTextActive,
                                            ]}
                                        >
                                            Female
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderButton,
                                            gender === 'other' && styles.genderButtonActive,
                                        ]}
                                        onPress={() => setGender('other')}
                                    >
                                        <Text
                                            style={[
                                                styles.genderButtonText,
                                                gender === 'other' && styles.genderButtonTextActive,
                                            ]}
                                        >
                                            Other
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create a password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
                                <Text style={styles.signupButtonText}>Sign Up</Text>
                            </TouchableOpacity>

                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                    <Text style={styles.loginLink}>Log In</Text>
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add padding for status bar
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
    },
    logoContainer: {
        paddingVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 36,
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
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Increased transparency
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 30,
        paddingTop: 30,
        paddingBottom: 40,
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
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingVertical: 12,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    genderButtonActive: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    genderButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    genderButtonTextActive: {
        color: '#FFFFFF',
    },
    signupButton: {
        backgroundColor: '#000000',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginLink: {
        color: '#000000',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default SignupScreen;
