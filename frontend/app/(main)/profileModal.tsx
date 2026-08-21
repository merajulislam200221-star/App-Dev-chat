import Avatar from "@/components/Avatar";
import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { updateProfile } from "@/socket/socketEvents";
import { uploadFileToCloudinary } from "@/services/imageService";
import { UserDataProps } from "@/utilis/types";
import { scale, verticalScale } from "@/utilis/styling";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const ProfileModal = () => {
  const { user, signOut, updateToken } = useAuth();
  const router = useRouter();

  const [userData, setUserData] = useState<UserDataProps>({
    name: "",
    email: "",
    avatar: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateProfile(processUpdateProfile);

    return () => {
      updateProfile(processUpdateProfile, true);
    };
  }, []);

  const processUpdateProfile = (res: any) => {
    console.log("got res: ", res);

    setLoading(false);

    if (res.success) {
      updateToken(res.data.token);
      router.back();
    } else {
      Alert.alert("User", res.msg);
    }
  };

  useEffect(() => {
    setUserData({
      name: user?.name || "",
      email: user?.email || "",
      avatar: user?.avatar,
    });
  }, [user]);

  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      // allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    console.log(result);

    if (!result.canceled) {
      setUserData({
        ...userData,
        avatar: result.assets[0],
      });
    }
  };

  const handleLogout = async () => {
    router.back();
    await signOut();
  };

  const showLogoutAlert = () => {
    Alert.alert("Confirm", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        onPress: () => console.log("cancel logout"),
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => handleLogout(),
        style: "destructive",
      },
    ]);
  };

  const onSubmit = async () => {
    let { name, avatar } = userData;

    if (!name.trim()) {
      Alert.alert("User", "please enter your name");
      return;
    }

    let data = {
      name,
      avatar,
    };

    if (avatar && avatar?.uri) {
      setLoading(true);

      const res = await uploadFileToCloudinary(avatar, "profiles");

      //console.log("result: ", res);

      if (res.success) {
        data.avatar = res.data;
      } else {
        Alert.alert("User", res.msg);
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    updateProfile(data);
  };

  return (
    <ScreenWrapper isModal={true}>
      <View style={styles.container}>
        <Header
          title="Update Profile"
          leftIcon={
            Platform.OS === "android" ? (
              <BackButton color={colors.black} />
            ) : undefined
          }
          style={{ marginVertical: spacingY._15 }}
        />

        {/* Form */}
        <ScrollView contentContainerStyle={styles.form}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Avatar url={userData.avatar} size={170} />

            <TouchableOpacity
              style={styles.editIcon}
              onPress={onPickImage}
            >
              <Icons.Pencil
                size={verticalScale(20)}
                color={colors.neutral800}
              />
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <View style={{ gap: spacingY._20 }}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Typo style={{ paddingLeft: spacingX._10 }}>
                Email
              </Typo>

              <Input
                value={userData.email}
                editable={false}
                containerStyle={{
                  borderColor: colors.neutral350,
                  paddingLeft: spacingX._20,
                  backgroundColor: colors.neutral300,
                }}
              />
            </View>

            {/* Name */}
            <View style={styles.inputContainer}>
              <Typo style={{ paddingLeft: spacingX._10 }}>
                Name
              </Typo>

              <Input
                value={userData.name}
                onChangeText={(value) =>
                  setUserData({
                    ...userData,
                    name: value,
                  })
                }
                placeholder="Enter your name"
                containerStyle={{
                  borderColor: colors.neutral350,
                  paddingLeft: spacingX._20,
                }}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={showLogoutAlert}
          >
            <Icons.SignOut
              size={verticalScale(22)}
              color={colors.white}
              weight="bold"
            />
          </TouchableOpacity>

          <Button
            onPress={onSubmit}
            loading={loading}
            style={styles.updateButton}
          >
            <Typo
              fontWeight="bold"
              color={colors.black}
              size={16}
            >
              Update
            </Typo>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingX._20,
  },

  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    marginBottom: spacingY._10,
    borderTopColor: colors.neutral200,
    borderTopWidth: 1,
  },

  logoutButton: {
    height: verticalScale(45),
    width: verticalScale(45),
    borderRadius: 100,
    backgroundColor: colors.rose,
    alignItems: "center",
    justifyContent: "center",
  },

  updateButton: {
    flex: 1,
  },

  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
    paddingBottom: spacingY._30,
  },

  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },

  avatar: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.neutral500,
  },

  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.neutral100,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },

  inputContainer: {
    gap: spacingY._7,
  },
});