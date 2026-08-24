import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utilis/styling";
import Loading from "@/components/Loading";
import { uploadFileToCloudinary } from "@/services/imageService";
import * as ImagePicker from 'expo-image-picker';

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

  const participants = JSON.parse(
    (stringifiedParticipants as string) || "[]"
  );

  let conversationAvatar = avatar;
  let isDirect = type === "direct";
  const otherParticipant = isDirect
    ? participants.find((p: any) => p._id !== currentUser?.id)
    : null;

  if (isDirect && otherParticipant) {
    conversationAvatar = otherParticipant.avatar;
  }

  let conversationName = isDirect ? otherParticipant?.name : name;

  const dummyMessages = [
    {
      id: "msg_1",
      name: "Alice",
      type: "direct",
      lastMessage: {
        senderName: "Alice",
        content: "Hey! Are we still on for tonight?",
        createdAt: "2025-06-22T18:45:00Z",
      },
    },
    {
      id: "msg_2",
      name: "Project Team",
      type: "group",
      lastMessage: {
        senderName: "Sarah",
        content: "Meeting rescheduled to 3pm tomorrow.",
        createdAt: "2025-06-21T14:10:00Z",
      },
    },
    {
      id: "msg_3",
      name: "Bob",
      type: "direct",
      lastMessage: {
        senderName: "Bob",
        content: "Can you send the files?",
        createdAt: "2025-06-23T09:30:00Z",
      },
    },
    {
      id: "msg_4",
      name: "Family Group",
      type: "group",
      lastMessage: {
        senderName: "Mom",
        content: "Don't forget dinner at 7!",
        createdAt: "2025-06-23T12:00:00Z",
      },
    },
  ];

  const onPickfile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [4, 3],
      quality: 0.5,
    });

    console.log(result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedFile({ url: result.assets[0].uri });
    }
  };

  const onSend = async () => {
    if (!message.trim() && !selectedFile) return;
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
          Alert.alert("Error", "could not send the image!");
        }
      }
      console.log('attachment:', attachment);
    } catch (error) {
      console.log("Error sending message: ", error);
      Alert.alert("Error", "failed to send message");
    } finally {
      setLoading(false);
    }
  };

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
            <View style={styles.headerleft}>
              <BackButton />
              <Avatar
                size={40}
                url={conversationAvatar as string}
                isGroup={type === "group"}
              />
              <Typo color={colors.white} fontWeight={"500"} size={22}>
                {conversationName}
              </Typo>
            </View>
          }
          rightIcon={
            <TouchableOpacity style={{ marginBottom: verticalScale(7) }}>
              <Icons.DotsThreeOutlineVertical
                weight="fill"
                color={colors.white}
              />
            </TouchableOpacity>
          }
        />
        
        {/* Messages */}
        <View style={styles.content}>
          <FlatList
            data={dummyMessages}
            inverted={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageContent}
            renderItem={({ item }: { item: any }) => (
              <MessageItem item={item} isDirect={isDirect} />
            )}
            keyExtractor={(item) => item.id}
          />
          
          <View style={styles.footer}>
            {/* Note: Ensure your custom input component is used correctly here */}
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.inputIcon} onPress={onPickfile}>
                <Icons.Plus
                  color={colors.black}
                  weight="bold"
                  size={verticalScale(22)}
                />
                {selectedFile && selectedFile.url && (
                  <Image
                    source={{ uri: selectedFile.url }}
                    style={styles.selectedFile}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputRightIcon}>
              <TouchableOpacity style={styles.inputIcon} onPress={onSend}>
                {loading ? (
          <Loading size="small" color={colors.black} />
              ) : (
           <Icons.PaperPlaneTilt
            color={colors.black}
            weight="fill"
            size={verticalScale(22)}
             />
              )}
              </TouchableOpacity>
            </View>
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
  headerleft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  inputRightIcon: {
    position: "absolute",
    right: scale(10),
    top: verticalScale(15),
    paddingLeft: spacingX._12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.neutral300,
  },
  selectedFile: {
    position: "absolute",
    height: verticalScale(38),
    width: verticalScale(38),
    borderRadius: radius.full,
    alignSelf: "center",
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
  inputIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  footer: {
    paddingTop: spacingY._7,
    paddingBottom: verticalScale(22),
  },
  messageContent: {
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._12,
  },
  plusIcon: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 8,
  },
});