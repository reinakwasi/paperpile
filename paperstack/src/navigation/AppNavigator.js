// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import AddPaperScreen from '../screens/AddPaperScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import AuthorDetails from '../screens/AuthorDetails';
import JournalDetails from '../screens/JournalDetails';
import FolderDetail from '../screens/FolderDetail';
import LibraryScreen from '../screens/LibraryScreen';
import AboutScreen from '../screens/AboutScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import AccountScreen from '../screens/AccountScreen';
// Import authentication screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import VerificationScreen from '../screens/VerificationScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  console.log('AppNavigator rendered');
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenListeners={{
          state: (e) => {
            console.log('Navigation state changed:', e.data.state);
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Verification" 
          component={VerificationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Account" 
          component={AccountScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AddPaper" component={AddPaperScreen} />
        <Stack.Screen 
          name="PDFViewer" 
          component={PDFViewerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AuthorDetails" component={AuthorDetails} />
        <Stack.Screen name="JournalDetails" component={JournalDetails} />
        <Stack.Screen 
          name="FolderDetail" 
          component={FolderDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Library" 
          component={LibraryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="HelpSupport" 
          component={HelpSupportScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PrivacySettings" 
          component={PrivacySettingsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;