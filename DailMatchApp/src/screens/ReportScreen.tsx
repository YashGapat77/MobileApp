import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Alert,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ReportScreenProps {
    route: any;
    navigation: any;
}

const REPORT_REASONS = [
    { id: 'fake', label: 'Fake profile', icon: 'account-alert' },
    { id: 'inappropriate', label: 'Inappropriate photos', icon: 'image-off' },
    { id: 'harassment', label: 'Harassment or bullying', icon: 'message-alert' },
    { id: 'spam', label: 'Spam or scam', icon: 'alert-circle' },
    { id: 'underage', label: 'Underage user', icon: 'account-child' },
    { id: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const ReportScreen = ({ route, navigation }: ReportScreenProps) => {
    const { user } = route.params || { user: { id: '1', name: 'User' } };
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [isBlocking, setIsBlocking] = useState(false);

    const handleReport = () => {
        if (!selectedReason) {
            Alert.alert('Select a reason', 'Please select a reason for reporting.');
            return;
        }

        Alert.alert(
            'Report Submitted',
            `Thank you for reporting. We'll review this profile within 24 hours.${isBlocking ? ' This user has also been blocked.' : ''}`,
            [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };

    const handleBlock = () => {
        Alert.alert(
            `Block ${user.name}?`,
            "They won't be able to see your profile or message you. They won't be notified.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Block',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert('Blocked', `${user.name} has been blocked.`, [
                            { text: 'OK', onPress: () => navigation.goBack() },
                        ]);
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Block Option */}
                <TouchableOpacity style={styles.blockSection} onPress={handleBlock}>
                    <View style={styles.blockIcon}>
                        <Icon name="cancel" size={28} color="#FF3B30" />
                    </View>
                    <View style={styles.blockInfo}>
                        <Text style={styles.blockTitle}>Block {user.name}</Text>
                        <Text style={styles.blockSubtext}>
                            They won't be able to see your profile or contact you
                        </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#CCC" />
                </TouchableOpacity>

                {/* Report Section */}
                <Text style={styles.sectionTitle}>Why are you reporting this profile?</Text>
                <View style={styles.reasonsContainer}>
                    {REPORT_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason.id}
                            style={[
                                styles.reasonItem,
                                selectedReason === reason.id && styles.reasonItemSelected,
                            ]}
                            onPress={() => setSelectedReason(reason.id)}
                        >
                            <Icon
                                name={reason.icon}
                                size={24}
                                color={selectedReason === reason.id ? '#FF4B6E' : '#666'}
                            />
                            <Text
                                style={[
                                    styles.reasonText,
                                    selectedReason === reason.id && styles.reasonTextSelected,
                                ]}
                            >
                                {reason.label}
                            </Text>
                            {selectedReason === reason.id && (
                                <Icon name="check-circle" size={24} color="#FF4B6E" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Additional Info */}
                <Text style={styles.sectionTitle}>Additional information (optional)</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Provide more details about your report..."
                    placeholderTextColor="#999"
                    multiline
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    maxLength={500}
                />
                <Text style={styles.charCount}>{additionalInfo.length}/500</Text>

                {/* Block with report */}
                <TouchableOpacity
                    style={styles.blockWithReport}
                    onPress={() => setIsBlocking(!isBlocking)}
                >
                    <Icon
                        name={isBlocking ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={isBlocking ? '#FF4B6E' : '#999'}
                    />
                    <Text style={styles.blockWithReportText}>Also block this user</Text>
                </TouchableOpacity>

                {/* Guidelines */}
                <View style={styles.guidelines}>
                    <Icon name="shield-check" size={20} color="#4CAF50" />
                    <Text style={styles.guidelinesText}>
                        Your report is anonymous. We take all reports seriously and review them within 24 hours.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
                    onPress={handleReport}
                    disabled={!selectedReason}
                >
                    <Text style={styles.submitButtonText}>Submit Report</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
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
    blockSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginTop: 15,
    },
    blockIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockInfo: {
        flex: 1,
        marginLeft: 15,
    },
    blockTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    blockSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 3,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginTop: 25,
        marginBottom: 15,
        marginLeft: 20,
    },
    reasonsContainer: {
        backgroundColor: '#FFFFFF',
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    reasonItemSelected: {
        backgroundColor: '#FFF5F7',
    },
    reasonText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 15,
    },
    reasonTextSelected: {
        fontWeight: '600',
        color: '#FF4B6E',
    },
    textArea: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 12,
        fontSize: 16,
        color: '#333',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 13,
        color: '#999',
        textAlign: 'right',
        marginRight: 20,
        marginTop: 5,
    },
    blockWithReport: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
    },
    blockWithReportText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    guidelines: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E8F5E9',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 15,
        borderRadius: 12,
    },
    guidelinesText: {
        flex: 1,
        fontSize: 14,
        color: '#2E7D32',
        marginLeft: 10,
        lineHeight: 20,
    },
    bottomContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    submitButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#FFCDD2',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ReportScreen;
