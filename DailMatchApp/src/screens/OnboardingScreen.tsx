import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Image,
    TextInput,
    ScrollView,
    Alert,
    Dimensions,
    Platform,
    ImageBackground,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';

const { width } = Dimensions.get('window');

const PROMPTS = [
    "My simple pleasures",
    "I'm looking for",
    "A life goal of mine",
    "My love language is",
    "The way to win me over",
    "I get along best with people who",
    "My most controversial opinion is",
    "Favorite thing to do on a rainy day",
    "A random fact I love",
    "My ideal first date",
    "Song that describes my life",
    "I'm weirdly attracted to",
    "Best travel story",
    "Dream dinner guest",
    "Two truths and a lie",
    "What I order for the table",
    "My zombie apocalypse plan",
    "I'm overly competitive about",
    "Biggest risk I've taken",
];

const OnboardingScreen = ({ navigation }: any) => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    // Step 1: Photos
    const [photos, setPhotos] = useState<any[]>([null, null, null, null, null, null]);

    // Step 2: About
    const [bio, setBio] = useState('');

    // Step 3: Details
    const [occupation, setOccupation] = useState('');
    const [education, setEducation] = useState('');
    const [height, setHeight] = useState('');
    const [location, setLocation] = useState('');

    // Step 4: Prompts
    const [selectedPrompt1, setSelectedPrompt1] = useState(PROMPTS[0]);
    const [answer1, setAnswer1] = useState('');
    const [selectedPrompt2, setSelectedPrompt2] = useState(PROMPTS[1]);
    const [answer2, setAnswer2] = useState('');
    const [selectedPrompt3, setSelectedPrompt3] = useState(PROMPTS[2]);
    const [answer3, setAnswer3] = useState('');

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

    const uploadedPhotosCount = photos.filter(p => p !== null).length;

    const canProceed = () => {
        switch (step) {
            case 1:
                return uploadedPhotosCount >= 2;
            case 2:
                return bio.trim().length >= 10;
            case 3:
                return occupation.trim().length > 0;
            case 4:
                return answer1.trim().length > 0 && answer2.trim().length > 0 && answer3.trim().length > 0;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = async () => {
        try {
            const formData = new FormData();
            formData.append('bio', bio);
            formData.append('occupation', occupation);
            formData.append('education', education);
            formData.append('height', height);
            formData.append('location', location);
            formData.append('prompts', JSON.stringify([
                { question: selectedPrompt1, answer: answer1 },
                { question: selectedPrompt2, answer: answer2 },
                { question: selectedPrompt3, answer: answer3 },
            ]));

            photos.forEach((photo, idx) => {
                if (photo && photo.uri) {
                    const uri = Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', '');
                    formData.append('photo', {
                        uri,
                        name: photo.fileName || `photo_${idx}.jpg`,
                        type: photo.type || 'image/jpeg',
                    } as any);
                }
            });

            await api.put('/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Welcome!', 'Your profile is ready. Start discovering!', [
                { text: 'Let\'s Go!', onPress: () => navigation.replace('Home') },
            ]);
        } catch (error) {
            console.error('Error saving profile:', error);
            navigation.replace('Home');
        }
    };

    const handleSkip = () => {
        Alert.alert(
            'Skip Profile Setup?',
            'You can complete your profile later from Settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Skip', onPress: () => navigation.replace('Home') },
            ]
        );
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map(i => (
                <View
                    key={i}
                    style={[
                        styles.progressDot,
                        i <= step && styles.progressDotActive,
                    ]}
                />
            ))}
        </View>
    );

    const renderStep1 = () => (
        <ScrollView style={styles.stepContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Add your best photos</Text>
            <Text style={styles.stepSubtitle}>
                Add at least 2 photos to get started
            </Text>

            <View style={styles.photosGrid}>
                {photos.map((photo, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.photoBox,
                            index === 0 && styles.photoBoxMain,
                        ]}
                        onPress={() => handleImagePick(index)}
                    >
                        {photo ? (
                            <Image source={{ uri: photo.uri }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Icon name="plus" size={30} color="#CCC" />
                                {index === 0 && (
                                    <Text style={styles.mainPhotoLabel}>Main</Text>
                                )}
                            </View>
                        )}
                        {photo && (
                            <TouchableOpacity
                                style={styles.removePhotoButton}
                                onPress={() => {
                                    const newPhotos = [...photos];
                                    newPhotos[index] = null;
                                    setPhotos(newPhotos);
                                }}
                            >
                                <Icon name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.photoCount}>
                {uploadedPhotosCount}/6 photos added
                {uploadedPhotosCount < 2 && ' (minimum 2 required)'}
            </Text>
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderStep2 = () => (
        <ScrollView style={styles.stepContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>
            <Text style={styles.stepSubtitle}>
                Write a short bio that shows your personality
            </Text>

            <TextInput
                style={styles.bioInput}
                placeholder="I'm passionate about..."
                placeholderTextColor="#999"
                multiline
                value={bio}
                onChangeText={setBio}
                maxLength={500}
            />

            <Text style={styles.charCount}>{bio.length}/500</Text>

            <View style={styles.tipBox}>
                <Icon name="lightbulb-outline" size={24} color="#000000" />
                <Text style={styles.tipText}>
                    Tip: Be authentic! Profiles with genuine bios get 40% more matches.
                </Text>
            </View>
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const renderStep3 = () => (
        <ScrollView style={styles.stepContent} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>A bit more about you</Text>
            <Text style={styles.stepSubtitle}>
                Help others get to know you better
            </Text>

            <View style={styles.inputGroup}>
                <View style={styles.inputRow}>
                    <Icon name="briefcase-outline" size={22} color="#666" />
                    <TextInput
                        style={styles.detailInput}
                        placeholder="What do you do?"
                        placeholderTextColor="#999"
                        value={occupation}
                        onChangeText={setOccupation}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Icon name="school-outline" size={22} color="#666" />
                    <TextInput
                        style={styles.detailInput}
                        placeholder="Where did you study?"
                        placeholderTextColor="#999"
                        value={education}
                        onChangeText={setEducation}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Icon name="human-male-height" size={22} color="#666" />
                    <TextInput
                        style={styles.detailInput}
                        placeholder="Height (e.g., 5'10)"
                        placeholderTextColor="#999"
                        value={height}
                        onChangeText={setHeight}
                    />
                </View>

                <View style={styles.inputRow}>
                    <Icon name="map-marker-outline" size={22} color="#666" />
                    <TextInput
                        style={styles.detailInput}
                        placeholder="Where are you based?"
                        placeholderTextColor="#999"
                        value={location}
                        onChangeText={setLocation}
                    />
                </View>
            </View>
            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const cyclePrompt = (current: string, setter: (val: string) => void) => {
        const currentIndex = PROMPTS.indexOf(current);
        const nextIndex = (currentIndex + 1) % PROMPTS.length;
        setter(PROMPTS[nextIndex]);
    };

    const renderStep4 = () => (
        <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>Answer prompts</Text>
            <Text style={styles.stepSubtitle}>
                Tap the question to change it
            </Text>

            {/* Prompt 1 */}
            <TouchableOpacity onPress={() => cyclePrompt(selectedPrompt1, setSelectedPrompt1)}>
                <View style={styles.promptCard}>
                    <View style={styles.promptHeader}>
                        <Text style={styles.promptQuestion}>{selectedPrompt1}</Text>
                        <Icon name="refresh" size={20} color="#666" />
                    </View>
                    <TextInput
                        style={styles.promptInput}
                        placeholder="Your answer..."
                        placeholderTextColor="#999"
                        multiline
                        value={answer1}
                        onChangeText={setAnswer1}
                        maxLength={150}
                    />
                </View>
            </TouchableOpacity>

            {/* Prompt 2 */}
            <TouchableOpacity onPress={() => cyclePrompt(selectedPrompt2, setSelectedPrompt2)}>
                <View style={styles.promptCard}>
                    <View style={styles.promptHeader}>
                        <Text style={styles.promptQuestion}>{selectedPrompt2}</Text>
                        <Icon name="refresh" size={20} color="#666" />
                    </View>
                    <TextInput
                        style={styles.promptInput}
                        placeholder="Your answer..."
                        placeholderTextColor="#999"
                        multiline
                        value={answer2}
                        onChangeText={setAnswer2}
                        maxLength={150}
                    />
                </View>
            </TouchableOpacity>

            {/* Prompt 3 */}
            <TouchableOpacity onPress={() => cyclePrompt(selectedPrompt3, setSelectedPrompt3)}>
                <View style={styles.promptCard}>
                    <View style={styles.promptHeader}>
                        <Text style={styles.promptQuestion}>{selectedPrompt3}</Text>
                        <Icon name="refresh" size={20} color="#666" />
                    </View>
                    <TextInput
                        style={styles.promptInput}
                        placeholder="Your answer..."
                        placeholderTextColor="#999"
                        multiline
                        value={answer3}
                        onChangeText={setAnswer3}
                        maxLength={150}
                    />
                </View>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
        </ScrollView>
    );

    const getBackgroundImage = (currentStep: number) => {
        switch (currentStep) {
            case 1:
                return require('../assets/images/onboarding_step1.jpg');
            case 2:
                return require('../assets/images/onboarding_step2.jpg');
            case 3:
                return require('../assets/images/onboarding_step3.jpg'); // Fairground
            case 4:
                return require('../assets/images/onboarding_step4.jpg'); // Pizza
            default:
                return require('../assets/images/onboarding_step1.jpg');
        }
    };

    return (
        <ImageBackground
            key={step} // Force re-render for new image
            source={getBackgroundImage(step)}
            style={styles.backgroundImage}
            resizeMode="cover"
            blurRadius={5}
        >
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    {step > 1 ? (
                        <TouchableOpacity onPress={handleBack}>
                            <Icon name="arrow-left" size={28} color="#000" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 28 }} />
                    )}
                    {renderProgressBar()}
                    <TouchableOpacity onPress={handleSkip}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Step Content */}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}

                {/* Bottom Button */}
                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            !canProceed() && styles.continueButtonDisabled,
                        ]}
                        onPress={handleNext}
                        disabled={!canProceed()}
                    >
                        <Text style={styles.continueButtonText}>
                            {step === totalSteps ? 'Complete Profile' : 'Continue'}
                        </Text>
                        <Icon name="arrow-right" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
};



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Increased transparency
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Add padding for status bar
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    skipText: {
        fontSize: 16,
        color: '#999',
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    progressDot: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E0E0E0',
    },
    progressDotActive: {
        backgroundColor: '#000000',
    },
    stepContent: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 20,
    },
    stepTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        lineHeight: 22,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    photoBox: {
        width: (width - 70) / 3,
        aspectRatio: 0.8,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    photoBoxMain: {
        width: (width - 60) / 2,
        aspectRatio: 0.75,
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    mainPhotoLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 5,
    },
    removePhotoButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoCount: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 15,
    },
    bioInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 20,
        fontSize: 16,
        color: '#333',
        height: 150,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 13,
        color: '#999',
        textAlign: 'right',
        marginTop: 10,
    },
    tipBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        marginLeft: 12,
        lineHeight: 20,
    },
    inputGroup: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        overflow: 'hidden',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    detailInput: {
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#333',
    },
    promptCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
    },
    promptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    promptQuestion: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1, // Allow text to wrap if needed
        marginRight: 10,
    },
    promptInput: {
        fontSize: 18,
        color: '#333',
        minHeight: 60,
    },
    bottomContainer: {
        padding: 20,
        paddingBottom: 30,
    },
    continueButton: {
        backgroundColor: '#000000',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 30,
        gap: 10,
    },
    continueButtonDisabled: {
        backgroundColor: '#666666',
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
});

export default OnboardingScreen;
