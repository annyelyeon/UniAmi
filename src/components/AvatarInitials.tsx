import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type AvatarInitialsProps = {
  name: string;
};

export function AvatarInitials({ name }: AvatarInitialsProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.accentStrong,
    fontSize: 15,
    fontWeight: "800",
  },
});