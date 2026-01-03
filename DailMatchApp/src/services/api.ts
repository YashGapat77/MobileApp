import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your Flask backend URL
// For local development on Android emulator, use 10.0.2.2 instead of localhost
export const BASE_URL = 'https://soul-fix-gcrn.onrender.com';
const API_BASE_URL = `${BASE_URL}/api`;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    async (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        const token = await AsyncStorage.getItem('authToken');
        const userId = await AsyncStorage.getItem('userId');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (userId) {
            config.headers['User-Id'] = userId;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    login: async (email: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.token) {
                await AsyncStorage.setItem('authToken', response.data.token);
                await AsyncStorage.setItem('userId', response.data.user.id.toString());
            }
            return response.data;
        } catch (error) {
            console.log('Backend login failed, checking for mock fallback...');
            // Fallback for testing/development if backend is unreachable
            if (email.toLowerCase() === 'test@test.com' && password === '123456') {
                const mockUser = {
                    id: '123',
                    email: 'test@test.com',
                    name: 'Test User',
                    age: 25,
                };
                const mockToken = 'mock-jwt-token-123';

                await AsyncStorage.setItem('authToken', mockToken);
                await AsyncStorage.setItem('userId', mockUser.id);

                return {
                    success: true,
                    token: mockToken,
                    user: mockUser
                };
            }
            // Re-throw if not the test user
            throw error;
        }
    },

    signup: async (userData: any) => {
        const payload = {
            email: userData.email,
            password: userData.password,
            username: userData.email.split('@')[0],
            firstName: userData.name.split(' ')[0],
            lastName: userData.name.split(' ')[1] || '',
            gender: userData.gender,
            dateOfBirth: new Date().toISOString().split('T')[0]
        };
        const response = await api.post('/auth/signup', payload);
        if (response.data.token) {
            await AsyncStorage.setItem('authToken', response.data.token);
            await AsyncStorage.setItem('userId', response.data.user.id.toString());
        }
        return response.data;
    },

    logout: async () => {
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        return { success: true };
    },
};

// User API calls
export const userAPI = {
    getProfile: async () => {
        try {
            const response = await api.get('/user/profile');
            return response.data;
        } catch {
            // Fallback for testing if backend is offline
            return {
                profile: {
                    name: 'John Doe',
                    age: 25,
                    bio: 'Love hiking and coffee ☕',
                    photos: ['https://randomuser.me/api/portraits/men/1.jpg'],
                    interests: ['Hiking', 'Coffee', 'Travel', 'Photography'],
                }
            };
        }
    },

    updateProfile: async (profileData: any) => {
        const response = await api.put('/user/profile', profileData);
        return response.data;
    },

    getPublicProfile: async (userId: string) => {
        try {
            const response = await api.get(`/user/profile/${userId}`);
            return response.data;
        } catch {
            return { profile: { name: 'Unknown', bio: 'AI Enthusiast' } };
        }
    },

    uploadImage: async (photo: any) => {
        const formData = new FormData();
        formData.append('photo', {
            uri: photo.uri,
            type: photo.type || 'image/jpeg',
            name: photo.fileName || photo.name || 'photo.jpg',
        });

        const response = await api.post('/user/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// In-memory mock data store
let mockMatches = [
    {
        id: '1',
        userId: '1',
        name: 'Sarah',
        gender: 'female',
        photo: 'https://randomuser.me/api/portraits/women/1.jpg',
        lastMessage: 'Hey! How are you?',
        timestamp: '2m ago',
        unread: true,
        age: 25,
        bio: 'Love hiking and coffee ☕',
        occupation: 'Product Designer',
        education: 'Stanford University',
        location: 'San Francisco, CA',
        prompts: [
            { question: 'My simple pleasures', answer: 'Sunday morning coffee and a good book' },
            { question: 'I\'m looking for', answer: 'Someone who can make me laugh' },
        ],
    },
    {
        id: '2',
        userId: '2',
        name: 'Emma',
        gender: 'female',
        photo: 'https://randomuser.me/api/portraits/women/3.jpg',
        lastMessage: 'Say hi!',
        timestamp: 'New',
        unread: true,
        age: 23,
        bio: 'Foodie | Traveler | Dog lover 🐕',
        occupation: 'Marketing Manager',
        education: 'UCLA',
        location: 'Los Angeles, CA',
        prompts: [
            { question: 'My ideal Sunday', answer: 'Brunch, beach, and good company' },
            { question: 'Green flags I look for', answer: 'Good communication and kindness' },
        ],
    },
];

let mockPotentialMatches = [
    {
        id: '101',
        name: 'Alex',
        gender: 'male',
        age: 28,
        bio: 'Adventure seeker 🏔️ | Photographer 📸',
        photos: [
            'https://randomuser.me/api/portraits/men/1.jpg',
            'https://randomuser.me/api/portraits/men/2.jpg',
        ],
        occupation: 'Software Engineer',
        education: 'MIT',
        height: '6\'0"',
        location: 'Seattle, WA',
        prompts: [
            { question: 'A fun fact about me', answer: 'I have climbed Mt. Rainier twice!' },
        ],
    },
    {
        id: '102',
        name: 'Jordan',
        gender: 'female',
        age: 24,
        bio: 'Artist & Music Lover 🎨',
        photos: [
            'https://randomuser.me/api/portraits/women/40.jpg',
            'https://randomuser.me/api/portraits/women/42.jpg',
        ],
        occupation: 'Graphic Designer',
        education: 'RISD',
        height: '5\'6"',
        location: 'Portland, OR',
        prompts: [
            { question: 'My happy place', answer: 'Anywhere with a sketchbook and good tunes.' },
        ],
    },
    {
        id: '103',
        name: 'Michael',
        gender: 'male',
        age: 30,
        bio: 'Chef in the making 🍳. Always looking for new recipes.',
        photos: [
            'https://randomuser.me/api/portraits/men/32.jpg',
            'https://randomuser.me/api/portraits/men/33.jpg',
        ],
        occupation: 'Sous Chef',
        education: 'Culinary Institute',
        height: '5\'10"',
        location: 'Chicago, IL',
        prompts: [
            { question: 'I’m convinced that', answer: 'Pineapple belongs on pizza.' },
        ],
    },
    {
        id: '104',
        name: 'Priya',
        gender: 'female',
        age: 26,
        bio: 'Yoga instructor and wellness enthusiast 🧘‍♀️',
        photos: [
            'https://randomuser.me/api/portraits/women/20.jpg',
            'https://randomuser.me/api/portraits/women/21.jpg',
        ],
        occupation: 'Yoga Teacher',
        education: 'NYU',
        height: '5\'4"',
        location: 'Austin, TX',
        prompts: [
            { question: 'I take pride in', answer: 'My massive plant collection 🌱' },
        ],
    },
    {
        id: '105',
        name: 'David',
        gender: 'male',
        age: 27,
        bio: 'Tech enthusiast and gamer 🎮',
        photos: [
            'https://randomuser.me/api/portraits/men/45.jpg',
            'https://randomuser.me/api/portraits/men/46.jpg',
        ],
        occupation: 'Data Analyst',
        education: 'Georgia Tech',
        height: '5\'9"',
        location: 'San Jose, CA',
        prompts: [
            { question: 'Two truths and a lie', answer: 'I speak 3 languages, I have a twin, I hate chocolate.' },
        ],
    },
    {
        id: '106',
        name: 'Lisa',
        gender: 'female',
        age: 29,
        bio: 'Writer and bookworm 📚. Let\'s discuss your favorite novel.',
        photos: [
            'https://randomuser.me/api/portraits/women/50.jpg',
            'https://randomuser.me/api/portraits/women/51.jpg',
        ],
        occupation: 'Editor',
        education: 'Columbia',
        height: '5\'7"',
        location: 'Brooklyn, NY',
        prompts: [
            { question: 'My simple pleasures', answer: 'Rainy days and chamomile tea.' },
        ],
    },
    {
        id: '107',
        name: 'James',
        gender: 'male',
        age: 32,
        bio: 'Entrepreneur. Building the future 🚀',
        photos: [
            'https://randomuser.me/api/portraits/men/60.jpg',
            'https://randomuser.me/api/portraits/men/61.jpg',
        ],
        occupation: 'Founder',
        education: 'Dropout',
        height: '6\'1"',
        location: 'San Francisco, CA',
        prompts: [
            { question: 'I bet you can\'t', answer: 'Beat me at chess.' },
        ],
    },
    {
        id: '108',
        name: 'Olivia',
        gender: 'female',
        age: 24,
        bio: 'Art enthusiast 🎨 | Gallery Hopper',
        photos: [
            'https://randomuser.me/api/portraits/women/5.jpg',
            'https://randomuser.me/api/portraits/women/6.jpg',
        ],
        occupation: 'Artist',
        education: 'Art Institute',
        height: '5\'6"',
        location: 'New York, NY',
        prompts: [
            { question: 'I\'m looking for', answer: 'A muse.' },
        ],
    },
];

// Persistence Helpers
let isInitialized = false;

const initData = async () => {
    if (isInitialized) return;
    try {
        const storedMatches = await AsyncStorage.getItem('mock_matches');
        const storedPotential = await AsyncStorage.getItem('mock_potential');

        if (storedMatches) {
            mockMatches = JSON.parse(storedMatches);
        }

        if (storedPotential) {
            mockPotentialMatches = JSON.parse(storedPotential);
        }

        isInitialized = true;
    } catch (e) {
        console.error("Failed to init mock data", e);
    }
};

const saveData = async () => {
    try {
        await AsyncStorage.setItem('mock_matches', JSON.stringify(mockMatches));
        await AsyncStorage.setItem('mock_potential', JSON.stringify(mockPotentialMatches));
    } catch (e) {
        console.error("Failed to save mock data", e);
    }
};

// Match API calls
export const matchAPI = {
    getPotentialMatches: async (filters?: { minAge?: number; maxAge?: number; gender?: string }) => {
        try {
            const params = new URLSearchParams();
            if (filters?.minAge) params.append('min_age', filters.minAge.toString());
            if (filters?.maxAge) params.append('max_age', filters.maxAge.toString());
            if (filters?.gender) params.append('gender', filters.gender);

            const response = await api.get(`/user/matches/potential?${params.toString()}`);
            return response.data;
        } catch {
            await initData();
            // Fallback mock data
            // Filter locally based on mock params if needed, for now return all
            const filtered = mockPotentialMatches.filter(p => {
                if (filters?.minAge && p.age < filters.minAge) return false;
                if (filters?.maxAge && p.age > filters.maxAge) return false;

                if (filters?.gender && filters.gender !== 'all') {
                    // Check gender match
                    if (p.gender !== filters.gender) return false;
                }

                return true;
            });

            return {
                matches: filtered
            };
        }
    },

    swipeRight: async (userId: string, comment?: string) => {
        try {
            const response = await api.post('/user/matches/swipe', {
                targetUserId: userId,
                action: 'like',
                comment,
            });
            return response.data;
        } catch (error) {
            await initData();
            // Simulate matching logic
            const potentialIndex = mockPotentialMatches.findIndex(p => p.id === userId);

            if (potentialIndex !== -1) {
                const profile = mockPotentialMatches[potentialIndex];

                // 70% chance of matching immediately or always match for demo
                const isMatch = true;

                if (isMatch) {
                    // Move to matches
                    const newMatch = {
                        ...profile,
                        userId: profile.id, // Ensure consistent ID field
                        lastMessage: comment || 'Say hi!',
                        timestamp: 'New',
                        unread: true,
                        // Add defaults if missing
                        photo: profile.photos ? profile.photos[0] : 'https://via.placeholder.com/150',
                    };

                    // Check if already matched to avoid duplicates
                    if (!mockMatches.find(m => m.id === profile.id)) {
                        mockMatches.unshift(newMatch);
                    }
                }

                // Remove from potential matches (so they don't show up again)
                mockPotentialMatches.splice(potentialIndex, 1);
                await saveData();

                return { match: isMatch, matchDetails: isMatch ? mockMatches[0] : null };
            }

            return { match: false };
        }
    },

    swipeLeft: async (userId: string) => {
        try {
            const response = await api.post('/user/matches/swipe', {
                targetUserId: userId,
                action: 'pass',
            });
            return response.data;
        } catch {
            await initData();
            // Remove from potential matches
            const potentialIndex = mockPotentialMatches.findIndex(p => p.id === userId);
            if (potentialIndex !== -1) {
                mockPotentialMatches.splice(potentialIndex, 1);
                await saveData();
            }
            return { success: true };
        }
    },

    getMatches: async () => {
        try {
            const response = await api.get('/user/matches');
            return response.data;
        } catch (error) {
            console.warn('Backend getMatches failed, using mock data', error);
            await initData();
            // Return existing in-memory matches
            return { matches: mockMatches };
        }
    },

    // New helper to simulate real-time updates
    updateMatchLastMessage: async (matchId: string, message: string) => {
        await initData();
        const matchIndex = mockMatches.findIndex(m => m.id === matchId || m.userId === matchId);
        if (matchIndex !== -1) {
            mockMatches[matchIndex] = {
                ...mockMatches[matchIndex],
                lastMessage: message,
                timestamp: 'Just now',
                unread: false,
            };
            // Move to top
            const updatedMatch = mockMatches.splice(matchIndex, 1)[0];
            mockMatches.unshift(updatedMatch);

            await saveData();
        }
        return { success: true };
    },

    unmatch: async (matchId: string) => {
        try {
            await api.delete(`/user/matches/${matchId}`);
            return true;
        } catch (error) {
            console.error('Unmatch error:', error);
            await initData();
            mockMatches = mockMatches.filter(m => m.id !== matchId);
            await saveData();
            return true;
        }
    },
};

export default api;
