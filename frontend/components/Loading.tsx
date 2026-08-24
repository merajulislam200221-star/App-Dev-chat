import { ActivityIndicator, StyleSheet, View } from 'react-native';

type LoadingProps = {
  size?: 'small' | 'large';
  color?: string;
};

const Loading = ({ size = 'large', color = '#0000ff' }: LoadingProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loading;