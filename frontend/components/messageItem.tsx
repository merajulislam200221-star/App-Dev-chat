import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { useAuth } from '@/contexts/authContext';
import { scale, verticalScale } from '@/utilis/styling';
import { MessageProps } from '@/utilis/types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Avatar from './Avatar';
import Typo from './Typo';
import moment from 'moment';
import { Image } from "expo-image";

// Distinct sender colors for group members
const SENDER_COLORS = [
  "#2563eb", // blue
  "#7c3aed", // purple
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#0891b2", // cyan
  "#db2777", // pink
];

const getSenderColor = (name: string = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
};

const MessageItem = ({
  item,
  isDirect,
}: {
  item: MessageProps;
  isDirect?: boolean;
}) => {
  const { user: currentUser } = useAuth();
  const isMe = currentUser?.id == item?.sender?.id;

  const formattedDate = moment(item.createdAt).isSame(moment(), "day")
    ? moment(item.createdAt).format("h:mm A")
    : moment(item.createdAt).format("MMM D, h:mm A");

  const senderColor = !isMe && !isDirect ? getSenderColor(item?.sender?.name) : colors.neutral800;

  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.theirMessage,
      ]}
    >
      {!isMe && !isDirect && (
        <Avatar
          size={32}
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
        {!isMe && !isDirect && item?.sender?.name && (
          <Typo
            color={senderColor}
            fontWeight="700"
            size={12}
            style={{ marginBottom: 2 }}
          >
            {item.sender.name}
          </Typo>
        )}

        {item.attachment && (
          <Image
            source={
              typeof item.attachment === "string"
                ? { uri: item.attachment }
                : item.attachment
            }
            contentFit="cover"
            style={styles.attachment}
            transition={150}
          />
        )}

        {item.content ? (
          <Typo
            color={isMe ? "#1c1917" : colors.neutral900}
            size={15}
            style={styles.messageText}
          >
            {item.content}
          </Typo>
        ) : null}

        <Typo
          color={isMe ? "rgba(0,0,0,0.55)" : colors.neutral500}
          size={10}
          fontWeight="500"
          style={{
            alignSelf: isMe ? "flex-end" : "flex-start",
            marginTop: 2,
          }}
        >
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
    maxWidth: "82%",
    marginVertical: 2,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  theirMessage: {
    alignSelf: "flex-start",
  },
  messageAvatar: {
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  attachment: {
    height: verticalScale(190),
    width: verticalScale(210),
    borderRadius: radius._12,
    marginBottom: 4,
  },
  messageBubble: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._7,
    borderRadius: radius._17,
    minWidth: 70,
  },
  myBubble: {
    backgroundColor: "#fef08a", // soft warm primary yellow
    borderBottomRightRadius: radius._3,
  },
  theirBubble: {
    backgroundColor: colors.neutral100,
    borderBottomLeftRadius: radius._3,
  },
  messageText: {
    lineHeight: 20,
  },
});