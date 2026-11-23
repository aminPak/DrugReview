import { APP_NAME, APP_TAGLINE, MEDICAL_DISCLAIMER } from "@drugreview/core";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.tagline}>{APP_TAGLINE}</Text>
        <Text style={styles.disclaimer}>{MEDICAL_DISCLAIMER}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
  },
  tagline: {
    fontSize: 17,
    lineHeight: 24,
  },
  disclaimer: {
    fontSize: 13,
    opacity: 0.7,
  },
});
