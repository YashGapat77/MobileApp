import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
    Modal,
    Animated,
    UIManager,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import api, { userAPI } from '../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EditProfileScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(false);

    // Prompt Picker State
    const [promptPickerVisible, setPromptPickerVisible] = useState(false);
    const [activePromptIndex, setActivePromptIndex] = useState<number | null>(null);

    const availablePrompts = [
        "My simple pleasures",
        "I'm looking for",
        "My ideal Sunday",
        "I'm passionate about",
        "My love language",
        "A non-negotiable for me",
        "Two truths and a lie",
        "I'm weirdly attracted to",
        "Dating me is like",
        "Best travel story",
        "I geek out on"
    ];

    const [photos, setPhotos] = useState<any[]>([null, null, null, null, null, null]);
    const [bio, setBio] = useState('');
    const [occupation, setOccupation] = useState('');
    const [education, setEducation] = useState('');
    const [height, setHeight] = useState('');
    const [location, setLocation] = useState('');
    const [prompts, setPrompts] = useState([
        { question: 'My simple pleasures', answer: '' },
        { question: "I'm looking for", answer: '' },
    ]);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await userAPI.getProfile();
                if (data.profile) {
                    setBio(data.profile.bio || '');
                    setOccupation(data.profile.occupation || '');
                    setEducation(data.profile.education || '');
                    setHeight(data.profile.height || '');
                    setLocation(data.profile.location || '');

                    if (data.profile.photos) {
                        setPhotos(prevPhotos => {
                            const newPhotos = [...prevPhotos];
                            data.profile.photos.forEach((photo: string, index: number) => {
                                if (index < 6) newPhotos[index] = { uri: photo };
                            });
                            return newPhotos;
                        });
                    }

                    if (data.profile.prompts) {
                        setPrompts(data.profile.prompts);
                    }
                }

                // Soft Fade In
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }).start();

            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const handleImagePick = async (index: number) => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            const newPhotos = [...photos];
            newPhotos[index] = result.assets[0];
            setPhotos(newPhotos);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append('bio', bio);
            formData.append('occupation', occupation);
            formData.append('education', education);
            formData.append('height', height);
            formData.append('location', location);
            formData.append('prompts', JSON.stringify(prompts));

            photos.forEach((photo, idx) => {
                if (photo && photo.uri && !photo.uri.startsWith('http')) {
                    const uri = Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', '');
                    const filename = photo.fileName || `photo_${idx}.jpg`;
                    // @ts-ignore
                    formData.append('photo', {
                        uri,
                        name: filename,
                        type: photo.type || 'image/jpeg',
                    } as any);
                }
            });

            await api.put('/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Lovely!', 'Your profile has been updated.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFCF5" />

            {/* Header - Soft & Elegant */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.headerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#C1A384" />
                    ) : (
                        <Text style={styles.headerSave}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                style={[styles.content, { opacity: fadeAnim }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Photos Section - Polaroid Style */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>My Photos</Text>
                    <View style={styles.photosGrid}>
                        {photos.map((photo, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.photoBox}
                                onPress={() => handleImagePick(index)}
                                activeOpacity={0.9}
                            >
                                {photo ? (
                                    <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Icon name="plus" size={20} color="#C1A384" />
                                    </View>
                                )}
                                {photo && (
                                    <View style={styles.editIconContainer}>
                                        <Icon name="pencil" size={10} color="#FFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Bio Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>About Me</Text>
                    <View style={styles.softInputContainer}>
                        <TextInput
                            style={styles.bioInput}
                            placeholder="Tell your story..."
                            placeholderTextColor="#A89F91"
                            multiline
                            value={bio}
                            onChangeText={setBio}
                            maxLength={500}
                        />
                    </View>
                </View>

                {/* Details Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>The Basics</Text>
                    <View style={styles.detailsGroup}>
                        <View style={styles.detailInputRow}>
                            <Text style={styles.detailLabel}>Work</Text>
                            <TextInput
                                style={styles.detailInputField}
                                placeholder="Occupation"
                                placeholderTextColor="#A89F91"
                                value={occupation}
                                onChangeText={setOccupation}
                            />
                        </View>
                        <View style={styles.detailInputRow}>
                            <Text style={styles.detailLabel}>Education</Text>
                            <TextInput
                                style={styles.detailInputField}
                                placeholder="School"
                                placeholderTextColor="#A89F91"
                                value={education}
                                onChangeText={setEducation}
                            />
                        </View>
                        <View style={styles.detailInputRow}>
                            <Text style={styles.detailLabel}>Living In</Text>
                            <TextInput
                                style={styles.detailInputField}
                                placeholder="Location"
                                placeholderTextColor="#A89F91"
                                value={location}
                                onChangeText={setLocation}
                            />
                        </View>
                        <View style={styles.detailInputRow}>
                            <Text style={styles.detailLabel}>Height</Text>
                            <TextInput
                                style={styles.detailInputField}
                                placeholder="Height"
                                placeholderTextColor="#A89F91"
                                value={height}
                                onChangeText={setHeight}
                            />
                        </View>
                    </View>
                </View>

                {/* Prompts Section */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>My Thoughts</Text>

                    {prompts.map((prompt, index) => (
                        <View key={index} style={styles.promptCard}>
                            <TouchableOpacity
                                style={styles.promptHeader}
                                onPress={() => { setActivePromptIndex(index); setPromptPickerVisible(true); }}
                            >
                                <Text style={styles.promptQuestion}>{prompt.question}</Text>
                                <Icon name="chevron-down" size={16} color="#C1A384" />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.promptAnswerInput}
                                placeholder="Your answer..."
                                placeholderTextColor="#A89F91"
                                multiline
                                value={prompt.answer}
                                onChangeText={(text) => {
                                    const newPrompts = prompts.map((p, i) =>
                                        i === index ? { ...p, answer: text } : p
                                    );
                                    setPrompts(newPrompts);
                                }}
                            />
                        </View>
                    ))}
                </View>
            </Animated.ScrollView>

            {/* Prompt Picker Modal */}
            <Modal
                visible={promptPickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPromptPickerVisible(false)}
            >
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select a Topic</Text>
                            <TouchableOpacity onPress={() => setPromptPickerVisible(false)}>
                                <Icon name="close" size={22} color="#555" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {availablePrompts.map((q, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.modalOption}
                                    onPress={() => {
                                        if (activePromptIndex !== null) {
                                            const newPrompts = prompts.map((p, idx) =>
                                                idx === activePromptIndex ? { ...p, question: q } : p
                                            );
                                            setPrompts(newPrompts);
                                        }
                                        setPromptPickerVisible(false);
                                    }}
                                >
                                    <View style={styles.bulletPoint} />
                                    <Text style={styles.modalOptionText}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFCF5', // Warm Beige / Paper
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 15 : 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '500',
    },
    headerCancel: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
    headerSave: {
        fontSize: 16,
        color: '#C1A384',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
    },
    sectionContainer: {
        marginBottom: 35,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#C1A384',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 15,
        fontWeight: '600',
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -6,
    },
    photoBox: {
        width: '30%',
        aspectRatio: 0.85,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        marginHorizontal: '1.5%',
        justifyContent: 'center',
        alignItems: 'center',
        // Soft Shadow
        shadowColor: "#C1A384",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
        padding: 4, // Polaroid border effect
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    photoPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#F9F7F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EFEBE0',
        borderStyle: 'dashed',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#C1A384',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    softInputContainer: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#C1A384",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },
    bioInput: {
        fontSize: 16,
        color: '#444',
        lineHeight: 24,
        minHeight: 80,
    },
    detailsGroup: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowColor: "#C1A384",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 2,
    },
    detailInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F5EE',
    },
    detailLabel: {
        width: 80,
        fontSize: 13,
        color: '#AA9C8E',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    detailInputField: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        padding: 0,
    },
    promptCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#C1A384",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
        borderLeftWidth: 3,
        borderLeftColor: '#E8E1D5',
    },
    promptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    promptQuestion: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8A7E72',
        flex: 1,
        marginRight: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    promptAnswerInput: {
        fontSize: 17,
        color: '#333',
        lineHeight: 26,
    },
    // Modal
    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(255,252,245,0.9)', // Translucent Paper
        justifyContent: 'center',
        padding: 25,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        maxHeight: '70%',
        shadowColor: "#C1A384",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F7F2',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    modalOption: {
        paddingVertical: 18,
        paddingHorizontal: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#FDFBF7',
        flexDirection: 'row',
        alignItems: 'center',
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D6C6B0',
        marginRight: 15,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#555',
    },
});

export default EditProfileScreen;
