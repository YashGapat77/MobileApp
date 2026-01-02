import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FiltersScreen from './src/screens/FiltersScreen';
import ReportScreen from './src/screens/ReportScreen';
import MatchProfileScreen from './src/screens/MatchProfileScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineNotice from './src/components/OfflineNotice';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator();

const App = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <NavigationContainer>
                    <OfflineNotice />
                    <Stack.Navigator
                        initialRouteName="Splash"
                        screenOptions={{
                            headerShown: false,
                        }}
                    >
                        <Stack.Screen name="Splash" component={SplashScreen} />
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Matches" component={MatchesScreen} />
                        <Stack.Screen name="Chat" component={ChatScreen} />
                        <Stack.Screen name="MatchProfile" component={MatchProfileScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen
                            name="Filters"
                            component={FiltersScreen}
                            options={{ presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="Report"
                            component={ReportScreen}
                            options={{ presentation: 'modal' }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App;
