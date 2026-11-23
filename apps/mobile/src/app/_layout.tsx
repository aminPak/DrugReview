import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { CabinetProvider } from "@/lib/cabinet";
import { m } from "@/lib/app";
import { useColors } from "@/lib/theme";

export default function RootLayout() {
  const colors = useColors();
  return (
    <CabinetProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: m.appName }} />
        <Stack.Screen name="add" options={{ title: m.search.title, presentation: "modal" }} />
        <Stack.Screen name="profile" options={{ title: m.profile.title }} />
        <Stack.Screen name="results" options={{ title: m.results.title }} />
      </Stack>
    </CabinetProvider>
  );
}
