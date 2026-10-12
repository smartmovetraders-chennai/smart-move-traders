import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import InvoiceListScreen from '../screens/InvoiceListScreen';
import CreateBillScreen from '../screens/CreateBillScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '800',
          color: colors.textPrimary
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        }
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📊</Text>
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoiceListScreen}
        options={{
          title: 'Bills',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📑</Text>
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📈</Text>
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>⚙️</Text>
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '800',
          color: colors.textPrimary
        },
        headerTintColor: colors.primary,
        headerBackTitleVisible: false
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{
          title: 'New Wholesale Bill'
        }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{
          title: 'Invoice Details'
        }}
      />
    </Stack.Navigator>
  );
}
