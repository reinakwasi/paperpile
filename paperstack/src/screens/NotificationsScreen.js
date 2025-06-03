import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState({
    newPapers: true,
    updates: true,
    reminders: false,
    recommendations: true,
    systemUpdates: true
  });

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationTypes = [
    {
      key: 'newPapers',
      title: 'New Papers',
      description: 'Get notified when new papers are added to your library',
      icon: 'document-text'
    },
    {
      key: 'updates',
      title: 'Paper Updates',
      description: 'Receive notifications about updates to your saved papers',
      icon: 'refresh'
    },
    {
      key: 'reminders',
      title: 'Reading Reminders',
      description: 'Get reminders about papers you haven\'t read yet',
      icon: 'alarm'
    },
    {
      key: 'recommendations',
      title: 'Recommendations',
      description: 'Receive personalized paper recommendations',
      icon: 'star'
    },
    {
      key: 'systemUpdates',
      title: 'System Updates',
      description: 'Get notified about app updates and maintenance',
      icon: 'settings'
    }
  ];

  const showFeatureUnavailable = () => {
    Alert.alert(
      "Feature Unavailable",
      "This feature would require app store deployment to be fully functional. This is a demonstration of how the notifications would work in the production version.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          {notificationTypes.map((type) => (
            <View key={type.key} style={styles.notificationItem}>
              <View style={styles.notificationIcon}>
                <Ionicons name={type.icon} size={20} color="#4f5ef7" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{type.title}</Text>
                <Text style={styles.notificationDescription}>{type.description}</Text>
              </View>
              <Switch
                value={notifications[type.key]}
                onValueChange={() => {
                  toggleNotification(type.key);
                  showFeatureUnavailable();
                }}
                trackColor={{ false: '#e0e0e0', true: '#4f5ef7' }}
                thumbColor={notifications[type.key] ? '#fff' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Notification Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoText}>
            Note: Some notification features require app store deployment to be fully functional.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f5ef722',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  notificationDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  }
});

export default NotificationsScreen; 