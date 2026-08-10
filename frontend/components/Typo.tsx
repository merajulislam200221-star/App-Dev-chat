import { StyleSheet, Text, TextStyle, View } from 'react-native';
import React from 'react';
import { colors } from '@/constants/theme';
import { verticalScale } from '@/utilis/styling';
import { TypoProps } from '@/utilis/types';

const Typo = ({
    size = 16,
    color = colors.text,
    fontWeight = '400',
    children,
    style,
    textProps = {}
}: TypoProps) => {

    const textStyle: TextStyle = {
        fontSize: verticalScale(size),
        color,
        fontWeight
    }

    return (
        <Text style={[textStyle, style]} {...textProps}>
            {children}
        </Text>
    );
}

export default Typo;
