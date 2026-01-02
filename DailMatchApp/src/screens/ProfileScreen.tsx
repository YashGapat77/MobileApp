import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { authAPI, userAPI } from '../services/api';

const ProfileScreen = ({ navigation }: any) => {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await userAPI.getProfile();
            setProfile(data.profile);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleLogout = async () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
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
        ]);
    };

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Icon name="cog" size={26} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: profile.photos?.[0] || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                    <Text style={styles.bio}>{profile.bio || 'Add a bio to tell people about yourself'}</Text>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Icon name="pencil" size={18} color="#FFFFFF" />
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats - Removed as per user request */}

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Icon name="image-multiple" size={24} color="#666" />
                            <Text style={styles.menuItemText}>Manage Photos</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Icon name="bell" size={24} color="#666" />
                            <Text style={styles.menuItemText}>Notifications</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Icon name="shield-check" size={24} color="#666" />
                            <Text style={styles.menuItemText}>Privacy & Security</Text>
                        </View>
                        <Icon name="chevron-right" size={24} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert('Coming Soon', 'Premium features coming soon!')}
                    >
                        <View style={styles.menuItemLeft}>
                            <Icon name="crown" size={24} color="#FFD700" />
                            <Text style={styles.menuItemText}>Upgrade to Premium</Text>
                        </View>
                        <View style={styles.premiumBadge}>
                            <Text style={styles.premiumBadgeText}>PRO</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={20} color="#000000" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0</Text>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Icon name="cards" size={26} color="#CCC" />
                    <Text style={styles.navLabel}>Discover</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Matches')}
                >
                    <Icon name="chat-processing" size={26} color="#CCC" />
                    <Text style={styles.navLabel}>Matches</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Icon name="account" size={26} color="#000000" />
                    <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    profileCard: {
        alignItems: 'center',
        padding: 25,
        backgroundColor: '#FFF',
        marginBottom: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#000000',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    bio: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginBottom: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000000',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    editButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        backgroundColor: '#FFF',
        marginBottom: 10,
    },
    statItem: {
        alignItems: 'center',
    },
    statIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    section: {
        backgroundColor: '#FFF',
        paddingVertical: 10,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
        marginLeft: 20,
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 0.5,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    premiumBadgeText: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 10,
        backgroundColor: '#FFF',
        paddingVertical: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#000000',
    },
    logoutText: {
        color: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
        marginBottom: 10,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navItem: {
        alignItems: 'center',
    },
    navLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    navLabelActive: {
        color: '#000000',
    },
});

export default ProfileScreen;
