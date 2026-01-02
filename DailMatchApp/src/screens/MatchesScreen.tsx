import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    StatusBar,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { matchAPI } from '../services/api';

interface Match {
    id: string;
    userId: string;
    name: string;
    photo: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    online?: boolean;
}

const MatchesScreen = ({ navigation }: any) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [newMatches, setNewMatches] = useState<Match[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadMatches();
        }, [])
    );

    const loadMatches = async () => {
        try {
            setLoading(true);
            const response = await matchAPI.getMatches();

            // Separate new matches (no messages yet) from conversations
            const allMatches = response.matches || [];
            setNewMatches(allMatches.filter((m: Match) => m.lastMessage === 'Say hi!' || !m.lastMessage));
            setMatches(allMatches.filter((m: Match) => m.lastMessage && m.lastMessage !== 'Say hi!'));
        } catch (error) {
            console.error('Error loading matches:', error);
            // Mock data
            setNewMatches([
                {
                    id: '1',
                    userId: '1',
                    name: 'Sarah',
                    photo: 'https://randomuser.me/api/portraits/women/1.jpg',
                    lastMessage: '',
                    timestamp: 'New',
                    unread: true,
                    online: true,
                },
                {
                    id: '2',
                    userId: '2',
                    name: 'Emma',
                    photo: 'https://randomuser.me/api/portraits/women/3.jpg',
                    lastMessage: '',
                    timestamp: 'New',
                    unread: true,
                    online: false,
                },
            ]);
            setMatches([
                {
                    id: '3',
                    userId: '3',
                    name: 'Olivia',
                    photo: 'https://randomuser.me/api/portraits/women/5.jpg',
                    lastMessage: 'Hey! How was your weekend?',
                    timestamp: '2m ago',
                    unread: true,
                    online: true,
                },
                {
                    id: '4',
                    userId: '4',
                    name: 'Sophia',
                    photo: 'https://randomuser.me/api/portraits/women/7.jpg',
                    lastMessage: 'That sounds amazing! 😊',
                    timestamp: '1h ago',
                    unread: false,
                    online: false,
                },
                {
                    id: '5',
                    userId: '5',
                    name: 'Ava',
                    photo: 'https://randomuser.me/api/portraits/women/9.jpg',
                    lastMessage: 'Would love to grab coffee sometime',
                    timestamp: 'Yesterday',
                    unread: false,
                    online: false,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filteredMatches = matches.filter(match =>
        match.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderNewMatch = ({ item }: { item: Match }) => (
        <TouchableOpacity
            style={styles.newMatchItem}
            onPress={() => navigation.navigate('Chat', { match: item })}
        >
            <View style={styles.newMatchImageContainer}>
                <Image source={{ uri: item.photo }} style={styles.newMatchImage} />
                {item.online && <View style={styles.onlineIndicator} />}
            </View>
            <Text style={styles.newMatchName} numberOfLines={1}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderMatch = ({ item }: { item: Match }) => (
        <TouchableOpacity
            style={styles.matchItem}
            onPress={() => navigation.navigate('Chat', { match: item })}
        >
            <View style={styles.matchImageContainer}>
                <Image source={{ uri: item.photo }} style={styles.matchImage} />
                {item.online && <View style={styles.onlineIndicatorSmall} />}
            </View>
            <View style={styles.matchInfo}>
                <View style={styles.matchHeader}>
                    <Text style={[styles.matchName, item.unread && styles.unreadName]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.matchTime, item.unread && styles.unreadTime]}>
                        {item.timestamp}
                    </Text>
                </View>
                <View style={styles.messageRow}>
                    <Text
                        style={[styles.lastMessage, item.unread && styles.unreadMessage]}
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>
                    {item.unread && <View style={styles.unreadDot} />}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Icon name="heart-broken" size={60} color="#CCC" />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>
                Keep swiping to find your perfect match!
            </Text>
            <TouchableOpacity
                style={styles.discoverButton}
                onPress={() => navigation.navigate('Home')}
            >
                <Text style={styles.discoverButtonText}>Start Discovering</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity>
                    <Icon name="filter-variant" size={26} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={22} color="#999" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search matches..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#000000" />
                </View>
            ) : matches.length === 0 && newMatches.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={filteredMatches}
                    renderItem={renderMatch}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    windowSize={10}
                    maxToRenderPerBatch={10}
                    removeClippedSubviews={true}
                    ListHeaderComponent={
                        newMatches.length > 0 ? (
                            <View>
                                <Text style={styles.sectionTitle}>New Matches</Text>
                                <FlatList
                                    data={newMatches}
                                    renderItem={renderNewMatch}
                                    keyExtractor={item => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.newMatchesList}
                                    initialNumToRender={5}
                                    windowSize={3}
                                />
                                <Text style={styles.sectionTitle}>Messages</Text>
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        searchQuery.length > 0 ? (
                            <View style={styles.noResults}>
                                <Text style={styles.noResultsText}>No matches found</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Home')}
                >
                    <Icon name="cards" size={26} color="#CCC" />
                    <Text style={styles.navLabel}>Discover</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Icon name="chat-processing" size={26} color="#000000" />
                    <Text style={[styles.navLabel, styles.navLabelActive]}>Matches</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Icon name="account" size={26} color="#CCC" />
                    <Text style={styles.navLabel}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        marginHorizontal: 20,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderRadius: 25,
        height: 45,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 15,
    },
    newMatchesList: {
        paddingLeft: 20,
        paddingRight: 10,
        marginBottom: 10,
    },
    newMatchItem: {
        alignItems: 'center',
        marginRight: 15,
        width: 75,
    },
    newMatchImageContainer: {
        position: 'relative',
    },
    newMatchImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#000000',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    newMatchName: {
        fontSize: 13,
        color: '#333',
        marginTop: 6,
        textAlign: 'center',
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    matchImageContainer: {
        position: 'relative',
    },
    matchImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    onlineIndicatorSmall: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    matchInfo: {
        flex: 1,
        marginLeft: 15,
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    matchName: {
        fontSize: 17,
        fontWeight: '500',
        color: '#333',
    },
    unreadName: {
        fontWeight: 'bold',
    },
    matchTime: {
        fontSize: 13,
        color: '#999',
    },
    unreadTime: {
        color: '#000000',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 15,
        color: '#666',
        flex: 1,
    },
    unreadMessage: {
        color: '#333',
        fontWeight: '500',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#000000',
        marginLeft: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    discoverButton: {
        backgroundColor: '#000000',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginTop: 25,
    },
    discoverButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    noResults: {
        padding: 40,
        alignItems: 'center',
    },
    noResultsText: {
        fontSize: 16,
        color: '#999',
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
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

export default MatchesScreen;
