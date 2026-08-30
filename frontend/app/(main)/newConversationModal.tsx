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
import { scale, verticalScale } from "@/utilis/styling";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const NewConversationModal = () => {
  const { isGroup } = useLocalSearchParams();
  const [isGroupMode, setIsGroupMode] = useState<boolean>(isGroup == "1");
  const router = useRouter();

  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupAvatar, setGroupAvatar] = useState<{ uri: string } | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { user: currentUser } = useAuth();

  const processGetContacts = (res: any) => {
    if (res.success && Array.isArray(res.data)) {
      setContacts(res.data);
    }
  };

  const processNewConversation = (res: any) => {
    setIsLoading(false);

    if (res.success && res.data) {
      const isDirect = res.data.type === "direct";
      const otherParticipant = isDirect
        ? res.data.participants?.find(
            (p: any) => (p._id || p.id) != currentUser?.id
          )
        : null;

      const conversationName = isDirect
        ? otherParticipant?.name || "Direct Message"
        : res.data.name || "Group";

      const conversationAvatar = isDirect
        ? otherParticipant?.avatar || ""
        : res.data.avatar || "";

      router.replace({
        pathname: "/(main)/conversation" as any,
        params: {
          id: res.data._id,
          name: conversationName,
          avatar: conversationAvatar,
          type: res.data.type,
          participants: JSON.stringify(res.data.participants),
        },
      });
    } else {
      Alert.alert("Error", res?.msg || "Failed to create conversation");
    }
  };

  useEffect(() => {
    getContacts(processGetContacts);
    newConversation(processNewConversation);

    getContacts(null);

    return () => {
      getContacts(processGetContacts, true);
      newConversation(processNewConversation, true);
    };
  }, []);

  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      aspect: [1, 1],
      quality: 0.6,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setGroupAvatar(result.assets[0]);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const onSelectUser = (user: any) => {
    if (!currentUser) {
      Alert.alert("Authentication", "Please login to start a conversation");
      return;
    }

    if (isGroupMode) {
      toggleParticipant(user.id);
    } else {
      setIsLoading(true);
      newConversation({
        type: "direct",
        participants: [currentUser.id, user.id],
      });
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Group Name Required", "Please enter a name for the group");
      return;
    }
    if (!currentUser) return;
    if (selectedParticipants.length < 1) {
      Alert.alert(
        "Members Required",
        "Please select at least 1 other member to create the group"
      );
      return;
    }

    setIsLoading(true);

    try {
      let avatar = null;

      if (groupAvatar) {
        const uploadResult = await uploadFileToCloudinary(
          groupAvatar,
          "group-avatars"
        );

        if (uploadResult.success) {
          avatar = uploadResult.data;
        }
      }

      newConversation({
        type: "group",
        participants: [currentUser.id, ...selectedParticipants],
        name: groupName.trim(),
        avatar: avatar || "",
      });
    } catch (error: any) {
      console.log("Error creating group:", error);
      setIsLoading(false);
      Alert.alert("Error", error.message || "Failed to create group");
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  });

  const selectedContactObjects = contacts.filter((c) =>
    selectedParticipants.includes(c.id)
  );

  const canCreateGroup = groupName.trim().length > 0 && selectedParticipants.length > 0;

  return (
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
        <Header
          title={isGroupMode ? "Create Group" : "New Chat"}
          leftIcon={<BackButton color={colors.black} />}
        />

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setIsGroupMode(false)}
            style={[styles.tab, !isGroupMode && styles.activeTab]}
          >
            <Typo
              size={15}
              fontWeight={!isGroupMode ? "700" : "500"}
              color={!isGroupMode ? colors.black : colors.neutral600}
            >
              Direct Message
            </Typo>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsGroupMode(true)}
            style={[styles.tab, isGroupMode && styles.activeTab]}
          >
            <Typo
              size={15}
              fontWeight={isGroupMode ? "700" : "500"}
              color={isGroupMode ? colors.black : colors.neutral600}
            >
              Group Chat
            </Typo>
          </TouchableOpacity>
        </View>

        {/* Group Info Header (When in Group Mode) */}
        {isGroupMode && (
          <View style={styles.groupInfoCard}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={onPickImage}
            >
              <Avatar
                url={groupAvatar?.uri || null}
                size={64}
                isGroup={true}
              />
              <View style={styles.cameraIconBadge}>
                <Icons.Camera
                  size={verticalScale(13)}
                  color={colors.black}
                  weight="bold"
                />
              </View>
            </TouchableOpacity>

            <View style={styles.groupNameInputContainer}>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChangeText={setGroupName}
                containerStyle={styles.groupInput}
              />
            </View>
          </View>
        )}

        {/* Selected Participants Chips (Group Mode) */}
        {isGroupMode && selectedContactObjects.length > 0 && (
          <View style={styles.chipsSection}>
            <Typo size={12} color={colors.neutral600} fontWeight="600">
              Selected ({selectedContactObjects.length}):
            </Typo>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {selectedContactObjects.map((user) => (
                <View key={user.id} style={styles.chip}>
                  <Avatar url={user.avatar} size={22} />
                  <Typo size={12} fontWeight="600" style={{ maxWidth: 80 }} textProps={{ numberOfLines: 1 }}>
                    {user.name.split(" ")[0]}
                  </Typo>
                  <TouchableOpacity
                    onPress={() => toggleParticipant(user.id)}
                    style={styles.chipRemove}
                  >
                    <Icons.X size={11} color={colors.neutral700} weight="bold" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Contacts Bar */}
        <View style={styles.searchSection}>
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon={
              <Icons.MagnifyingGlass
                size={verticalScale(18)}
                color={colors.neutral500}
              />
            }
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Contact List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contactList}
        >
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icons.Users size={verticalScale(36)} color={colors.neutral400} />
              <Typo color={colors.neutral600} size={14} style={{ marginTop: 8 }}>
                No contacts found
              </Typo>
            </View>
          ) : (
            filteredContacts.map((user: any) => {
              const isSelected = selectedParticipants.includes(user.id);

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.contactRow,
                    isSelected && styles.selectedContactRow,
                  ]}
                  onPress={() => onSelectUser(user)}
                  activeOpacity={0.7}
                >
                  <Avatar size={44} url={user.avatar} />

                  <View style={{ flex: 1, marginLeft: spacingX._10 }}>
                    <Typo fontWeight="600" size={15}>
                      {user.name}
                    </Typo>
                    <Typo size={12} color={colors.neutral500}>
                      {user.email}
                    </Typo>
                  </View>

                  {isGroupMode ? (
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Icons.Check
                          size={13}
                          color={colors.black}
                          weight="bold"
                        />
                      )}
                    </View>
                  ) : (
                    <Icons.CaretRight
                      size={18}
                      color={colors.neutral400}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Dedicated Bottom Footer for Create Group Button */}
        {isGroupMode && (
          <View style={styles.footerContainer}>
            <Button
              onPress={createGroup}
              loading={isLoading}
              disabled={!canCreateGroup || isLoading}
              style={[
                styles.createButton,
                !canCreateGroup && styles.createButtonDisabled,
              ]}
            >
              <Typo
                fontWeight="700"
                size={16}
                color={canCreateGroup ? colors.black : colors.neutral500}
              >
                {selectedParticipants.length === 0
                  ? "Select members to create group"
                  : `Create Group (${selectedParticipants.length + 1} Members)`}
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
    paddingHorizontal: spacingX._15,
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral100,
    borderRadius: radius.full,
    padding: 4,
    marginVertical: spacingY._10,
  },
  tab: {
    flex: 1,
    paddingVertical: spacingY._7,
    alignItems: "center",
    borderRadius: radius.full,
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  groupInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    borderRadius: radius._20,
    padding: spacingX._12,
    marginVertical: spacingY._7,
    gap: spacingX._12,
  },
  avatarWrapper: {
    position: "relative",
  },
  cameraIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  groupNameInputContainer: {
    flex: 1,
  },
  groupInput: {
    backgroundColor: colors.white,
    borderColor: colors.neutral300,
    height: verticalScale(44),
  },
  chipsSection: {
    marginVertical: spacingY._5,
    gap: 6,
  },
  chipsScroll: {
    flexDirection: "row",
    gap: spacingX._7,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 8,
    gap: 6,
  },
  chipRemove: {
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    padding: 2,
  },
  searchSection: {
    marginVertical: spacingY._7,
  },
  searchInput: {
    height: verticalScale(45),
    backgroundColor: colors.neutral100,
    borderColor: "transparent",
  },
  contactList: {
    paddingVertical: spacingY._7,
    paddingBottom: spacingY._15,
    gap: spacingY._7,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._7,
    paddingHorizontal: spacingX._10,
    borderRadius: radius._15,
  },
  selectedContactRow: {
    backgroundColor: colors.neutral100,
  },
  checkbox: {
    width: verticalScale(22),
    height: verticalScale(22),
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.neutral400,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._40,
  },
  footerContainer: {
    paddingVertical: spacingY._10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  createButton: {
    backgroundColor: colors.primary,
    height: verticalScale(48),
    borderRadius: radius.full,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: colors.neutral200,
    shadowOpacity: 0,
    elevation: 0,
  },
});


