import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>More</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
});
