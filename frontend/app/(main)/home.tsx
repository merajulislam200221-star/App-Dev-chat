import Button from "@/components/Button"; // প্রজেক্টের কাস্টম Button ইমপোর্ট করা হলো
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { StyleSheet, View } from "react-native";
import ScreenWrapper from "../../components/ScreenWrapper";

const Home = () => {
  const { user, signOut } = useAuth(); // signOut ফাংশন নিয়ে আসা হলো

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Typo color={colors.white} size={24}>
          Welcome, {user?.name || "User"}
        </Typo>

        {/* কাস্টম Button কম্পোনেন্ট যা children গ্রহণ করে */}
        <View style={styles.buttonContainer}>
          <Button onPress={signOut}>
            <Typo fontWeight={"bold"} color={colors.black} size={16}>
              Logout
            </Typo>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  buttonContainer: {
    width: "80%",
  },
});