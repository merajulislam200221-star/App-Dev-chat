import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utilis/styling";
import { ConversationListItemProps } from "@/utilis/types";
import * as Icons from "phosphor-react-native";
import moment from "moment";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "./Avatar";
import Typo from "./Typo";

const ConversationItem = ({
  item,
  showDivider,
  router,
}: ConversationListItemProps) => {
  const { user: currentUser } = useAuth();

  const lastMessage: any = item.lastMessage;
  const isGroup = item.type === "group";
  const isDirect = !isGroup;

  let avatar = item.avatar;

  const otherParticipant = isDirect
    ? item?.participants?.find(
        (p: any) => (p._id || p.id) != currentUser?.id
      )
    : null;

  if (isDirect && otherParticipant) {
    avatar = otherParticipant?.avatar;
  }

  const conversationTitle = isDirect
    ? otherParticipant?.name || "Direct Message"
    : item?.name || "Group Chat";

  const getLastMessageSender = () => {
    if (!lastMessage || isDirect) return "";
    const senderId = lastMessage.senderId?._id || lastMessage.senderId?.id || lastMessage.sender?.id || lastMessage.senderId;
    if (senderId === currentUser?.id) return "You: ";
    if (lastMessage.senderId?.name) return `${lastMessage.senderId.name.split(" ")[0]}: `;
    if (lastMessage.sender?.name) return `${lastMessage.sender.name.split(" ")[0]}: `;
    return "";
  };

  const getLastMessageContent = () => {
    if (!lastMessage) return isGroup ? "Group created. Say hello 👋" : "Say hi 👋";

    const senderPrefix = getLastMessageSender();

    if (lastMessage?.attachment) {
      return `${senderPrefix}📷 Photo`;
    }

    return `${senderPrefix}${lastMessage.content || "Say hi 👋"}`;
  };

  const getLastMessageDate = () => {
    if (!lastMessage?.createdAt) return "";

    const messageDate = moment(lastMessage.createdAt);
    const today = moment();

    if (messageDate.isSame(today, "day")) {
      return messageDate.format("h:mm A");
    }

    if (messageDate.isSame(today.clone().subtract(1, "day"), "day")) {
      return "Yesterday";
    }

    if (messageDate.isSame(today, "year")) {
      return messageDate.format("MMM D");
    }

    return messageDate.format("MM/DD/YY");
  };

  const openConversation = () => {
    router.push({
      pathname: "/(main)/conversation",
      params: {
        id: item._id,
        name: conversationTitle,
        avatar: avatar || "",
        type: item.type,
        participants: JSON.stringify(item.participants),
      },
    });
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={openConversation}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            url={avatar}
            size={50}
            isGroup={isGroup}
          />
          {isGroup && (
            <View style={styles.groupBadge}>
              <Icons.Users size={11} color={colors.white} weight="bold" />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Typo
              size={16}
              fontWeight="600"
              color={colors.neutral900}
              style={{ flex: 1, marginRight: 6 }}
              textProps={{ numberOfLines: 1 }}
            >
              {conversationTitle}
            </Typo>

            {item.lastMessage && (
              <Typo size={12} color={colors.neutral500} fontWeight="500">
                {getLastMessageDate()}
              </Typo>
            )}
          </View>

          <Typo
            size={14}
            color={colors.neutral600}
            style={{ marginTop: 2 }}
            textProps={{ numberOfLines: 1 }}
          >
            {getLastMessageContent()}
          </Typo>
        </View>
      </TouchableOpacity>

      {showDivider && <View style={styles.divider} />}
    </View>
  );
};

export default ConversationItem;

const styles = StyleSheet.create({
  conversationItem: {
    gap: spacingX._12,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._7,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius._15,
  },
  avatarContainer: {
    position: "relative",
  },
  groupBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
    width: "82%",
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
});