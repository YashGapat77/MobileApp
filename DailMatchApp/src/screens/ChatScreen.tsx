import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar,
    Alert,
    Modal,
    ScrollView,
    PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import io from 'socket.io-client';
import { matchAPI, userAPI, BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = BASE_URL;

interface Message {
    id: string;
    text: string;
    senderId: string;
    timestamp: Date;
    status: 'sending' | 'sent' | 'delivered' | 'read';
}

const ChatScreen = ({ route, navigation }: any) => {
    const { match } = route.params || { match: { id: '1', name: 'Sarah', photo: '' } };
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, _setIsOnline] = useState(true);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('1'); // Default fallback
    const flatListRef = useRef<FlatList>(null);
    const socketRef = useRef<any>(null);
    const typingTimeoutRef = useRef<any>(null);

    // AI Features
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [matchProfile, setMatchProfile] = useState<any>(null);

    const ICEBREAKERS = [
        "What's the best travel spot you've been to? 🌍",
        "Coffee or Tea? ☕🍵",
        "What's your favorite comfort movie? 🎬",
        "If you could have dinner with anyone, who? 🍽️",
        "Do you believe in aliens? 👽",
        "What's your go-to karaoke song? 🎤",
        "Pineapple on pizza? 🍕",
        "What is the most spontaneous thing you've ever done? 🤪",
        "Dogs or Cats? 🐶🐱",
        "What's your dream job? 💼",
        "If you could teleport anywhere right now, where? 🚀",
        "What is your biggest pet peeve? 😤",
        "Are you a morning person or a night owl? 🦉",
        "What's the last book you read? 📚",
        "Do you have any hidden talents? ✨",
        "What's your idea of a perfect Sunday? ☀️",
        "Beach vacation or Mountain cabin? 🏔️",
        "What's your favorite cuisine? 🍝",
        "If you won the lottery, what's the first thing you'd buy? 💰",
        "Do you believe in ghosts? 👻"
    ];

    const SUGGESTION_POOLS = {
        greeting: ['Hey! How are you?', 'Hi there! 👋', 'Hello! How is your day?', 'Hey! Long time no see.', 'Hi! What are you up to?'],
        question: ['Yes, definitely!', 'Not really...', 'It depends.', 'What do you think?', 'Ideally, yes.', 'I am not sure yet.', 'Tell me your opinion!'],
        planning: ['Sure, when?', 'I am free this weekend.', 'Maybe next week?', 'Sounds full!', 'Let me check my schedule.', 'I would love to!'],
        reaction: ['That is so cool!', 'Haha, no way!', 'Wow, really?', 'That is interesting.', 'Tell me more!', 'I had no idea.', 'LOL 😂'],
        flirty: ['You are cute.', 'Stop it 😳', 'I bet you are.', 'We should meet up.', 'Make me! 😉'],
        general: ['Tell me more.', 'How about you?', 'That sounds fun.', 'Interesting...', 'Nice!', 'Why is that?', 'Go on...']
    };

    const getRandomSubset = (arr: string[], n: number) => {
        return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
    };

    const generateSuggestions = (lastMsgText: string) => {
        const t = lastMsgText.toLowerCase();
        let pool = SUGGESTION_POOLS.general;

        if (t.includes('?') || t.includes('what') || t.includes('how')) pool = [...SUGGESTION_POOLS.question, ...SUGGESTION_POOLS.general];
        else if (t.includes('hi') || t.includes('hello') || t.includes('hey') || t.includes('yo')) pool = SUGGESTION_POOLS.greeting;
        else if (t.includes('meet') || t.includes('date') || t.includes('free') || t.includes('time')) pool = SUGGESTION_POOLS.planning;
        else if (t.includes('wow') || t.includes('cool') || t.includes('haha') || t.includes('lol')) pool = SUGGESTION_POOLS.reaction;
        else if (t.includes('cute') || t.includes('hot') || t.includes('love')) pool = [...SUGGESTION_POOLS.flirty, ...SUGGESTION_POOLS.reaction];

        // Personalization
        if (matchProfile) {
            const bio = (matchProfile.bio || '').toLowerCase();
            let personalized: string[] = [];

            if (bio.includes('coffee')) personalized.push('How do you take your coffee? ☕');
            if (bio.includes('hike') || bio.includes('hiking')) personalized.push('Been on any good hikes recently? 🥾');
            if (bio.includes('travel') || bio.includes('trip')) personalized.push('Where is your dream destination? ✈️');
            if (bio.includes('food') || bio.includes('cook')) personalized.push('What is your favorite dish? 🍝');
            if (bio.includes('dog') || bio.includes('pet')) personalized.push('Tell me about your pets! 🐾');

            if (matchProfile.name) {
                personalized.push(`Hey ${matchProfile.name.split(' ')[0]}! 👋`);
            }

            if (personalized.length > 0) pool = [...personalized, ...pool];
        }

        // Return 3-4 random options
        return getRandomSubset(pool, 4);
    };

    // Fetch Profile
    useEffect(() => {
        if (match?.userId) {
            userAPI.getPublicProfile(match.userId).then(data => {
                if (data && data.profile) setMatchProfile(data.profile);
            });
        }
    }, [match]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.senderId !== currentUserId) {
                setSuggestions(generateSuggestions(lastMsg.text));
            } else {
                setSuggestions([]);
            }
        } else {
            setSuggestions([]);
        }
    }, [messages, currentUserId]);

    const handleSuggestion = (text: string) => {
        setInputText(text);
        setSuggestions([]);
    };

    const sendIcebreaker = () => {
        const ib = ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)];
        setInputText(ib);
    };

    const handleManualAI = () => {
        if (messages.length === 0) {
            setSuggestions(getRandomSubset(ICEBREAKERS, 5));
        } else {
            const lastMsg = messages[messages.length - 1];
            setSuggestions(generateSuggestions(lastMsg.text));
        }
    };

    useEffect(() => {
        // Fetch real user ID
        const getUserId = async () => {
            const id = await AsyncStorage.getItem('userId');
            if (id) setCurrentUserId(id);
        };
        getUserId();
    }, []);

    useEffect(() => {
        // Connect to socket
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
        });

        socketRef.current.on('connect', () => {
            console.log('Connected to chat server');
            socketRef.current.emit('join', { room: match.id });
        });

        // Listen for chat history
        socketRef.current.on('chat_history', (history: any[]) => {
            console.log('Received history:', history.length);
            const formattedMessages: Message[] = history.map(msg => ({
                id: msg._id,
                text: msg.text,
                senderId: msg.senderId,
                timestamp: new Date(msg.timestamp),
                status: msg.status as any,
            }));
            setMessages(formattedMessages);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        });

        socketRef.current.on('receive_message', (data: any) => {
            if (data.senderId === currentUserId) return;

            const newMessage: Message = {
                id: data._id || Date.now().toString(),
                text: data.text,
                senderId: data.senderId,
                timestamp: new Date(data.timestamp || Date.now()),
                status: 'read',
            };

            setMessages(prev => {
                // Deduplicate check
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });

            // Send read receipt
            socketRef.current.emit('message_read', {
                room: match.id,
                messageId: newMessage.id
            });
        });

        // Typing indicator
        socketRef.current.on('typing', (data: any) => {
            if (data.userId !== currentUserId) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
            }
        });

        socketRef.current.on('stop_typing', () => {
            setIsTyping(false);
        });

        // Read receipts
        socketRef.current.on('message_read', (data: any) => {
            setMessages(prev => prev.map(msg =>
                msg.id === data.messageId ? { ...msg, status: 'read' } : msg
            ));
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave', { room: match.id });
                socketRef.current.disconnect();
            }
        };
    }, [match.id, currentUserId]);

    const handleSend = (textOverride?: string) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : inputText.trim();
        if (!textToSend) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: textToSend,
            senderId: currentUserId,
            timestamp: new Date(),
            status: 'sending',
        };

        setMessages(prev => [...prev, newMessage]);
        if (typeof textOverride !== 'string') setInputText('');

        // Auto-scroll to bottom
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        // Emit to socket
        socketRef.current?.emit('send_message', {
            room: match.id,
            text: newMessage.text,
            senderId: currentUserId,
            timestamp: newMessage.timestamp,
        });

        // Update the match list for other screens
        matchAPI.updateMatchLastMessage(match.id, newMessage.text);

        // Simulate sent status
        setTimeout(() => {
            setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
            ));
        }, 500);

        // Simulate delivered status
        setTimeout(() => {
            setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
            ));
        }, 1000);

        // Stop typing
        socketRef.current?.emit('stop_typing', { room: match.id });
    };

    const handleInputChange = (text: string) => {
        setInputText(text);
        socketRef.current?.emit('typing', { room: match.id, userId: currentUserId });
    };

    const renderMessageStatus = (status: string) => {
        switch (status) {
            case 'sending':
                return <Text style={styles.statusText}>Sending...</Text>;
            case 'sent':
                return <Text style={styles.statusText}>Sent</Text>;
            case 'delivered':
                return <Text style={styles.statusText}>Delivered</Text>;
            case 'read':
                return <Text style={styles.statusTextRead}>Seen</Text>;
            default:
                return null;
        }
    };

    const getDateHeader = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const shouldShowDateHeader = (currentMessage: Message, previousMessage?: Message) => {
        if (!previousMessage) return true;
        const currentDate = new Date(currentMessage.timestamp).toDateString();
        const previousDate = new Date(previousMessage.timestamp).toDateString();
        return currentDate !== previousDate;
    };

    const handleLongPress = (item: Message) => {
        Alert.alert('Message Options', '', [
            {
                text: 'Copy',
                onPress: () => {
                    // Would use Clipboard.setString(item.text) with @react-native-clipboard/clipboard
                    Alert.alert('Copied', 'Message copied to clipboard');
                }
            },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    setMessages(prev => prev.filter(m => m.id !== item.id));
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const renderMessage = ({ item, index }: { item: Message; index: number }) => {
        const isMe = item.senderId === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const showDateHeader = shouldShowDateHeader(item, previousMessage);

        const isImage = item.text.startsWith('[IMAGE]:');
        const imageUrl = isImage ? `${SOCKET_URL}/api/user/uploads/${item.text.replace('[IMAGE]:', '')}` : null;

        return (
            <View>
                {showDateHeader && (
                    <View style={styles.dateHeader}>
                        <Text style={styles.dateHeaderText}>{getDateHeader(item.timestamp)}</Text>
                    </View>
                )}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onLongPress={() => handleLongPress(item)}
                    delayLongPress={500}
                >
                    <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
                        {!isMe && (
                            <Image
                                source={{ uri: match.photo || 'https://randomuser.me/api/portraits/women/1.jpg' }}
                                style={styles.messageAvatar}
                            />
                        )}
                        <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage, isImage && { padding: 5, backgroundColor: isMe ? '#FF4B6E' : '#FFF' }]}>
                            {isImage ? (
                                <Image
                                    source={{ uri: imageUrl! }}
                                    style={{ width: 200, height: 250, borderRadius: 10, backgroundColor: '#EEE' }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                                    {item.text}
                                </Text>
                            )}
                            <View style={styles.messageFooter}>
                                <Text style={[styles.messageTime, isMe && styles.myMessageTime, isImage && { color: isMe ? '#FFF' : '#AAA', marginTop: 5 }]}>
                                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                {isMe && renderMessageStatus(item.status)}
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const handleViewProfile = () => {
        // Navigate to dedicated match profile viewer with full details
        const fullProfile = {
            ...match,
            ...(matchProfile || {})
        };
        navigation.navigate('MatchProfile', { match: fullProfile });
    };

    const handleOptions = () => {
        setShowOptionsMenu(true);
    };

    const handleCamera = async () => {
        setShowAttachmentMenu(false);

        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Camera Permission",
                        message: "SoulFix needs access to your camera to take photos.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert("Permission Denied", "Camera access is required.");
                    return;
                }
            } catch (err) {
                console.warn(err);
                return;
            }
        }

        const result = await launchCamera({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets[0]) {
            const photo = result.assets[0];
            try {
                const uploadRes = await userAPI.uploadImage(photo);
                if (uploadRes.success) {
                    handleSend(`[IMAGE]:${uploadRes.filename}`);
                } else {
                    Alert.alert('Upload Failed');
                }
            } catch (e) {
                Alert.alert('Error', 'Failed to upload photo.');
            }
        }
    };

    const handleGallery = async () => {
        setShowAttachmentMenu(false);
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 1,
        });

        if (result.assets && result.assets[0]) {
            const photo = result.assets[0];
            try {
                const uploadRes = await userAPI.uploadImage(photo);
                if (uploadRes.success) {
                    handleSend(`[IMAGE]:${uploadRes.filename}`);
                } else {
                    Alert.alert('Upload Failed');
                }
            } catch (e) {
                Alert.alert('Error', 'Failed to upload photo.');
            }
        }
    };



    const handleAttachment = () => {
        setShowAttachmentMenu(true);
    };

    const handleUnmatch = async () => {
        Alert.alert(
            'Unmatch',
            'Are you sure you want to unmatch? You will lose this conversation.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unmatch',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await matchAPI.unmatch(match.id);
                        if (success) {
                            navigation.goBack();
                        } else {
                            Alert.alert('Error', 'Failed to unmatch');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={28} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerProfile} onPress={handleViewProfile}>
                    <Image
                        source={{ uri: match.photo }}
                        style={styles.headerAvatar}
                    />
                    <View>
                        <Text style={styles.headerName}>{match.name}</Text>
                        <View style={styles.onlineStatus}>
                            <View style={[styles.onlineDot, isOnline && styles.onlineDotActive]} />
                            <Text style={styles.onlineText}>
                                {isTyping ? 'Typing...' : isOnline ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOptionsMenu(true)}>
                    <Icon name="dots-vertical" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Start the conversation!</Text>
                            <TouchableOpacity style={styles.icebreakerButton} onPress={sendIcebreaker}>
                                <Icon name="snowflake" size={20} color="#FFF" />
                                <Text style={styles.icebreakerText}> Break the Ice </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />

                {/* Typing indicator */}
                {isTyping && (
                    <View style={styles.typingIndicator}>
                        <Image
                            source={{ uri: match.photo || 'https://randomuser.me/api/portraits/women/1.jpg' }}
                            style={styles.typingAvatar}
                        />
                        <View style={styles.typingBubble}>
                            <View style={styles.typingDots}>
                                <View style={[styles.typingDot, styles.dot1]} />
                                <View style={[styles.typingDot, styles.dot2]} />
                                <View style={[styles.typingDot, styles.dot3]} />
                            </View>
                        </View>
                    </View>
                )}

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                    <View style={styles.suggestionWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionContainer}>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => handleSuggestion(s)}>
                                    <Text style={styles.suggestionText}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={styles.attachButton}
                        onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    >
                        <Icon name="plus" size={24} color="#FF4B6E" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.aiButton}
                        onPress={handleManualAI}
                    >
                        <Icon name="creation" size={22} color="#7B61FF" />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#999"
                        value={inputText}
                        onChangeText={(text) => {
                            setInputText(text);
                            socketRef.current?.emit('typing', { room: match.id, userId: currentUserId });
                        }}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={() => handleSend()}
                        disabled={!inputText.trim()}
                    >
                        <Icon name="send" size={22} color={inputText.trim() ? '#FFF' : '#CCC'} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Attachment Menu Modal */}
            <Modal
                visible={showAttachmentMenu}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAttachmentMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAttachmentMenu(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Send Attachment</Text>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={handleCamera}
                        >
                            <Icon name="camera" size={24} color="#000" />
                            <Text style={styles.modalOptionText}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={handleGallery}
                        >
                            <Icon name="image" size={24} color="#000" />
                            <Text style={styles.modalOptionText}>Photo Gallery</Text>
                        </TouchableOpacity>



                        <TouchableOpacity
                            style={[styles.modalOption, styles.modalCancel]}
                            onPress={() => setShowAttachmentMenu(false)}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Options Menu Modal */}
            <Modal
                visible={showOptionsMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOptionsMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOptionsMenu(false)}
                >
                    <View style={styles.optionsMenu}>
                        <TouchableOpacity
                            style={styles.optionsItem}
                            onPress={() => {
                                setShowOptionsMenu(false);
                                handleUnmatch();
                            }}
                        >
                            <Icon name="account-remove-outline" size={20} color="#FF3B30" />
                            <Text style={[styles.optionsText, { color: '#FF3B30' }]}>Unmatch</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 25) + 5 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#333',
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#CCC',
        marginRight: 5,
    },
    onlineDotActive: {
        backgroundColor: '#4CAF50',
    },
    onlineText: {
        fontSize: 13,
        color: '#666',
    },
    messagesList: {
        padding: 15,
        paddingBottom: 10,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dateHeaderText: {
        fontSize: 12,
        color: '#999',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        fontWeight: '500',
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myMessage: {
        backgroundColor: '#000000',
        borderBottomRightRadius: 5,
    },
    theirMessage: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 5,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    myMessageText: {
        color: '#FFFFFF',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
        gap: 4,
    },
    messageTime: {
        fontSize: 11,
        color: '#999',
    },
    myMessageTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    statusText: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
        marginLeft: 4,
    },
    statusTextRead: {
        fontSize: 10,
        color: '#000',
        fontWeight: '600',
        marginLeft: 4,
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    typingAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    typingBubble: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 20,
        borderBottomLeftRadius: 5,
    },
    typingDots: {
        flexDirection: 'row',
        gap: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#999',
    },
    dot1: {
        opacity: 0.4,
    },
    dot2: {
        opacity: 0.6,
    },
    dot3: {
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    aiButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0EBFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    sendButtonActive: {},
    sendButtonDisabled: {
        opacity: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginVertical: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        marginBottom: 10,
    },
    modalOptionText: {
        fontSize: 16,
        color: '#000',
        marginLeft: 16,
        fontWeight: '500',
    },
    modalCancel: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginTop: 10,
        justifyContent: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
    },
    // Options Menu Styles
    optionsMenu: {
        position: 'absolute',
        top: 60,
        right: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 180,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    optionsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    optionsText: {
        fontSize: 15,
        color: '#000',
        marginLeft: 12,
        fontWeight: '500',
    },
    optionsDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },
    // AI Styles
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
    icebreakerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7B61FF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        elevation: 3,
        shadowColor: '#7B61FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        marginTop: 20,
    },
    icebreakerText: {
        color: '#FFF',
        fontWeight: '600',
        marginLeft: 8,
    },
    suggestionWrapper: {
        paddingVertical: 10,
        backgroundColor: '#F9F9F9',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    suggestionContainer: {
        paddingHorizontal: 15,
        gap: 10,
    },
    suggestionChip: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: 10,
    },
    suggestionText: {
        color: '#333',
        fontSize: 14,
    },
});

export default ChatScreen;
