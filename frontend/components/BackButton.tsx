import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native'; 
import { colors } from '@/constants/theme';
import { BackButtonProps } from '@/utilis/types';

const BackButton = ({
  style,
  iconSize = 26,
  color = colors.white, // থিম থেকে সাদা রং আসবে
}: BackButtonProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.back()} style={[styles.button, style]}>
      {/* verticalScale বাদ দিয়ে সরাসরি সাইজ দেওয়া হলো যাতে হাইড না হয়ে যায় */}
      <CaretLeft size={iconSize} color={color} weight="bold" />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start', // বাটনটি নিজের জায়গাটুকু নিবে শুধু
    padding: 5, 
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.07)', // (ঐচ্ছিক) একটু হালকা ব্যাকগ্রাউন্ড দিলে দেখতে ভালো লাগে
  },
});