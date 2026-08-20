import { colors, radius } from "@/constants/theme";
import { AvatarProps } from "@/utilis/types";
import { verticalScale } from "@/utilis/styling";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { getAvatarPath } from "@/services/imageService";

const Avatar = ({
  url,
  size = 40,
  style,
  isGroup = false,
}: AvatarProps) => {
  return (
    <View
      style={[
        styles.avatar,
        {
          height: verticalScale(size),
          width: verticalScale(size),
        },
        style,
      ]}
    >
      <Image
        style={{ flex: 1 }}
        source={getAvatarPath(url, isGroup)}
        contentFit="cover"
        transition={100}
      />
    </View>
  );
};



export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral200,
    height: verticalScale(47),
    width: verticalScale(47),
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: "hidden",
  },
});