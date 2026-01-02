import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Linking,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { authAPI } from '../services/api';

const SettingsScreen = ({ navigation }: any) => {
    // Notification Settings
    const [newMatches, setNewMatches] = useState(true);
    const [messages, setMessages] = useState(true);
    const [likes, setLikes] = useState(true);
    const [appUpdates, setAppUpdates] = useState(false);

    // Privacy Settings
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [showDistance, setShowDistance] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await authAPI.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    },
                },
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data, matches, and messages will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Account Deleted', 'Your account has been deleted.', [
                            {
                                text: 'OK',
                                onPress: async () => {
                                    await authAPI.logout();
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }],
                                    });
                                },
                            },
                        ]);
                    },
                },
            ]
        );
    };

    const renderSection = (title: string) => (
        <Text style={styles.sectionTitle}>{title}</Text>
    );

    const renderToggleItem = (
        icon: string,
        label: string,
        value: boolean,
        onToggle: (val: boolean) => void,
        subtitle?: string
    ) => (
        <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
                <Icon name={icon} size={24} color="#666" />
                <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{label}</Text>
                    {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: '#E0E0E0', true: '#000000' }}
                thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            />
        </View>
    );

    const renderNavigationItem = (
        icon: string,
        label: string,
        onPress: () => void,
        danger?: boolean
    ) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingLeft}>
                <Icon name={icon} size={24} color={danger ? '#FF3B30' : '#666'} />
                <Text style={[styles.settingLabel, danger && styles.dangerText]}>
                    {label}
                </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#CCC" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Notifications */}
                {renderSection('NOTIFICATIONS')}
                <View style={styles.sectionContainer}>
                    {renderToggleItem(
                        'heart',
                        'New Matches',
                        newMatches,
                        setNewMatches,
                        'Get notified when you match'
                    )}
                    {renderToggleItem(
                        'message',
                        'Messages',
                        messages,
                        setMessages,
                        'Get notified of new messages'
                    )}
                    {renderToggleItem(
                        'star',
                        'Likes',
                        likes,
                        setLikes,
                        'Get notified when someone likes you'
                    )}
                    {renderToggleItem(
                        'bell',
                        'App Updates',
                        appUpdates,
                        setAppUpdates,
                        'News and feature updates'
                    )}
                </View>

                {/* Privacy */}
                {renderSection('PRIVACY')}
                <View style={styles.sectionContainer}>
                    {renderToggleItem(
                        'circle',
                        'Show Online Status',
                        showOnlineStatus,
                        setShowOnlineStatus,
                        'Let others see when you\'re online'
                    )}
                    {renderToggleItem(
                        'map-marker',
                        'Show Distance',
                        showDistance,
                        setShowDistance,
                        'Show how far you are from others'
                    )}
                </View>

                {/* Account */}
                {renderSection('ACCOUNT')}
                <View style={styles.sectionContainer}>
                    {renderNavigationItem('account-edit', 'Edit Profile', () =>
                        navigation.navigate('EditProfile')
                    )}
                    {renderNavigationItem('lock', 'Change Password', () =>
                        Alert.alert('Coming Soon', 'This feature is coming soon!')
                    )}
                    {renderNavigationItem('email', 'Change Email', () =>
                        Alert.alert('Coming Soon', 'This feature is coming soon!')
                    )}
                </View>

                {/* Support */}
                {renderSection('SUPPORT')}
                <View style={styles.sectionContainer}>
                    {renderNavigationItem('help-circle', 'Help Center', () =>
                        Linking.openURL('https://example.com/help')
                    )}
                    {renderNavigationItem('shield-check', 'Privacy Policy', () =>
                        Linking.openURL('https://example.com/privacy')
                    )}
                    {renderNavigationItem('file-document', 'Terms of Service', () =>
                        Linking.openURL('https://example.com/terms')
                    )}
                    {renderNavigationItem('message-alert', 'Contact Us', () =>
                        Linking.openURL('mailto:support@soulfix.app')
                    )}
                </View>

                {/* Danger Zone */}
                {renderSection('DANGER ZONE')}
                <View style={styles.sectionContainer}>
                    {renderNavigationItem('logout', 'Logout', handleLogout)}
                    {renderNavigationItem(
                        'delete',
                        'Delete Account',
                        handleDeleteAccount,
                        true
                    )}
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appName}>SoulFix</Text>
                    <Text style={styles.appTagline}>Pin Point Love</Text>
                    <Text style={styles.appVersion}>Version 1.0.0 (Beta)</Text>
                    <Text style={styles.appCopyright}>© 2024 SoulFix</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
        marginTop: 25,
        marginBottom: 10,
        marginLeft: 20,
        letterSpacing: 1,
    },
    sectionContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    settingSubtitle: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    dangerText: {
        color: '#FF3B30',
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 30,
    },
    appName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        fontFamily: 'serif',
        letterSpacing: 1,
    },
    appTagline: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        fontStyle: 'italic',
    },
    appVersion: {
        fontSize: 13,
        color: '#999',
        marginTop: 8,
    },
    appCopyright: {
        fontSize: 12,
        color: '#CCC',
        marginTop: 10,
    },
});

export default SettingsScreen;
