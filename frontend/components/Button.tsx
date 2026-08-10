import { colors, radius } from '@/constants/theme';
import { verticalScale } from '@/utilis/styling';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Loading from './Loading';

interface CustomButtonProps {
    style?: any;
    onPress?: () => void;
    children?: React.ReactNode;
    loading?: boolean;
}

const Button = ({ style, onPress, children, loading = false }: CustomButtonProps) => {
    
    if (loading) {
        return (
            <View style={[styles.button, style, { backgroundColor: 'transparent' }]}>
                <Loading />
            </View>
        );
    }

    return (
        <TouchableOpacity 
            onPress={onPress} 
            activeOpacity={0.8}
            style={[styles.button, style]}
        >
            {children}
        </TouchableOpacity>
    );
};

export default Button;

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        borderCurve: "continuous",
        height: verticalScale(56),
        justifyContent: "center",
        alignItems: "center",
        width: '100%', // কন্টেইনারের পুরো চওড়া জায়গা নেওয়ার জন্য
    }
});