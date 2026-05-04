import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TopicScreen } from '../screens/TopicScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { StudyGuideScreen } from '../screens/StudyGuideScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { AuthScreen } from '../screens/AuthScreen';

import { useAppSelector } from '../redux/store';
import { TopicId } from '../types';
import { colors } from '../utils/colors';

// ----- Param lists -----

export type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode?: 'signin' | 'signup' } | undefined;
  Tabs: undefined;
  Topic: { topicId: TopicId };
  Quiz: { topicId: TopicId; mode?: 'practice' | 'exam' };
  Result: {
    topicId: TopicId;
    correct: number;
    total: number;
    questionIds: string[];
  };
  StudyGuide: { topicId: TopicId };
  Paywall: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ProgressTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

function TabNav() {
  return (
    <Tabs.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📚</Text>,
        }}
      />
      <Tabs.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const user = useAppSelector((s) => s.auth.user);
  const initializing = useAppSelector((s) => s.auth.initializing);

  // Two top-level branches:
  //   - signed out -> Welcome + Auth modal
  //   - signed in (incl. anonymous) -> Tabs + content stack
  // Switching between the two re-mounts everything, which is what we want
  // (e.g. signing out clears state).

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ title: '', presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNav} options={{ headerShown: false }} />
            <Stack.Screen name="Topic" component={TopicScreen} options={{ title: '' }} />
            <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Practice' }} />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ title: 'Results', headerBackVisible: false }}
            />
            <Stack.Screen name="StudyGuide" component={StudyGuideScreen} options={{ title: 'Study Guide' }} />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ title: 'Go Premium', presentation: 'modal' }}
            />
            {/* Auth is also reachable from inside the app (e.g. for guests upgrading their account) */}
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ title: '', presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
