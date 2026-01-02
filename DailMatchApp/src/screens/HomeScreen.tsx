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

    const loadProfiles = React.useCallback(async () => {
        try {
            setLoading(true);
            setCurrentIndex(0);

            // Load filters
            let filters = {};
            try {
                const savedFilters = await AsyncStorage.getItem('filters');
                if (savedFilters) {
                    filters = JSON.parse(savedFilters);
                }
            } catch (e) {
                console.error('Error loading filters', e);
            }

            const response = await matchAPI.getPotentialMatches(filters);
            if (response.matches && response.matches.length > 0) {
                setProfiles(response.matches);
            } else {
                setProfiles(mockProfiles);
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
            setProfiles(mockProfiles);
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

    const nextProfile = () => {
        // Reset Logic
        setCurrentIndex(prev => prev + 1);
        setCurrentPhotoIndex(0);
        position.setValue({ x: 0, y: 0 });
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });

        // Fade In Content
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleLike = async () => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        // Animate Right
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
                    setMatchModalVisible(true);
                }
            } catch (error) {
                console.error("Like failed", error);
            }
            nextProfile();
        });
    };

    const handlePass = async () => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        // Animate Left
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

    const handleSuperLike = async () => {
        const currentProfile = profiles[currentIndex];
        if (!currentProfile) return;

        if (superLikesLeft <= 0) {
            Alert.alert('No Super Likes', 'Get Premium for more!');
            return;
        }

        // Animate Up
        Animated.timing(position, {
            toValue: { x: 0, y: -SCREEN_HEIGHT - 100 },
            duration: 400,
            useNativeDriver: true,
        }).start(async () => {
            // Mock API for now or add endpoint
            setSuperLikesLeft(prev => prev - 1);
            try {
                // Treat as like for now
                const response = await matchAPI.swipeRight(currentProfile.id, "Super Like!");
                if (response.match) {
                    setMatchedProfile(currentProfile);
                    setMatchModalVisible(true);
                }
            } catch (e) { }
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
                <ActivityIndicator size="large" color="#FF4B6E" style={{ marginTop: 50 }} />
            </SafeAreaView>
        );
    }

    if (currentIndex >= profiles.length) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.endOfFeed}>
                    <Icon name="check-circle-outline" size={80} color="#DDD" />
                    <Text style={styles.endText}>That's everyone!</Text>
                    <TouchableOpacity style={styles.reloadButton} onPress={loadProfiles}>
                        <Text style={styles.reloadButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const profile = profiles[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Icon name="account-circle" size={32} color="#000" />
                </TouchableOpacity>
                <Text style={styles.logo}>SoulFix</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('Filters')}>
                        <Icon name="tune" size={28} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Matches')}>
                        <Icon name="message-text-outline" size={28} color="#000" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Animated Card */}
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
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Header Info */}
                    <View style={styles.profileInfoHead}>
                        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                        <Icon name="check-decagram" size={18} color="#1DA1F2" />
                    </View>

                    {/* Photos */}
                    <View style={styles.photoSection}>
                        <Image source={{ uri: profile.photos[currentPhotoIndex] }} style={styles.mainPhoto} />

                        {/* Taps */}
                        <View style={styles.tapOverlay}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={prevPhoto} />
                            <TouchableOpacity style={{ flex: 1 }} onPress={nextPhoto} />
                        </View>

                        {/* Indicators */}
                        <View style={styles.indicators}>
                            {profile.photos.map((_, i) => (
                                <View key={i} style={[styles.indicator, i === currentPhotoIndex && styles.indicatorActive]} />
                            ))}
                        </View>
                    </View>

                    {/* Bio */}
                    <Text style={styles.bio}>{profile.bio}</Text>

                    {/* Details */}
                    <View style={styles.detailsBox}>
                        {profile.occupation && <View style={styles.detailRow}><Icon name="briefcase-outline" size={18} /><Text style={styles.detailText}>{profile.occupation}</Text></View>}
                        {profile.location && <View style={styles.detailRow}><Icon name="map-marker-outline" size={18} /><Text style={styles.detailText}>{profile.location}</Text></View>}
                        {profile.height && <View style={styles.detailRow}><Icon name="human-male-height" size={18} /><Text style={styles.detailText}>{profile.height}</Text></View>}
                    </View>

                    {/* Prompts */}
                    {profile.prompts?.map((prompt, i) => (
                        <View key={i} style={styles.promptCard}>
                            <Text style={styles.promptQ}>{prompt.question}</Text>
                            <Text style={styles.promptA}>{prompt.answer}</Text>
                        </View>
                    ))}
                </ScrollView>
            </Animated.View>

            {/* Actions Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity onPress={handlePass} style={[styles.btn, styles.btnPass]}>
                    <Icon name="close" size={30} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSuperLike} style={[styles.btn, styles.btnSuper]}>
                    <Icon name="star" size={24} color="#000" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLike} style={[styles.btn, styles.btnLike]}>
                    <Icon name="heart" size={30} color="#000" />
                </TouchableOpacity>
            </View>

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
        color: '#FF4B6E',
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
        borderLeftColor: '#FF4B6E',
    },
    promptQ: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF4B6E',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    promptA: {
        fontSize: 18,
        color: '#000',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingVertical: 15,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
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
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#EEE', // Neutral border
    },
    btnPass: {
        // No extra color
    },
    btnLike: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderColor: '#000', // Highlight primary action with black
        borderWidth: 1,
    },
    btnSuper: {
        width: 50,
        height: 50,
    },
    endOfFeed: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    endText: {
        marginTop: 20,
        fontSize: 18,
        color: '#999',
    },
    reloadButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#FF4B6E',
        borderRadius: 25,
    },
    reloadButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
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
        color: '#FF4B6E',
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
        borderColor: '#FF4B6E',
    },
    connectLine: {
        width: 50,
        height: 2,
        backgroundColor: '#FF4B6E',
        marginHorizontal: -5,
        zIndex: -1,
    },
    chatButton: {
        backgroundColor: '#FF4B6E',
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
