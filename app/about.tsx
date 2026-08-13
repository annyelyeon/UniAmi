import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "../src/components/ScreenShell";
import { colors } from "../src/theme/colors";

const services = [
  { icon: "people-outline", label: "Community boards and messages", highlight: false },
  { icon: "school-outline", label: "Subject reviews", highlight: false },
  { icon: "calendar-outline", label: "Timetable and notes", highlight: false },
  { icon: "pricetag-outline", label: "Sticker marketplace", highlight: false },
  { icon: "diamond-outline", label: "Premium (ad-free stickers + Job Board)", highlight: true },
] as const;

const paymentMethods = [
  { label: "Apple Pay", icon: "logo-apple" },
  { label: "Google Pay", icon: "logo-google" },
  { label: "Visa/Mastercard", icon: "card-outline" },
] as const;

export default function AboutScreen() {
  return (
    <ScreenShell title="About UniAmi" subtitle="Business details and static app information.">
      <View style={styles.card}>
        <SectionTitle title="Business details" />
        <View style={styles.infoGroup}>
          <InfoLine label="Company" value="UniAmi Pty Ltd" />
          <InfoLine label="ABN" value="12 345 678 901" />
          <Text style={styles.note}>Temporary ABN for assignment purposes.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Contact us" />
        <Pressable accessibilityRole="button" style={styles.contactRow}>
          <View style={styles.contactIconWrap}>
            <Ionicons name="mail-outline" size={16} color={colors.accent} />
          </View>
          <Text style={styles.contactText}>support@uniami.au</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Available services" />
        <View style={styles.serviceList}>
          {services.map((service) => (
            <View key={service.label} style={styles.serviceRow}>
              <View style={[styles.serviceIconWrap, service.highlight ? styles.highlightIconWrap : null]}>
                <Ionicons
                  name={service.icon}
                  size={16}
                  color={service.highlight ? colors.brandRed : colors.accent}
                />
              </View>
              <Text style={[styles.serviceLabel, service.highlight ? styles.highlightLabel : null]}>
                {service.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Accepted payment methods" />
        <View style={styles.pillRow}>
          {paymentMethods.map((method) => (
            <View key={method.label} style={styles.pill}>
              <Ionicons name={method.icon as keyof typeof Ionicons.glyphMap} size={14} color={colors.text} />
              <Text style={styles.pillText}>{method.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Social links" />
        <View style={styles.socialRow}>
          <View style={styles.socialLink}>
            <Ionicons name="logo-instagram" size={18} color={colors.accent} />
          </View>
          <View style={styles.socialLink}>
            <Ionicons name="logo-tiktok" size={18} color={colors.accent} />
          </View>
          <Text style={styles.socialHandle}>@uniami.au</Text>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        This app is for a class assignment and not for commercial purposes.
      </Text>
    </ScreenShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  infoGroup: {
    gap: 8,
  },
  infoLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
    flexShrink: 1,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  contactText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  serviceList: {
    gap: 10,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  serviceIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  highlightIconWrap: {
    backgroundColor: "#FEE2E2",
  },
  serviceLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  highlightLabel: {
    color: colors.brandRed,
    fontWeight: "800",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  socialLink: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSoft,
  },
  socialHandle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});