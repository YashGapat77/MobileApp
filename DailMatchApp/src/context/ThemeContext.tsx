import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
    background: string;
    surface: string;
    primary: string;
    primaryLight: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
}

interface ThemeContextType {
    theme: ThemeMode;
    colors: ThemeColors;
    isDark: boolean;
    setTheme: (theme: ThemeMode) => void;
}

const lightColors: ThemeColors = {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    primary: '#FF4B6E',
    primaryLight: '#FFE5E9',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#FF3B30',
    success: '#4CAF50',
};

const darkColors: ThemeColors = {
    background: '#121212',
    surface: '#1E1E1E',
    primary: '#FF6B8A',
    primaryLight: '#3D2830',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    error: '#FF6B6B',
    success: '#66BB6A',
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    colors: lightColors,
    isDark: false,
    setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeMode>('system');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme) {
                setThemeState(savedTheme as ThemeMode);
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('theme', newTheme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ theme, colors, isDark, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export { lightColors, darkColors };
