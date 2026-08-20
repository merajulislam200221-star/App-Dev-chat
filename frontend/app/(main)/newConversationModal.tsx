import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { getContacts, newConversation } from "@/socket/socketEvents";
import { uploadFileToCloudinary } from "@/services/imageService";
import { verticalScale } from "@/utilis/styling";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const NewConversationModal = () => {
  const { isGroup } = useLocalSearchParams();

  const isGroupMode = isGroup == "1";

  const router = useRouter();

  const [contacts, setContacts] = useState<any[]>([]);

  const [groupAvatar, setGroupAvatar] = useState<{
    uri: string;
  } | null>(null);

  const [groupName, setGroupName] = useState("");

  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(false);

  const { user: currentUser } = useAuth();

  const processGetContacts = (res: any) => {
    console.log("got contacts: ", res);

    if (res.success) {
      setContacts(res.data);
    }
  };

  const processNewConversation = (res: any) => {
    console.log("new conversation result: ", res);

    setIsLoading(false);

    if (res.success) {
      router.push({
        pathname: "/conversation" as any,
        params: {
          id: res.data._id,
          name: res.data.name,
          avatar: res.data.avatar,
          type: res.data.type,
          participants: JSON.stringify(res.data.participants),
        },
      });
    } else {
      console.log("Error fetching/creating conversation: ", res.msg);
      Alert.alert("Error", res.msg);
    }
  };

  useEffect(() => {
    getContacts(processGetContacts);
    newConversation(processNewConversation);

    return () => {
      getContacts(processGetContacts, true);
      newConversation(processNewConversation, true);
    };
  }, []);

  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    console.log(result);

    if (!result.canceled) {
      setGroupAvatar(result.assets[0]);
    }
  };

  const toggleParticipant = (user: any) => {
    setSelectedParticipants((prev: string[]) => {
      if (prev.includes(user.id)) {
        return prev.filter((id) => id !== user.id);
      }

      return [...prev, user.id];
    });
  };

  const onSelectUser = (user: any) => {
    if (!currentUser) {
      Alert.alert(
        "Authentication",
        "Please login to start a conversation"
      );
      return;
    }

    if (isGroupMode) {
      toggleParticipant(user);
    } else {
      newConversation({
        type: "direct",
        participants: [currentUser.id, user.id],
      });
    }
  };

  const createGroup = async () => {
    if (
      !groupName.trim() ||
      !currentUser ||
      selectedParticipants.length < 2
    ) {
      return;
    }

    setIsLoading(true);

    try {
      let avatar = null;

      // Upload group avatar if selected
      if (groupAvatar) {
        const uploadResult = await uploadFileToCloudinary(
          groupAvatar,
          "group-avatars"
        );

        if (!uploadResult.success) {
          throw new Error(
            uploadResult.msg || "Could not upload group avatar"
          );
        }

        if (uploadResult.success) {
          avatar = uploadResult.data;
        }
      }

      newConversation({
        type: "group",
        participants: [
          currentUser.id,
          ...selectedParticipants,
        ],
        name: groupName.trim(),
        avatar,
      });
    } catch (error: any) {
      console.log("Error creating group:", error);

      setIsLoading(false);

      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
        <Header
          title={isGroupMode ? "New Group" : "Select User"}
          leftIcon={<BackButton color={colors.black} />}
        />

        {isGroupMode && (
          <View style={styles.groupInfoContainer}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={onPickImage}>
                <Avatar
                  url={groupAvatar?.uri || null}
                  size={100}
                  isGroup={true}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.groupNameContainer}>
              <Input
                placeholder="Group Name"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
        >
          {contacts.map((user: any, index: number) => {
            const isSelected = selectedParticipants.includes(user.id);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.contactRow,
                  isSelected && styles.selectedContact,
                ]}
                onPress={() => onSelectUser(user)}
              >
                <Avatar
                  size={45}
                  url={user.avatar}
                />

                <Typo fontWeight="500">
                  {user.name}
                </Typo>

                {isGroupMode && (
                  <View style={styles.selectionIndicator}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checked,
                      ]}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isGroupMode && selectedParticipants.length >= 2 && (
          <View style={styles.createGroupButton}>
            <Button
              onPress={createGroup}
              loading={isLoading}
            >
              <Typo
                fontWeight="bold"
                size={17}
              >
                Create Group
              </Typo>
            </Button>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default NewConversationModal;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacingX._15,
    flex: 1,
  },

  groupInfoContainer: {
    alignItems: "center",
    marginTop: spacingY._10,
  },

  avatarContainer: {
    marginBottom: spacingY._10,
  },

  groupNameContainer: {
    width: "100%",
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    paddingVertical: spacingY._5,
  },

  selectedContact: {
    backgroundColor: colors.neutral100,
    borderRadius: radius._15,
  },

  contactList: {
    gap: spacingY._12,
    marginTop: spacingY._10,
    paddingTop: spacingY._10,
    paddingBottom: verticalScale(150),
  },

  selectionIndicator: {
    marginLeft: "auto",
    marginRight: spacingX._10,
  },

  checkbox: {
    width: verticalScale(20),
    height: verticalScale(20),
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  checked: {
    backgroundColor: colors.primary,
  },

  createGroupButton: {
    position: "absolute",
    bottom: spacingY._20,
    left: 0,
    right: 0,
  },
});

