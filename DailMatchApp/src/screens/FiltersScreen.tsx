import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Switch,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AsyncStorage from '@react-native-async-storage/async-storage';

const FiltersScreen = ({ navigation }: any) => {
    // Age Range
    const [minAge, setMinAge] = useState(18);
    const [maxAge, setMaxAge] = useState(35);

    // Distance
    const [maxDistance, setMaxDistance] = useState(25);
    const [showGlobal, setShowGlobal] = useState(false);

    // Gender Preferences
    const [showMen, setShowMen] = useState(true);
    const [showWomen, setShowWomen] = useState(true);
    const [showNonBinary, setShowNonBinary] = useState(true);

    // Other Filters
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [withPhotosOnly, setWithPhotosOnly] = useState(true);
    const [activeRecently, setActiveRecently] = useState(false);

    React.useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            const savedFilters = await AsyncStorage.getItem('filters');
            if (savedFilters) {
                const filters = JSON.parse(savedFilters);
                if (filters.minAge) setMinAge(filters.minAge);
                if (filters.maxAge) setMaxAge(filters.maxAge);
                if (filters.gender) {
                    setShowMen(filters.gender === 'male' || filters.gender === 'all');
                    setShowWomen(filters.gender === 'female' || filters.gender === 'all');
                }
            }
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    const handleApply = async () => {
        try {
            let gender = 'all';
            if (showMen && !showWomen) gender = 'male';
            if (!showMen && showWomen) gender = 'female';

            const filters = {
                minAge,
                maxAge,
                gender,
            };
            await AsyncStorage.setItem('filters', JSON.stringify(filters));
            navigation.goBack();
        } catch (error) {
            console.error('Error saving filters:', error);
            navigation.goBack();
        }
    };

    const handleReset = () => {
        setMinAge(18);
        setMaxAge(35);
        setMaxDistance(25);
        setShowGlobal(false);
        setShowMen(true);
        setShowWomen(true);
        setShowNonBinary(true);
        setVerifiedOnly(false);
        setWithPhotosOnly(true);
        setActiveRecently(false);
    };

    const AgeButton = ({ value, selected, onPress }: { value: number, selected: boolean, onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.ageButton, selected && styles.ageButtonSelected]}
            onPress={onPress}
        >
            <Text style={[styles.ageButtonText, selected && styles.ageButtonTextSelected]}>{value}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Filters</Text>
                <TouchableOpacity onPress={handleReset}>
                    <Text style={styles.resetText}>Reset</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Age Range */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Age Range</Text>
                    <View style={styles.rangeDisplay}>
                        <Text style={styles.rangeValue}>{minAge} - {maxAge} years</Text>
                    </View>

                    <Text style={styles.subLabel}>Minimum Age</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageScroll}>
                        {[18, 21, 25, 30, 35, 40, 45, 50].map(age => (
                            <AgeButton
                                key={`min-${age}`}
                                value={age}
                                selected={minAge === age}
                                onPress={() => age < maxAge && setMinAge(age)}
                            />
                        ))}
                    </ScrollView>

                    <Text style={styles.subLabel}>Maximum Age</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageScroll}>
                        {[25, 30, 35, 40, 45, 50, 55, 60].map(age => (
                            <AgeButton
                                key={`max-${age}`}
                                value={age}
                                selected={maxAge === age}
                                onPress={() => age > minAge && setMaxAge(age)}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Distance */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distance</Text>
                    <View style={styles.rangeDisplay}>
                        <Text style={styles.rangeValue}>
                            {showGlobal ? 'Global' : `${maxDistance} km`}
                        </Text>
                    </View>

                    {!showGlobal && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ageScroll}>
                            {[5, 10, 25, 50, 75, 100].map(dist => (
                                <TouchableOpacity
                                    key={dist}
                                    style={[styles.ageButton, maxDistance === dist && styles.ageButtonSelected]}
                                    onPress={() => setMaxDistance(dist)}
                                >
                                    <Text style={[styles.ageButtonText, maxDistance === dist && styles.ageButtonTextSelected]}>
                                        {dist} km
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.toggleRow}>
                        <View>
                            <Text style={styles.toggleLabel}>Show people globally</Text>
                            <Text style={styles.toggleSubtext}>See matches from anywhere</Text>
                        </View>
                        <Switch
                            value={showGlobal}
                            onValueChange={setShowGlobal}
                            trackColor={{ false: '#E0E0E0', true: '#FF4B6E' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Show Me */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Show Me</Text>
                    <View style={styles.genderOptions}>
                        <TouchableOpacity
                            style={[styles.genderOption, showWomen && styles.genderOptionActive]}
                            onPress={() => setShowWomen(!showWomen)}
                        >
                            <Icon name="gender-female" size={24} color={showWomen ? '#FF4B6E' : '#999'} />
                            <Text style={[styles.genderText, showWomen && styles.genderTextActive]}>Women</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.genderOption, showMen && styles.genderOptionActive]}
                            onPress={() => setShowMen(!showMen)}
                        >
                            <Icon name="gender-male" size={24} color={showMen ? '#4A90E2' : '#999'} />
                            <Text style={[styles.genderText, showMen && styles.genderTextActive]}>Men</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.genderOption, showNonBinary && styles.genderOptionActive]}
                            onPress={() => setShowNonBinary(!showNonBinary)}
                        >
                            <Icon name="gender-non-binary" size={24} color={showNonBinary ? '#9C27B0' : '#999'} />
                            <Text style={[styles.genderText, showNonBinary && styles.genderTextActive]}>All</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Advanced Filters */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Advanced Filters</Text>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Icon name="check-decagram" size={22} color="#4A90E2" />
                            <View style={styles.toggleTextContainer}>
                                <Text style={styles.toggleLabel}>Verified profiles only</Text>
                            </View>
                        </View>
                        <Switch
                            value={verifiedOnly}
                            onValueChange={setVerifiedOnly}
                            trackColor={{ false: '#E0E0E0', true: '#FF4B6E' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Icon name="image" size={22} color="#4CAF50" />
                            <View style={styles.toggleTextContainer}>
                                <Text style={styles.toggleLabel}>With photos only</Text>
                            </View>
                        </View>
                        <Switch
                            value={withPhotosOnly}
                            onValueChange={setWithPhotosOnly}
                            trackColor={{ false: '#E0E0E0', true: '#FF4B6E' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Icon name="clock-outline" size={22} color="#FF9800" />
                            <View style={styles.toggleTextContainer}>
                                <Text style={styles.toggleLabel}>Recently active</Text>
                            </View>
                        </View>
                        <Switch
                            value={activeRecently}
                            onValueChange={setActiveRecently}
                            trackColor={{ false: '#E0E0E0', true: '#FF4B6E' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    resetText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    subLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        marginTop: 10,
    },
    rangeDisplay: {
        alignItems: 'center',
        marginBottom: 10,
    },
    rangeValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    ageScroll: {
        marginBottom: 10,
    },
    ageButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    ageButtonSelected: {
        backgroundColor: '#F0F0F0',
        borderColor: '#000',
    },
    ageButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    ageButtonTextSelected: {
        color: '#000',
        fontWeight: 'bold',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    toggleTextContainer: {
        marginLeft: 12,
    },
    toggleLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    toggleSubtext: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    genderOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 15,
        marginHorizontal: 5,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    genderOptionActive: {
        backgroundColor: '#FFF',
        borderColor: '#000',
    },
    genderText: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    genderTextActive: {
        color: '#333',
        fontWeight: '600',
    },
    bottomContainer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    applyButton: {
        backgroundColor: '#000',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default FiltersScreen;
