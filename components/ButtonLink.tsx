import { Text, View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Link, RelativePathString } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';

type Props = {
    path: RelativePathString;
    isUnlocked: boolean;
    text: string;
};

export function ButtonLink({ path, isUnlocked, text, ...rest}: Props) {
  const colors = useThemeColors();
  return (
    <View style={{overflow: "hidden", width: "100%", borderRadius: 20}}>
      <Pressable 
          style={[styles.button, {backgroundColor: colors.tint}]} {...rest} android_ripple={{color: colors.tintHover}}>
          <Link style={{width: "100%", textAlign: "center"}} href={{ pathname: path, params: { isUnlocked: String(isUnlocked) } }}>
              <ThemedText variant="subtitle1" color="grayDark">{text}</ThemedText>
          </Link>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({ 
    button : {
        borderRadius: 20,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});