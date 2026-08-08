import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PlaceholderScreen as DashboardScreen } from '@/features/dashboard';
import { PlaceholderScreen as ProgressScreen } from '@/features/exercises';
import {
  ExerciseCatalogScreen,
} from '@/features/exercises/screens/ExerciseCatalogScreen';
import { PlaceholderScreen as SettingsScreen } from '@/features/settings';
import {
  RoutineFormScreen,
  RoutinesScreen,
  WorkoutSessionScreen,
  WorkoutsHistoryScreen,
  type WorkoutsStackParamList,
} from '@/features/workouts';
import { colors } from '@/shared/theme';

export type RootTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type { WorkoutsStackParamList };

const Tab = createBottomTabNavigator<RootTabParamList>();
const WorkoutsStack = createNativeStackNavigator<WorkoutsStackParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<keyof RootTabParamList, { focused: IoniconName; unfocused: IoniconName }> = {
  Dashboard: { focused: 'home', unfocused: 'home-outline' },
  Workouts: { focused: 'barbell', unfocused: 'barbell-outline' },
  Progress: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

function WorkoutsStackNavigator() {
  return (
    <WorkoutsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <WorkoutsStack.Screen
        name="RoutinesList"
        component={RoutinesScreen}
        options={{ title: 'Rutinas' }}
      />
      <WorkoutsStack.Screen
        name="RoutineForm"
        component={RoutineFormScreen}
        options={({ route }) => ({
          title: route.params?.routineId != null ? 'Editar rutina' : 'Nueva rutina',
        })}
      />
      <WorkoutsStack.Screen
        name="ExerciseCatalog"
        component={ExerciseCatalogScreen}
        options={{ title: 'Catálogo de Ejercicios' }}
      />
      <WorkoutsStack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ title: 'Sesión de Entrenamiento' }}
      />
      <WorkoutsStack.Screen
        name="WorkoutsHistory"
        component={WorkoutsHistoryScreen}
        options={{ title: 'Historial de Entrenos' }}
      />
    </WorkoutsStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icon.focused : icon.unfocused} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Workouts" component={WorkoutsStackNavigator} options={{ tabBarLabel: 'Rutinas' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progreso' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Ajustes' }} />
    </Tab.Navigator>
  );
}