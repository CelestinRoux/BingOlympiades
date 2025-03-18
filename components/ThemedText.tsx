import { Colors } from "@/constants/Colors";
import { useThemeColors } from "@/hooks/useThemeColors";
import { StyleSheet, TextProps, Text} from "react-native";

const styles = StyleSheet.create({
    body3: {
        fontSize: 10,
        lineHeight: 16,
    },
    caption: {
        fontSize: 8,
        lineHeight: 12,
    },
    headline: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: "900",
        padding: 2,
    },
    subtitle1: {
        fontSize: 20,
        fontWeight: "700",
        padding: 2,
    },
    subtitle2: {
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "bold",
    },
    subtitle3: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "400",
    },
});

type Props = TextProps & {
    variant?: keyof typeof styles;
    color?: keyof typeof Colors["light"];
}

export function ThemedText ({variant, color, style, ...rest}: Props) {
    const colors = useThemeColors();
    return <Text style={[styles[variant ?? 'body3'], {color: colors[color ?? "grayDark"]}, style]} {...rest} />
}
