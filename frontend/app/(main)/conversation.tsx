import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Icons from "phosphor-react-native";
import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import MessageItem from "@/components/messageItem";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import Loading from "@/components/Loading";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utilis/styling";
import { uploadFileToCloudinary } from "@/services/imageService";
import * as ImagePicker from "expo-image-picker";
import { MessageProps, ResponseProps } from "@/utilis/types";
import { newMessage, getMessage } from "@/socket/socketEvents";

const Conversation = () => {
  const { user: currentUser } = useAuth();
  const {
    id: conversationId,
    name,
    participants: stringifiedParticipants,
    avatar,
    type,
  } = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ url: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);

  let participants: any[] = [];
  try {
    participants = JSON.parse(
      (stringifiedParticipants as string) || "[]"
    );
  } catch {
    participants = [];
  }

  const isGroup = type === "group";
  const isDirect = !isGroup;

  const otherParticipant = isDirect
    ? participants?.find((p: any) => (p._id || p.id) !== currentUser?.id)
    : null;

  const conversationAvatar = isDirect
    ? otherParticipant?.avatar || avatar || ""
    : avatar || "";

  const conversationName = isDirect
    ? otherParticipant?.name || name || "Chat"
    : name || "Group Chat";

  const memberSubtitle = isGroup
    ? `${participants.length > 0 ? participants.length : 2} members`
    : otherParticipant?.email || "Direct Message";

  const newMessageHandler = (res: ResponseProps) => {
    setLoading(false);
    if (res.success && res.data) {
      if (res.data.conversationId == conversationId) {
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === res.data.id || m.id === res.data._id);
          if (alreadyExists) return prev;
          return [res.data as MessageProps, ...prev];
        });
      }
    } else if (!res.success) {
      Alert.alert("Error", res.msg || "Failed to deliver message");
    }
  };

  const messagesHandler = (res: ResponseProps) => {
    if (res.success && Array.isArray(res.data)) {
      setMessages(res.data);
    }
  };

  useEffect(() => {
    newMessage(newMessageHandler);
    getMessage(messagesHandler);

    getMessage({ conversationId });

    return () => {
      newMessage(newMessageHandler, true);
      getMessage(messagesHandler, true);
    };
  }, [conversationId]);

  const onPickfile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedFile({ url: result.assets[0].uri });
    }
  };

  const onSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !selectedFile) return;
    if (!currentUser) return;

    setLoading(true);
    try {
      let attachment = null;
      if (selectedFile) {
        const uploadResult = await uploadFileToCloudinary(
          selectedFile.url,
          "message-attachments"
        );
        if (uploadResult.success) {
          attachment = uploadResult.data;
        } else {
          setLoading(false);
          Alert.alert("Error", "Could not send the image!");
          return;
        }
      }

      newMessage({
        conversationId,
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar,
        },
        content: trimmedMessage,
        attachment,
      });

      setMessage("");
      setSelectedFile(null);
    } catch (error) {
      console.log("Error sending message: ", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === "web" && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = message.trim().length > 0 || selectedFile !== null;

  return (
    <ScreenWrapper showPattern={true} bgOpacity={0.5}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <Header
          style={styles.header}
          leftIcon={
            <View style={styles.headerLeft}>
              <BackButton iconSize={24} />
              <Avatar
                size={42}
                url={conversationAvatar as string}
                isGroup={isGroup}
              />
              <View style={{ marginLeft: spacingX._7 }}>
                <Typo color={colors.white} fontWeight="700" size={18} textProps={{ numberOfLines: 1 }}>
                  {conversationName}
                </Typo>
                <Typo color="rgba(255,255,255,0.7)" size={12} textProps={{ numberOfLines: 1 }}>
                  {memberSubtitle}
                </Typo>
              </View>
            </View>
          }
        />

        {/* Messages List */}
        <View style={styles.content}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.waveIconContainer}>
                {isGroup ? (
                  <Icons.UsersThree size={48} color={colors.primaryDark} weight="duotone" />
                ) : (
                  <Icons.HandWaving size={48} color={colors.primaryDark} weight="duotone" />
                )}
              </View>
              <Typo size={18} fontWeight="700" color={colors.neutral800} style={{ marginTop: 12 }}>
                {isGroup ? `Welcome to ${conversationName}!` : `Say hello to ${conversationName}!`}
              </Typo>
              <Typo size={14} color={colors.neutral500} style={{ marginTop: 4, textAlign: "center" }}>
                Send the first message to kick off the conversation.
              </Typo>
            </View>
          ) : (
            <FlatList
              data={messages}
              inverted={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messageContent}
              renderItem={({ item }: { item: any }) => (
                <MessageItem item={item} isDirect={isDirect} />
              )}
              keyExtractor={(item, index) => item.id || item._id || index.toString()}
            />
          )}

          {/* Attachment Preview Banner */}
          {selectedFile && (
            <View style={styles.attachmentPreviewCard}>
              <Image source={{ uri: selectedFile.url }} style={styles.previewImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Typo size={13} fontWeight="600" color={colors.neutral800}>
                  Photo ready to send
                </Typo>
                <Typo size={11} color={colors.neutral500}>
                  Tap send or cancel
                </Typo>
              </View>
              <TouchableOpacity
                style={styles.cancelAttachmentBtn}
                onPress={() => setSelectedFile(null)}
              >
                <Icons.X size={16} color={colors.neutral700} weight="bold" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Footer */}
          <View style={styles.footer}>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={onPickfile}
                activeOpacity={0.7}
              >
                <Icons.Image
                  color={colors.neutral700}
                  weight="bold"
                  size={verticalScale(22)}
                />
              </TouchableOpacity>

              <TextInput
                value={message}
                onChangeText={setMessage}
                onKeyPress={handleKeyPress}
                placeholder={isGroup ? `Message ${conversationName}...` : "Type a message..."}
                placeholderTextColor={colors.neutral400}
                style={styles.input}
                multiline={true}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                canSend && styles.sendButtonActive,
              ]}
              onPress={onSend}
              disabled={loading || !canSend}
              activeOpacity={0.8}
            >
              {loading ? (
                <Loading size="small" color={colors.black} />
              ) : (
                <Icons.PaperPlaneTilt
                  color={canSend ? colors.black : colors.neutral400}
                  weight="fill"
                  size={verticalScale(20)}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingX._15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._7,
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacingX._25,
  },
  waveIconContainer: {
    backgroundColor: colors.primaryLight,
    padding: 20,
    borderRadius: radius.full,
  },
  messageContent: {
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._7,
  },
  attachmentPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    borderRadius: radius._15,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  previewImage: {
    height: 48,
    width: 48,
    borderRadius: radius._10,
  },
  cancelAttachmentBtn: {
    backgroundColor: colors.neutral200,
    borderRadius: radius.full,
    padding: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacingY._7,
    paddingBottom: verticalScale(18),
    gap: spacingX._10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    borderRadius: radius.full,
    paddingHorizontal: spacingX._10,
    paddingVertical: verticalScale(6),
    minHeight: verticalScale(46),
  },
  input: {
    flex: 1,
    marginLeft: spacingX._7,
    fontSize: 15,
    color: colors.black,
    maxHeight: 100,
    outlineStyle: "none",
  } as any,
  attachButton: {
    padding: 6,
    borderRadius: radius.full,
  },
  sendButton: {
    height: verticalScale(44),
    width: verticalScale(44),
    borderRadius: radius.full,
    backgroundColor: colors.neutral200,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});