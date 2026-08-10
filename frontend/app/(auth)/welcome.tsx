import Button from '@/components/Button';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utilis/styling';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const Welcome = () => {

    const router = useRouter();   
    return (
        <ScreenWrapper showPattern={true}  bgOpacity ={0.5}>
            <View style={styles.container}>

                {/* App Title */}
                <View style={{ alignItems: "center" }}>
                    <Typo color={colors.white} size={43} fontWeight={"900"}>
                        Chatify
                    </Typo>
                </View>

                {/* Hero Image */}
                <Animated.Image
                    entering={FadeIn.duration(700).springify()}
                    source={require("../../assets/images/welcome.png")}
                    style={styles.welcomeImage}
                    resizeMode={"contain"}
                />

                {/* Tagline */}
                <View>
                    <Typo color={colors.white} size={33} fontWeight={800}>
                        Stay Connected
                    </Typo>
                    <Typo color={colors.white} size={33} fontWeight={800}>
                        with your friends
                    </Typo>
                    <Typo color={colors.white} size={33} fontWeight={800}>
                        and family
                    </Typo>
                </View>

                {/* Get Started Button */}
                <Button style ={{backgroundColor: colors.white}} onPress={() => router.push('/(auth)/register')}>
                    <Typo size ={23} fontWeight={"bold"}>
                    Get Started
                    </Typo>
                </Button>


            </View>
        </ScreenWrapper>
    );
};

export default Welcome;

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        justifyContent: 'space-around',
        paddingHorizontal: spacingX._20,
        marginVertical: spacingY._10,
    },
    background: {
        flex: 1,
        backgroundColor: colors.neutral900,
    },
    welcomeImage: {
        height: verticalScale(300),
        aspectRatio: 1,
        alignSelf: "center",
    }, 
});