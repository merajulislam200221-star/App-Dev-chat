import Button from "@/components/Button";
import ConversationItem from "@/components/ConversationItem";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import Avatar from "@/components/Avatar";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import {
  getConversations,
  newConversation,
  newMessage,
} from "@/socket/socketEvents";
import { scale, verticalScale } from "@/utilis/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ResponseProps {
  success: boolean;
  data?: any;
  msg?: string;
}

const Home = () => {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [conversations, setConversations] = useState<any[]>([]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const processConversations = (res: ResponseProps) => {
    setLoading(false);
    if (res.success) {
      setConversations(res.data || []);
    }
  };

  const newConversationHandler = (res: ResponseProps) => {
    if (res.success && res.data) {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === res.data._id);
        if (exists) return prev;
        return [res.data, ...prev];
      });
    }
  };

  const newMessageHandler = (res: ResponseProps) => {
    if (res.success && res.data) {
      const conversationId = res.data.conversationId;
      setConversations((prev) => {
        return prev.map((item) => {
          if (item._id == conversationId) {
            return { ...item, lastMessage: res.data };
          }
          return item;
        });
      });
    }
  };

  // ==========================================
  // SOCKET LISTENERS & LIFECYCLE
  // ==========================================

  useEffect(() => {
    getConversations(processConversations);
    newConversation(newConversationHandler);
    newMessage(newMessageHandler);

    getConversations(null);

    return () => {
      getConversations(processConversations, true);
      newConversation(newConversationHandler, true);
      newMessage(newMessageHandler, true);
    };
  }, []);

  // Filter & Sort Direct Messages
  const directConversations = conversations
    .filter((item: any) => item.type === "direct")
    .sort((a: any, b: any) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  // Filter & Sort Group Messages
  const groupConversations = conversations
    .filter((item: any) => item.type === "group")
    .sort((a: any, b: any) => {
      const aDate = a?.lastMessage?.createdAt || a.createdAt;
      const bDate = b?.lastMessage?.createdAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  // Apply search query filter
  const filterBySearch = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item: any) => {
      if (item.type === "group") {
        return item.name?.toLowerCase().includes(q);
      }
      // For direct chats, search other participant's name or email
      const other = item.participants?.find((p: any) => (p._id || p.id) !== currentUser?.id);
      return (
        other?.name?.toLowerCase().includes(q) ||
        other?.email?.toLowerCase().includes(q) ||
        item.lastMessage?.content?.toLowerCase().includes(q)
      );
    });
  };

  const filteredDirect = filterBySearch(directConversations);
  const filteredGroups = filterBySearch(groupConversations);

  return (
    <ScreenWrapper showPattern={true} bgOpacity={0.4}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerProfile}>
            <Avatar
              url={currentUser?.avatar || ""}
              size={46}
            />
            <View style={{ marginLeft: spacingX._10, flex: 1 }}>
              <Typo color={colors.neutral300} size={13} fontWeight="500">
                Welcome back 👋
              </Typo>
              <Typo size={19} color={colors.white} fontWeight="700" textProps={{ numberOfLines: 1 }}>
                {currentUser?.name || "User"}
              </Typo>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingIcon}
            onPress={() => router.push("/(main)/profileModal")}
            activeOpacity={0.7}
          >
            <Icons.GearSix
              color={colors.white}
              weight="fill"
              size={verticalScale(20)}
            />
          </TouchableOpacity>
        </View>

        {/* Content Sheet */}
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icons.MagnifyingGlass
              size={18}
              color={colors.neutral500}
              weight="bold"
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search chats, contacts, groups..."
              placeholderTextColor={colors.neutral400}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icons.XCircle size={18} color={colors.neutral500} weight="fill" />
              </TouchableOpacity>
            )}
          </View>

          {/* Segmented Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setSelectedTab(0)}
              style={[
                styles.tabStyle,
                selectedTab === 0 && styles.activeTabStyle,
              ]}
              activeOpacity={0.8}
            >
              <Icons.ChatCircle
                size={16}
                color={selectedTab === 0 ? colors.black : colors.neutral600}
                weight={selectedTab === 0 ? "fill" : "regular"}
              />
              <Typo
                fontWeight={selectedTab === 0 ? "700" : "500"}
                size={14}
                color={selectedTab === 0 ? colors.black : colors.neutral700}
              >
                Direct
              </Typo>
              {directConversations.length > 0 && (
                <View style={[styles.badge, selectedTab === 0 ? styles.badgeActive : styles.badgeInactive]}>
                  <Typo size={11} fontWeight="700" color={selectedTab === 0 ? colors.black : colors.neutral700}>
                    {directConversations.length}
                  </Typo>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedTab(1)}
              style={[
                styles.tabStyle,
                selectedTab === 1 && styles.activeTabStyle,
              ]}
              activeOpacity={0.8}
            >
              <Icons.Users
                size={16}
                color={selectedTab === 1 ? colors.black : colors.neutral600}
                weight={selectedTab === 1 ? "fill" : "regular"}
              />
              <Typo
                fontWeight={selectedTab === 1 ? "700" : "500"}
                size={14}
                color={selectedTab === 1 ? colors.black : colors.neutral700}
              >
                Groups
              </Typo>
              {groupConversations.length > 0 && (
                <View style={[styles.badge, selectedTab === 1 ? styles.badgeActive : styles.badgeInactive]}>
                  <Typo size={11} fontWeight="700" color={selectedTab === 1 ? colors.black : colors.neutral700}>
                    {groupConversations.length}
                  </Typo>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Conversation List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: verticalScale(100),
            }}
          >
            {loading ? (
              <View style={{ marginTop: spacingY._30 }}>
                <Loading />
              </View>
            ) : (
              <View style={styles.conversationList}>
                {selectedTab === 0 && (
                  <>
                    {filteredDirect.map((item: any, index: number) => (
                      <ConversationItem
                        item={item}
                        key={item._id || index}
                        router={router}
                        showDivider={filteredDirect.length !== index + 1}
                      />
                    ))}

                    {filteredDirect.length === 0 && (
                      <View style={styles.emptyState}>
                        <Icons.ChatCircleDots size={48} color={colors.neutral300} weight="duotone" />
                        <Typo size={16} fontWeight="600" color={colors.neutral800} style={{ marginTop: 12 }}>
                          {searchQuery ? "No matching conversations" : "No direct messages yet"}
                        </Typo>
                        <Typo size={13} color={colors.neutral500} style={{ marginTop: 4, textAlign: "center" }}>
                          {searchQuery
                            ? "Try searching with a different term."
                            : "Start a conversation with friends or colleagues."}
                        </Typo>
                        {!searchQuery && (
                          <TouchableOpacity
                            style={styles.emptyActionBtn}
                            onPress={() =>
                              router.push({
                                pathname: "/(main)/newConversationModal",
                                params: { isGroup: 0 },
                              })
                            }
                          >
                            <Icons.Plus size={16} color={colors.black} weight="bold" />
                            <Typo size={14} fontWeight="700" color={colors.black}>
                              New Message
                            </Typo>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </>
                )}

                {selectedTab === 1 && (
                  <>
                    {filteredGroups.map((item: any, index: number) => (
                      <ConversationItem
                        item={item}
                        key={item._id || index}
                        router={router}
                        showDivider={filteredGroups.length !== index + 1}
                      />
                    ))}

                    {filteredGroups.length === 0 && (
                      <View style={styles.emptyState}>
                        <Icons.UsersThree size={48} color={colors.neutral300} weight="duotone" />
                        <Typo size={16} fontWeight="600" color={colors.neutral800} style={{ marginTop: 12 }}>
                          {searchQuery ? "No matching groups" : "No groups joined yet"}
                        </Typo>
                        <Typo size={13} color={colors.neutral500} style={{ marginTop: 4, textAlign: "center" }}>
                          {searchQuery
                            ? "Try searching with a different group name."
                            : "Create a group chat to talk with multiple friends at once."}
                        </Typo>
                        {!searchQuery && (
                          <TouchableOpacity
                            style={styles.emptyActionBtn}
                            onPress={() =>
                              router.push({
                                pathname: "/(main)/newConversationModal",
                                params: { isGroup: 1 },
                              })
                            }
                          >
                            <Icons.UserPlus size={16} color={colors.black} weight="bold" />
                            <Typo size={14} fontWeight="700" color={colors.black}>
                              Create Group
                            </Typo>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Floating Action Button */}
      <Button
        style={styles.floatingButton}
        onPress={() => {
          router.push({
            pathname: "/(main)/newConversationModal",
            params: { isGroup: selectedTab },
          });
        }}
      >
        <Icons.Plus
          color={colors.black}
          weight="bold"
          size={verticalScale(24)}
        />
      </Button>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._7,
    paddingBottom: spacingY._15,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    padding: spacingY._10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: radius.full,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    borderRadius: radius.full,
    paddingHorizontal: spacingX._15,
    paddingVertical: verticalScale(9),
    marginBottom: spacingY._12,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacingX._7,
    fontSize: 14,
    color: colors.neutral900,
    outlineStyle: "none",
  } as any,
  tabsContainer: {
    flexDirection: "row",
    gap: spacingX._10,
    marginBottom: spacingY._10,
  },
  tabStyle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._12,
    borderRadius: radius.full,
    backgroundColor: colors.neutral100,
    gap: 6,
  },
  activeTabStyle: {
    backgroundColor: colors.primary,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgeActive: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  badgeInactive: {
    backgroundColor: colors.neutral200,
  },
  conversationList: {
    paddingTop: spacingY._7,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(45),
    paddingHorizontal: spacingX._20,
  },
  emptyActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._15,
    borderRadius: radius.full,
    marginTop: spacingY._15,
  },
  floatingButton: {
    height: verticalScale(52),
    width: verticalScale(52),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(25),
    right: verticalScale(25),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});