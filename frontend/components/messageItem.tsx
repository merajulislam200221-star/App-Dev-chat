 
 import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { useAuth } from '@/contexts/authContext';
import { verticalScale } from '@/utilis/styling';
import { MessageProps } from '@/utilis/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import Typo from './Typo';
import moment from 'moment';
import { Image } from "expo-image";
const MessageItem = ({
  item,
  isDirect,
}: {
  item: MessageProps;
  isDirect?: boolean;
}) => {
  const { user: currentUser } = useAuth();
  const isMe = currentUser?.id == item?.sender?.id;

  const formattedDate= moment(item.createdAt).isSame(moment(), "day")
  moment(item.createdAt).format("h:mm A");
  moment(item.createdAt).format("MMM D,:ch:mm A");
  // console.log("message item:", item); 
  
  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      {!isMe && !isDirect && (
        <Avatar size={30}
          url={item?.sender?.avatar || null}
          style={styles.messageAvatar}
        />
      )}

      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.theirBubble,
        ]}
      >
        {!isMe && !isDirect && (
          <Typo color={colors.neutral900} fontWeight={"600"} size={13}>
            {item?.sender?.name}
          </Typo>
        )}
        {item.attachment && (
  <Image
    source={typeof item.attachment === "string" ? { uri: item.attachment } : item.attachment}
    contentFit="cover"
    style={styles.attachment}
    transition={100}
  />
)}

        <Typo color={isMe ? colors.white : colors.neutral900} size={14}>
          {formattedDate}
        </Typo>
      </View>
    </View>
  );
};
export default MessageItem;
const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    gap: spacingX._7,
    maxWidth: "80%",
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    alignSelf: "flex-end",
  },
  attachment: {
    height: verticalScale(180),
    width: verticalScale(180),
    borderRadius: radius._10,
  },
  messageBubble: {
    padding: spacingX._10,
    borderRadius: radius._15,
    gap: spacingY._5,
  },
  myBubble: {
    backgroundColor: colors.myBubble,
  },
  theirBubble: {
    backgroundColor: colors.otherBubble,
  },
});