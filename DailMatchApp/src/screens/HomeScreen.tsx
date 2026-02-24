import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Animated,
    Platform,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { matchAPI } from '../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Profile {
    id: string;
    name: string;
    age: number;
    bio: string;
    photos: string[];
    occupation?: string;
    education?: string;
    height?: string;
    location?: string;
    prompts?: Array<{ question: string; answer: string }>;
}

const mockProfiles: Profile[] = [
    {
        id: '101',
        name: 'Sarah',
        age: 25,
        bio: 'Love hiking and coffee ☕',
        photos: [
            'https://randomuser.me/api/portraits/women/1.jpg',
            'https://randomuser.me/api/portraits/women/2.jpg',
        ],
        occupation: 'Product Designer',
        education: 'Stanford University',
        height: '5\'7"',
        location: 'San Francisco, CA',
        prompts: [
            { question: 'My simple pleasures', answer: 'Sunday morning coffee and a good book' },
            { question: 'I\'m looking for', answer: 'Someone who can make me laugh' },
        ],
    },
    {
        id: '102',
        name: 'Emma',
        age: 23,
        bio: 'Foodie | Traveler | Dog lover 🐕',
        photos: [
            'https://randomuser.me/api/portraits/women/3.jpg',
            'https://randomuser.me/api/portraits/women/4.jpg',
        ],
        occupation: 'Marketing Manager',
        education: 'UCLA',
        height: '5\'5"',
        location: 'Los Angeles, CA',
        prompts: [
            { question: 'My ideal Sunday', answer: 'Brunch, beach, and good company' },
            { question: 'Green flags I look for', answer: 'Good communication and kindness' },
        ],
    },
];

const HomeScreen = ({ navigation }: any) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [superLikesLeft, setSuperLikesLeft] = useState(3);

    // Animation Refs
    const position = useRef(new Animated.ValueXY()).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const superLikeAnim = useRef(new Animated.Value(0)).current;

    const scrollViewRef = useRef<ScrollView>(null);

    // Match State
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null);
    const [newMatchId, setNewMatchId] = useState<string | null>(null);

    // Rotation interpolation for exit animations
    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ['-10deg', '0deg', '10deg'],
        extrapolate: 'clamp',
    });

    const rotateAndTranslate = {
        transform: [
            { rotate: rotate },
            ...position.getTranslateTransform(),
        ],
    };

    // Daily Limit State
    const [swipedCount, setSwipedCount] = useState(0);
    const [lastResetTime, setLastResetTime] = useState<number | null>(null);

    const loadProfiles = React.useCallback(async () => {
        try {
            setLoading(true);

            // Check daily limit
            const now = Date.now();
            const storedResetTime = await AsyncStorage.getItem('lastResetTime');
            const storedSwipedCount = await AsyncStorage.getItem('swipedCount');
            const storedDailyProfiles = await AsyncStorage.getItem('dailyProfiles');

            let currentSwipedCount = storedSwipedCount ? parseInt(storedSwipedCount) : 0;
            let currentLastResetTime = storedResetTime ? parseInt(storedResetTime) : 0;
            let dailyProfiles: Profile[] = storedDailyProfiles ? JSON.parse(storedDailyProfiles) : [];

            // If it's been more than 24 hours, reset
            if (!currentLastResetTime || now - currentLastResetTime > 24 * 60 * 60 * 1000) {
                currentSwipedCount = 0;
                currentLastResetTime = now;

                // Fetch new profiles and take only 3
                let filters = {};
                try {
                    const savedFilters = await AsyncStorage.getItem('filters');
                    if (savedFilters) {
                        filters = JSON.parse(savedFilters);
                    }
                } catch (e) { }

                const response = await matchAPI.getPotentialMatches(filters);
                dailyProfiles = response.matches ? response.matches.slice(0, 3) : [];

                await AsyncStorage.setItem('lastResetTime', currentLastResetTime.toString());
                await AsyncStorage.setItem('swipedCount', '0');
                await AsyncStorage.setItem('dailyProfiles', JSON.stringify(dailyProfiles));
            }

            setSwipedCount(currentSwipedCount);
            setLastResetTime(currentLastResetTime);
            setProfiles(dailyProfiles);
            setCurrentIndex(currentSwipedCount);

        } catch (error) {
            console.error('Error loading profiles:', error);
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfiles();
        const unsubscribe = navigation.addListener('focus', () => {
            loadProfiles();
        });
        return unsubscribe;
    }, [navigation, loadProfiles]);

    const updateSwipedCount = async (newCount: number) => {
        setSwipedCount(newCount);
        setCurrentIndex(newCount);
        await AsyncStorage.setItem('swipedCount', newCount.toString());
    };

    const nextProfile = () => {
        const nextIdx = currentIndex + 1;
        updateSwipedCount(nextIdx);
        setCurrentPhotoIndex(0);
        position.setValue({ x: 0, y: 0 });
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });

        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleChatAction = async () => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 150, y: -50 },
            duration: 400,
            useNativeDriver: true,
        }).start(async () => {
            try {
                const response = await matchAPI.swipeRight(currentProfile.id);
                if (response.match) {
                    setMatchedProfile(currentProfile);
                    setNewMatchId(response.match_id);
                    // Navigate directly to chat as requested
                    navigation.navigate('Chat', {
                        match: {
                            id: response.match_id || 'new_match',
                            userId: currentProfile.id,
                            name: currentProfile.name,
                            photo: currentProfile.photos[0],
                            lastMessage: 'Say hi!',
                            timestamp: 'Just now'
                        }
                    });
                }
            } catch (error) {
                console.error("Chat action failed", error);
            }
            nextProfile();
        });
    };

    const handlePass = async () => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 150, y: -50 },
            duration: 400,
            useNativeDriver: true,
        }).start(async () => {
            try {
                await matchAPI.swipeLeft(currentProfile.id);
            } catch (error) {
                console.error("Pass failed", error);
            }
            nextProfile();
        });
    };

    const nextPhoto = () => {
        if (profiles[currentIndex] && currentPhotoIndex < profiles[currentIndex].photos.length - 1) {
            setCurrentPhotoIndex(prev => prev + 1);
        }
    };

    const prevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prev => prev - 1);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#002147" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    const profile = profiles[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header - Always Visible */}
            <View style={styles.header}>
                <View style={{ width: 32 }} />
                <Text style={styles.logo}>SoulFix</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Filters')}>
                    <Icon name="tune" size={28} color="#000" />
                </TouchableOpacity>
            </View>

            {currentIndex >= profiles.length || currentIndex >= 3 ? (
                <View style={styles.endOfFeed}>
                    <Icon name="clock-outline" size={80} color="#DDD" />
                    <Text style={styles.endTitle}>That's your 3 for today!</Text>
                    <Text style={styles.endSub}>Come back in 24 hours for more curated matches.</Text>
                    <TouchableOpacity
                        style={styles.reloadButton}
                        onPress={() => navigation.navigate('Matches')}
                    >
                        <Text style={styles.reloadButtonText}>View Your Chats</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.View
                    style={[
                        styles.cardContainer,
                        {
                            opacity: fadeAnim,
                            transform: rotateAndTranslate.transform
                        }
                    ]}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 150 }}
                    >
                        <View style={styles.profileInfoHead}>
                            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                            <Icon name="check-decagram" size={18} color="#1DA1F2" />
                        </View>

                        <View style={styles.photoSection}>
                            <Image source={{ uri: profile.photos[currentPhotoIndex] }} style={styles.mainPhoto} />
                            <View style={styles.tapOverlay}>
                                <TouchableOpacity style={{ flex: 1 }} onPress={prevPhoto} />
                                <TouchableOpacity style={{ flex: 1 }} onPress={nextPhoto} />
                            </View>
                            <View style={styles.indicators}>
                                {profile.photos.map((_, i) => (
                                    <View key={i} style={[styles.indicator, i === currentPhotoIndex && styles.indicatorActive]} />
                                ))}
                            </View>
                        </View>

                        <Text style={styles.bio}>{profile.bio}</Text>

                        <View style={styles.detailsBox}>
                            {profile.occupation && <View style={styles.detailRow}><Icon name="briefcase-outline" size={18} /><Text style={styles.detailText}>{profile.occupation}</Text></View>}
                            {profile.location && <View style={styles.detailRow}><Icon name="map-marker-outline" size={18} /><Text style={styles.detailText}>{profile.location}</Text></View>}
                            {profile.height && <View style={styles.detailRow}><Icon name="human-male-height" size={18} /><Text style={styles.detailText}>{profile.height}</Text></View>}
                        </View>

                        {profile.prompts?.map((prompt, i) => (
                            <View key={i} style={styles.promptCard}>
                                <Text style={styles.promptQ}>{prompt.question}</Text>
                                <Text style={styles.promptA}>{prompt.answer}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </Animated.View>
            )}

            {/* Actions Buttons - Only show if not at end */}
            {!(currentIndex >= profiles.length || currentIndex >= 3) && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={handlePass} style={[styles.btn, styles.btnCancel]}>
                        <Icon name="cancel" size={32} color="#FF5A5F" />
                        <Text style={styles.btnLabel}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleChatAction} style={[styles.btn, styles.btnChat]}>
                        <Icon name="chat" size={32} color="#FFF" />
                        <Text style={[styles.btnLabel, { color: '#FFF' }]}>Chat</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Match Modal */}



            {/* Match Modal */}
            <Modal
                visible={matchModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMatchModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.matchCard}>
                        <Text style={styles.matchTitle}>It's a Match!</Text>
                        <Text style={styles.matchSub}>You and {matchedProfile?.name} like each other.</Text>

                        <View style={styles.avatarsRow}>
                            {/* User Avatar Placeholder - Real app would have user's data */}
                            <View style={[styles.avatar, { backgroundColor: '#EEE' }]} />
                            <View style={styles.connectLine} />
                            <Image source={{ uri: matchedProfile?.photos?.[0] }} style={styles.avatar} />
                        </View>

                        <TouchableOpacity
                            style={styles.chatButton}
                            onPress={() => {
                                setMatchModalVisible(false);
                                navigation.navigate('Chat', {
                                    match: {
                                        id: newMatchId || 'new_match',
                                        user: { id: matchedProfile?.id, name: matchedProfile?.name, photo: matchedProfile?.photos?.[0] }
                                    }
                                });
                            }}
                        >
                            <Text style={styles.chatBtnText}>Send Message</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setMatchModalVisible(false)}>
                            <Text style={styles.closeText}>Keep Swiping</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    logo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#002147',
    },
    cardContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    profileInfoHead: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 5,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    photoSection: {
        height: SCREEN_HEIGHT * 0.55,
        marginHorizontal: 10,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    },
    mainPhoto: {
        width: '100%',
        height: '100%',
    },
    tapOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
    },
    indicators: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    indicator: {
        width: 30,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
        borderRadius: 2,
    },
    indicatorActive: {
        backgroundColor: '#FFF',
    },
    bio: {
        fontSize: 16,
        color: '#444',
        padding: 20,
        lineHeight: 24,
    },
    detailsBox: {
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailText: {
        fontSize: 15,
        color: '#666',
    },
    promptCard: {
        marginHorizontal: 20,
        backgroundColor: '#F9F9F9',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#002147',
    },
    promptQ: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#002147',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    promptA: {
        fontSize: 18,
        color: '#000',
        fontStyle: 'italic',
    },
    actionButtons: {
        position: 'absolute',
        bottom: 90, // Resting above the 65-80px tab bar
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 20,
        elevation: 20,
    },
    btn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8, // Higher elevation to float
        borderWidth: 0, // Clean look
    },
    btnCancel: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
    },
    btnChat: {
        width: 140,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#002147',
        flexDirection: 'row',
        gap: 8,
    },
    btnLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF5A5F',
        marginTop: 4,
    },
    endOfFeed: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    endTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#002147',
        marginTop: 20,
        textAlign: 'center',
    },
    endSub: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 24,
    },
    reloadButton: {
        marginTop: 30,
        paddingHorizontal: 30,
        paddingVertical: 15,
        backgroundColor: '#002147',
        borderRadius: 30,
    },
    reloadButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Match Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)', // Dark overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    matchCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
    },
    matchTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#002147',
        marginBottom: 10,
        fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
        fontStyle: 'italic',
    },
    matchSub: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#002147',
    },
    connectLine: {
        width: 50,
        height: 2,
        backgroundColor: '#002147',
        marginHorizontal: -5,
        zIndex: -1,
    },
    chatButton: {
        backgroundColor: '#002147',
        width: '100%',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
    },
    chatBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeText: {
        color: '#999',
        fontSize: 14,
    },
});

export default HomeScreen;
