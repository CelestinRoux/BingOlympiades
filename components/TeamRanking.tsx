import { View, ViewProps, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemedText } from './ThemedText';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useEffect } from 'react';

type Props = ViewProps & {
    name: string,
    value: number,
    color: string,
    nbTotalGames: number,
    nbGames: number,
    maxScore: number,
};

export function TeamRanking({ name, value, color, nbTotalGames, nbGames, maxScore, style, ...rest }: Props) {
    const colors = useThemeColors();
    const sharedValue = useSharedValue(value);

    const gameProgress = nbTotalGames > 0 ? nbGames / nbTotalGames : 0;
    const scoreProgress = maxScore > 0 ? value / maxScore : 0;
    const totalProgress = (scoreProgress * gameProgress) * 100;

    const barInnerStyle = useAnimatedStyle(() => ({
        flex: totalProgress
    }));

    const barBackgroundStyle = useAnimatedStyle(() => ({
        flex: 100 - totalProgress
    }));


    useEffect(() => {
        sharedValue.value = withSpring(value);
    }, [value])

  return (
    <View style={styles.row} {...rest}>
        <View style={[styles.name, {borderColor: colors.grayLight}]}>
            <ThemedText style={{color: color}} variant="subtitle3">{name}</ThemedText>
        </View>
        <View style={styles.value}>
            <ThemedText>{value} pt{value > 1 ? "s" : ""}</ThemedText>
        </View>
        <View style={[styles.row, styles.bar]}>
            <Animated.View style={[styles.barInner, {backgroundColor: color}, barInnerStyle]}/>
            <Animated.View style={[styles.barBackground, {backgroundColor: color}, barBackgroundStyle]}/>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    row: {
        flex: 0,
        flexDirection: "row",
        alignItems: "center",
    },
    name: {
        width: 70,
        paddingRight: 8,
        borderRightWidth: 1,
        borderStyle: "solid",
        alignItems: "center",
    },
    value: {
        width: 45,
        marginLeft: 10,
    },
    bar: {
        flex: 1,
        height: 10,
        borderRadius: 20,
        overflow: "hidden",
    },
    barInner: {
        height: 10,
    },
    barBackground: {
        height: 10,
        opacity: 0.24,
    }
})