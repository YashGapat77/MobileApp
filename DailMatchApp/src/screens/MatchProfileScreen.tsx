import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MatchProfileScreen = ({ route, navigation }: any) => {
    const { match } = route.params || {};

    if (!match) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Profile not found</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{match.name}</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Photo */}
                <View style={styles.photoContainer}>
                    <Image
                        source={{ uri: match.photo || 'https://randomuser.me/api/portraits/women/1.jpg' }}
                        style={styles.photo}
                        resizeMode="cover"
                    />
                </View>

                {/* Basic Info */}
                <View style={styles.infoSection}>
                    <Text style={styles.name}>{match.name}</Text>
                    {match.age && <Text style={styles.age}>{match.age} years old</Text>}

                    {match.bio && (
                        <View style={styles.bioContainer}>
                            <Text style={styles.sectionTitle}>About</Text>
                            <Text style={styles.bioText}>{match.bio}</Text>
                        </View>
                    )}

                    {match.occupation && (
                        <View style={styles.detailRow}>
                            <Icon name="briefcase-outline" size={20} color="#666" />
                            <Text style={styles.detailText}>{match.occupation}</Text>
                        </View>
                    )}

                    {match.education && (
                        <View style={styles.detailRow}>
                            <Icon name="school-outline" size={20} color="#666" />
                            <Text style={styles.detailText}>{match.education}</Text>
                        </View>
                    )}

                    {match.location && (
                        <View style={styles.detailRow}>
                            <Icon name="map-marker-outline" size={20} color="#666" />
                            <Text style={styles.detailText}>{match.location}</Text>
                        </View>
                    )}
                </View>

                {/* Prompts */}
                {match.prompts && match.prompts.length > 0 && (
                    <View style={styles.promptsSection}>
                        <Text style={styles.sectionTitle}>More About {match.name}</Text>
                        {match.prompts.map((prompt: any, index: number) => (
                            <View key={index} style={styles.promptCard}>
                                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                                <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => navigation.navigate('Chat', { match })}
                >
                    <Icon name="message-text" size={24} color="#FFF" />
                    <Text style={styles.chatButtonText}>Message</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 25) + 10 : 0,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
    },
    photoContainer: {
        width: '100%',
        height: 400,
        backgroundColor: '#E0E0E0',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    infoSection: {
        backgroundColor: '#FFF',
        padding: 20,
        marginTop: 10,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    age: {
        fontSize: 18,
        color: '#666',
        marginBottom: 15,
    },
    bioContainer: {
        marginTop: 15,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 10,
    },
    bioText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 10,
    },
    promptsSection: {
        backgroundColor: '#FFF',
        padding: 20,
        marginTop: 10,
    },
    promptCard: {
        backgroundColor: '#F8F8F8',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },
    promptQuestion: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    promptAnswer: {
        fontSize: 16,
        color: '#000',
        lineHeight: 22,
    },
    actionButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    chatButton: {
        backgroundColor: '#000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderRadius: 30,
        gap: 10,
    },
    chatButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#000',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default MatchProfileScreen;
