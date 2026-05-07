import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize } from '../../constants/typography';
import { CreateEventSheet } from '../../components/create/CreateEventSheet';

function TabIcon({ name, focused, colors }: { name: string; focused: boolean; colors: typeof LightColors }) {
  const icons: Record<string, string> = {
    Feed: '⌂',
    Events: '◷',
    Groups: '⊞',
    Profile: '○',
  };

  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, { color: focused ? colors.accent : colors.textTertiary }]}>
        {icons[name] ?? name[0]}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: {
            fontFamily: FontFamily.sans,
            fontSize: FontSize.xs,
          },
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Feed" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Events" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: 'Groups',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Groups" focused={focused} colors={colors} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="Profile" focused={focused} colors={colors} />
            ),
          }}
        />
      </Tabs>
      <CreateEventSheet />
    </>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
});
