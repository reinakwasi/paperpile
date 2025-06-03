// src/screens/MoreScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MoreScreen = ({ navigation }) => {
  console.log('MoreScreen rendered');

  const handleLogout = async () => {
    console.log('Logout button pressed');
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Logout cancelled')
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            console.log('Logout confirmed, starting logout process');
            try {
              // Only clear authentication data, preserve user profile
              await AsyncStorage.removeItem('token');
              console.log('Authentication data cleared from AsyncStorage');
              
              // Navigate to Login screen and clear the navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
              console.log('Navigation reset to Login screen');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                'Error',
                'Failed to log out. Please try again.',
                [
                  {
                    text: 'OK',
                    onPress: () => console.log('Error alert dismissed')
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    { title: 'View Account >', subtitle: 'Jordan Lee\njordan.lee@email.com' },
    { title: 'Privacy Settings', onPress: () => navigation.navigate('PrivacySettings') },
    { title: 'Notifications', onPress: () => navigation.navigate('NotificationSettings') },
    { title: 'Appearance' },
    { title: 'Subscription & Billing' },
    { title: 'Import / Export' },
    { title: 'Help & Support', onPress: () => navigation.navigate('HelpSupport') },
    { title: 'About PaperStack', onPress: () => navigation.navigate('About') },
    { title: 'Log Out', color: 'red', onPress: handleLogout },
  ];

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <TouchableOpacity 
          key={index} 
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View>
            {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
            <Text style={[styles.menuText, item.color && { color: item.color }]}>
              {item.title}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <Text style={styles.version}>v1.4.1 – PaperStack</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtitle: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 4,
  },
  menuText: {
    fontSize: 16,
  },
  version: {
    marginTop: 32,
    textAlign: 'center',
    color: 'gray',
  },
});

export default MoreScreen;