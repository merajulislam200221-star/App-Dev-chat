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
    disabled?: boolean;
}

const Button = ({ style, onPress, children, loading = false, disabled = false }: CustomButtonProps) => {
    
    if (loading) {
        return (
            <View style={[styles.button, style, { backgroundColor: 'transparent' }]}>
                <Loading />
            </View>
        );
    }

    return (
        <TouchableOpacity 
            onPress={disabled ? undefined : onPress} 
            activeOpacity={disabled ? 1 : 0.8}
            disabled={disabled}
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
        width: '100%',
    }
});