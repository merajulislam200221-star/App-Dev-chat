import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { InputProps } from '@/utilis/types';

const Input = (props: InputProps) => {
  // ১. Array destructuring [] ব্যবহার করা হয়েছে
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        props.containerStyle,
        isFocused && styles.primaryBorder,
      ]}
    >
      {props.icon && props.icon}

      <TextInput
        style={[styles.input, props.inputStyle]}
        placeholderTextColor={colors.neutral400}
        ref={props.inputRef}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus && props.onFocus(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur && props.onBlur(e);
        }}
        {...props}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: spacingY ? spacingY._50 : 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral300 || '#E5E5E5',
    borderRadius: radius ? radius._17 : 15,
    borderCurve: 'continuous',
    paddingHorizontal: spacingX ? spacingX._15 : 15,
    gap: spacingX ? spacingX._10 : 10,
  },
  primaryBorder: {
    borderColor: colors.primary || '#000',
  },
  input: {
    flex: 1,
    color: colors.text || '#000',
    fontSize: 16,
  },
});