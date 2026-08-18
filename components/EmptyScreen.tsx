import { Text, View } from "react-native";
import { commonStyles } from "@/styles/commonStyles";

type EmptyScreenProps = {
    emoji: string;
    title: string;
    subtitle: string;
};

export default function EmptyScreen({ emoji, title, subtitle }: EmptyScreenProps) {
    return (
        <View style={commonStyles.centeredContainer}>
            <Text style={commonStyles.emoji}>{emoji}</Text>
            <Text style={commonStyles.title}>{title}</Text>
            <Text style={commonStyles.subtitle}>{subtitle}</Text>
        </View>
    );
}