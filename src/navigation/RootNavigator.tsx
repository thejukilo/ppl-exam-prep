import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TopicScreen } from '../screens/TopicScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { ExamScreen } from '../screens/ExamScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { AuthScreen } from '../screens/AuthScreen';

import { useAppSelector } from '../redux/store';
import { selectOnboardingCompleted } from '../redux/slices/appSlice';
import { TopicId } from '../types';
import { colors } from '../utils/colors';

// ----- Param lists -----

export type RootStackParamList = {
  Welcome: undefined;
  Auth: { mode?: 'signin' | 'signup' } | undefined;
  /**
   * Same screen as Auth, but reachable from inside the signed-in app
   * (e.g. for guests upgrading their account). Has a different route name
   * to avoid React Navigation reusing the same screen across signed-out
   * and signed-in branches, which caused a "stuck modal" bug.
   */
  UpgradeAccount: { mode?: 'signin' | 'signup' } | undefined;
  Onboarding: undefined;
  Tabs: undefined;
  Topic: { topicId: TopicId };
  Quiz: {
    topicId?: TopicId; // optional in review mode (cross-topic)
    mode?: 'practice' | 'review';
    /** Number of questions in this practice session. Defaults to 10. */
    count?: number;
    /** If set, this question will be the first one in the batch (used by Bookmarks). */
    startQuestionId?: string;
    /** When true, restore the saved in-progress session for this topic. */
    resume?: boolean;
  };
  Exam: { topicId: TopicId };
  Result: {
    topicId?: TopicId;
    correct: number;
    total: number;
    questionIds: string[];
    /** Set when this Result came from review mode, so the screen can adapt copy. */
    isReview?: boolean;
  };
  Paywall: undefined;
  Bookmarks: undefined;
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
  const onboardingCompleted = useAppSelector(selectOnboardingCompleted);

  // Three top-level branches:
  //   - signed out -> Welcome + Auth modal
  //   - signed in but onboarding not yet completed -> Onboarding
  //   - fully ready -> Tabs + content stack
  // Switching between branches re-mounts everything (e.g. signing out clears state).

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
        ) : !onboardingCompleted ? (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNav} options={{ headerShown: false }} />
            <Stack.Screen name="Topic" component={TopicScreen} options={{ title: '' }} />
            <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Practice' }} />
            <Stack.Screen name="Exam" component={ExamScreen} options={{ title: 'Mock Exam' }} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ title: 'Bookmarks' }} />
            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ title: 'Results', headerBackVisible: false }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ title: 'Unlock Premium', presentation: 'modal' }}
            />
            <Stack.Screen
              name="UpgradeAccount"
              component={AuthScreen}
              options={{ title: '', presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
