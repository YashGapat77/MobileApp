import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export const Skeleton = ({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
};

// Profile Card Skeleton
export const ProfileSkeleton = () => (
    <View style={styles.profileContainer}>
        <View style={styles.header}>
            <Skeleton width={28} height={28} borderRadius={14} />
            <Skeleton width={120} height={24} />
            <Skeleton width={28} height={28} borderRadius={14} />
        </View>
        <View style={styles.content}>
            <Skeleton width={200} height={30} style={{ marginBottom: 8 }} />
            <Skeleton width={150} height={16} style={{ marginBottom: 20 }} />
            <Skeleton width="100%" height={400} borderRadius={10} style={{ marginBottom: 20 }} />
            <Skeleton width="90%" height={100} borderRadius={10} style={{ marginBottom: 15 }} />
            <Skeleton width="80%" height={20} style={{ marginBottom: 10 }} />
            <Skeleton width="60%" height={20} />
        </View>
    </View>
);

// Match List Skeleton
export const MatchListSkeleton = () => (
    <View>
        {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={styles.matchItem}>
                <Skeleton width={60} height={60} borderRadius={30} />
                <View style={styles.matchInfo}>
                    <Skeleton width={120} height={18} style={{ marginBottom: 8 }} />
                    <Skeleton width={180} height={14} />
                </View>
            </View>
        ))}
    </View>
);

// Chat Message Skeleton
export const ChatSkeleton = () => (
    <View style={styles.chatContainer}>
        {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.messageSkeleton, i % 2 === 0 && styles.messageRight]}>
                {i % 2 !== 0 && <Skeleton width={30} height={30} borderRadius={15} />}
                <Skeleton
                    width={Math.random() * 100 + 100}
                    height={40}
                    borderRadius={20}
                    style={{ marginHorizontal: 8 }}
                />
            </View>
        ))}
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: '#E0E0E0',
    },
    profileContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    content: {
        padding: 20,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    matchInfo: {
        marginLeft: 15,
        flex: 1,
    },
    chatContainer: {
        padding: 15,
    },
    messageSkeleton: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 15,
    },
    messageRight: {
        justifyContent: 'flex-end',
    },
});

export default Skeleton;
