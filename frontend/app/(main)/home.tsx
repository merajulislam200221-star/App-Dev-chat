import Button from "@/components/Button";
import ConversationItem from "@/components/ConversationItem";
import Loading from "@/components/Loading";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import {
  getConversations,
  newConversation,
  newMessage,
} from "@/socket/socketEvents";
import { verticalScale } from "@/utilis/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
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
    if (res.success) {
      let conversationId = res.data.conversationId;
      setConversations((prev) => {
        let updatedConversations = prev.map((item) => {
          if (item._id == conversationId) item.lastMessage = res.data;
          return item;
        });

        return updatedConversations;
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

  return (
    <ScreenWrapper showPattern={true} bgOpacity={0.4}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Typo
              color={colors.neutral200}
              size={19}
              textProps={{ numberOfLines: 1 }}
            >
              Welcome back,{" "}
              <Typo
                size={20}
                color={colors.white}
                fontWeight="800"
              >
                {currentUser?.name || "User"} 🫡
              </Typo>
            </Typo>
          </View>

          <TouchableOpacity
            style={styles.settingIcon}
            onPress={() => router.push("/(main)/profileModal")}
          >
            <Icons.GearSix
              color={colors.white}
              weight="fill"
              size={verticalScale(22)}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingVertical: spacingY._20,
            }}
          >
            {/* Tabs */}
            <View style={styles.navBar}>
              <View style={styles.tabs}>
                <TouchableOpacity
                  onPress={() => setSelectedTab(0)}
                  style={[
                    styles.tabStyle,
                    selectedTab === 0 && styles.activeTabStyle,
                  ]}
                >
                  <Typo color={selectedTab === 0 ? colors.black : colors.neutral700}>
                    Direct Messages
                  </Typo>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedTab(1)}
                  style={[
                    styles.tabStyle,
                    selectedTab === 1 && styles.activeTabStyle,
                  ]}
                >
                  <Typo color={selectedTab === 1 ? colors.black : colors.neutral700}>
                    Groups
                  </Typo>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conversation List */}
            {loading ? (
              <View style={{ marginTop: spacingY._20 }}>
                <Loading />
              </View>
            ) : (
              <View style={styles.conversationList}>
                {selectedTab === 0 &&
                  directConversations.map((item: any, index: number) => (
                    <ConversationItem
                      item={item}
                      key={item._id || index}
                      router={router}
                      showDivider={directConversations.length !== index + 1}
                    />
                  ))}

                {selectedTab === 1 &&
                  groupConversations.map((item: any, index: number) => (
                    <ConversationItem
                      item={item}
                      key={item._id || index}
                      router={router}
                      showDivider={groupConversations.length !== index + 1}
                    />
                  ))}
              </View>
            )}

            {/* Empty States */}
            {!loading &&
              selectedTab === 0 &&
              directConversations.length === 0 && (
                <Typo style={{ textAlign: "center", marginTop: spacingY._20 }}>
                  You don't have any messages
                </Typo>
              )}

            {!loading &&
              selectedTab === 1 &&
              groupConversations.length === 0 && (
                <Typo style={{ textAlign: "center", marginTop: spacingY._20 }}>
                  You haven't joined any groups yet
                </Typo>
              )}
          </ScrollView>
        </View>
      </View>

      {/* Floating Plus Button */}
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
    paddingHorizontal: spacingX._20,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius._50,
    borderTopRightRadius: radius._50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._20,
  },
  navBar: {
    flexDirection: "row",
    gap: spacingX._15,
    alignItems: "center",
    paddingHorizontal: spacingX._10,
  },
  tabs: {
    flexDirection: "row",
    gap: spacingX._10,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabStyle: {
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._20,
    borderRadius: radius.full,
    backgroundColor: colors.neutral100,
  },
  activeTabStyle: {
    backgroundColor: colors.primaryLight,
  },
  conversationList: {
    paddingVertical: spacingY._20,
  },
  settingIcon: {
    padding: spacingY._10,
    backgroundColor: colors.neutral700,
    borderRadius: radius.full,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
});