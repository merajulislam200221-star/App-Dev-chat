import React from 'react';
import { StyleSheet, View } from 'react-native'; // View ইমপোর্ট করা হয়েছে
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utilis/styling';
import Typo from '@/components/Typo';
import ScreenWrapper from '@/components/ScreenWraper';
import { Background } from '@react-navigation/elements';
import Animated, { FadeIn } from 'react-native-reanimated';
import Button from '@/components/Button';

const Welcome = () => { // 'W' বড় হাতের করা হয়েছে
    return (
        <ScreenWrapper showPattern={true}>
            <View style={styles.container}>

                <view style={{ alignItems: "center" }}>

                    <Typo color={colors.white} size={43} fontWeight={"900"}>
                        Bubbly
                    </Typo>

                </view>

                <Animated.Image
                    entering={FadeIn.duration(700).springify()}
                    source={require("../../assets/images/welcome.png")}
                    style={styles.welcomeImage}
                    resizeMode={"contain"}
                />
                <view>

                    <Typo color={colors.white} size={33} fontWeight={800}>
                        Stay Connected
                    </Typo>
                    <Typo color={colors.white} size={33} fontWeight={800}>
                        with your friends
                    </Typo>

                    <Typo color={colors.white} size={33} fontWeight={800}>
                        and family
                    
                    </Typo>

                </view>
                <Button />

            </View>
        </ScreenWrapper>
    );
};

export default Welcome;

const styles = StyleSheet.create({
    container: {
        flex: 1, // কন্টেইনার যেন পুরো স্ক্রিন জুড়ে থাকে
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