import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const PrivacySettingsScreen = ({ navigation }) => {
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    analytics: true,
    personalizedContent: true,
    shareReadingHistory: false,
    autoSync: true
  });

  // Load saved settings on component mount
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacySettings');
      if (savedSettings) {
        setPrivacySettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const toggleSetting = async (key) => {
    try {
      const newSettings = {
        ...privacySettings,
        [key]: !privacySettings[key]
      };
      setPrivacySettings(newSettings);
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));

      // Apply the setting change
      switch (key) {
        case 'dataCollection':
          if (!newSettings[key]) {
            // Stop collecting data
            await AsyncStorage.removeItem('usageData');
          }
          break;
        case 'analytics':
          if (!newSettings[key]) {
            // Clear analytics data
            await AsyncStorage.removeItem('analyticsData');
          }
          break;
        case 'personalizedContent':
          if (!newSettings[key]) {
            // Clear personalized recommendations
            await AsyncStorage.removeItem('recommendations');
          }
          break;
        case 'shareReadingHistory':
          if (!newSettings[key]) {
            // Remove reading history from shared data
            await AsyncStorage.removeItem('sharedReadingHistory');
          }
          break;
        case 'autoSync':
          if (!newSettings[key]) {
            // Stop auto-sync
            await AsyncStorage.removeItem('syncQueue');
          }
          break;
      }
    } catch (error) {
      console.error('Error saving privacy setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const privacyOptions = [
    {
      key: 'dataCollection',
      title: 'Data Collection',
      description: 'Allow PaperStack to collect usage data to improve your experience',
      icon: 'analytics'
    },
    {
      key: 'analytics',
      title: 'Analytics',
      description: 'Share anonymous usage statistics to help improve the app',
      icon: 'bar-chart'
    },
    {
      key: 'personalizedContent',
      title: 'Personalized Content',
      description: 'Receive personalized paper recommendations based on your reading history',
      icon: 'person'
    },
    {
      key: 'shareReadingHistory',
      title: 'Share Reading History',
      description: 'Allow your reading history to be used for research purposes',
      icon: 'book'
    },
    {
      key: 'autoSync',
      title: 'Auto-Sync',
      description: 'Automatically sync your library across devices',
      icon: 'sync'
    }
  ];

  const handleDataExport = async () => {
    try {
      // Show loading state
      Alert.alert(
        "Exporting Data",
        "Preparing your data for export...",
        [{ text: "OK" }]
      );

      // Collect all user data
      const userData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.4.1',
        
        // User Profile
        profile: {
          name: await AsyncStorage.getItem('userName'),
          email: await AsyncStorage.getItem('userEmail'),
          preferences: JSON.parse(await AsyncStorage.getItem('userPreferences') || '{}')
        },

        // Library Data
        library: {
          papers: JSON.parse(await AsyncStorage.getItem('savedPapers') || '[]'),
          folders: JSON.parse(await AsyncStorage.getItem('folders') || '[]'),
          tags: JSON.parse(await AsyncStorage.getItem('tags') || '[]'),
          collections: JSON.parse(await AsyncStorage.getItem('collections') || '[]')
        },

        // Reading Data
        reading: {
          history: JSON.parse(await AsyncStorage.getItem('readingHistory') || '[]'),
          bookmarks: JSON.parse(await AsyncStorage.getItem('bookmarks') || '[]'),
          annotations: JSON.parse(await AsyncStorage.getItem('annotations') || '[]'),
          notes: JSON.parse(await AsyncStorage.getItem('notes') || '[]')
        },

        // Research Data
        research: {
          citations: JSON.parse(await AsyncStorage.getItem('citations') || '[]'),
          references: JSON.parse(await AsyncStorage.getItem('references') || '[]'),
          searchHistory: JSON.parse(await AsyncStorage.getItem('searchHistory') || '[]')
        },

        // Settings
        settings: {
          privacy: privacySettings,
          appearance: JSON.parse(await AsyncStorage.getItem('appearanceSettings') || '{}'),
          notifications: JSON.parse(await AsyncStorage.getItem('notificationSettings') || '{}'),
          sync: {
            lastSync: await AsyncStorage.getItem('lastSync'),
            syncPreferences: JSON.parse(await AsyncStorage.getItem('syncPreferences') || '{}')
          }
        }
      };

      // Format the data for better readability
      const formattedData = JSON.stringify(userData, null, 2);

      // Create a temporary file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileUri = FileSystem.documentDirectory + `paperstack_export_${timestamp}.json`;
      
      // Write the data to file
      await FileSystem.writeAsStringAsync(fileUri, formattedData);

      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        // Share the file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export PaperStack Data',
          UTI: 'public.json'
        });

        // Clean up the file after sharing
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn('Could not clean up export file:', cleanupError);
        }
      } else {
        Alert.alert(
          'Export Complete',
          'Your data has been exported, but sharing is not available on your device. The file has been saved to your device.',
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert(
        'Export Failed',
        'There was an error exporting your data. Please try again or contact support if the problem persists.',
        [{ text: "OK" }]
      );
    }
  };

  const handleDataDeletion = async () => {
    Alert.alert(
      "Delete Account Data",
      "Are you sure you want to delete all your data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              // List of all storage keys to delete
              const storageKeys = [
                'papers',
                'my_folders',
                'favorite_authors',
                'favorite_journals',
                'readingHistory',
                'bookmarks',
                'annotations',
                'notes',
                'citations',
                'references',
                'searchHistory',
                'usageData',
                'analyticsData',
                'recommendations',
                'sharedReadingHistory',
                'syncQueue',
                'userPreferences',
                'appearanceSettings',
                'notificationSettings',
                'lastSync',
                'syncPreferences'
              ];

              // Delete all specified keys
              await AsyncStorage.multiRemove(storageKeys);

              // Clear all cached files
              try {
                const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
                for (const file of files) {
                  if (file.endsWith('.json') || file.endsWith('.pdf')) {
                    await FileSystem.deleteAsync(FileSystem.documentDirectory + file, { idempotent: true });
                  }
                }
              } catch (fileError) {
                console.warn('Could not clear cached files:', fileError);
              }

              // Reset privacy settings to defaults
              setPrivacySettings({
                dataCollection: true,
                analytics: true,
                personalizedContent: true,
                shareReadingHistory: false,
                autoSync: true
              });

              // Navigate to Login screen and clear the navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert(
                "Error",
                "Failed to delete data. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Controls</Text>
          {privacyOptions.map((option) => (
            <View key={option.key} style={styles.privacyItem}>
              <View style={styles.privacyIcon}>
                <Ionicons name={option.icon} size={20} color="#4f5ef7" />
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>{option.title}</Text>
                <Text style={styles.privacyDescription}>{option.description}</Text>
              </View>
              <Switch
                value={privacySettings[option.key]}
                onValueChange={() => toggleSetting(option.key)}
                trackColor={{ false: '#e0e0e0', true: '#4f5ef7' }}
                thumbColor={privacySettings[option.key] ? '#fff' : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity 
            style={styles.dataButton}
            onPress={handleDataExport}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#4f5ef722' }]}>
              <Ionicons name="download" size={20} color="#4f5ef7" />
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonTitle}>Export My Data</Text>
              <Text style={styles.buttonDescription}>Download a copy of your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bbb" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dataButton, styles.deleteButton]}
            onPress={handleDataDeletion}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#ff3b3022' }]}>
              <Ionicons name="trash" size={20} color="#ff3b30" />
            </View>
            <View style={styles.buttonContent}>
              <Text style={[styles.buttonTitle, { color: '#ff3b30' }]}>Delete My Data</Text>
              <Text style={styles.buttonDescription}>Permanently delete all your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#bbb" />
          </TouchableOpacity>
        </View>

        {/* Privacy Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoText}>
            Your privacy is important to us. We never share your personal information with third parties without your consent.
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
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4f5ef722',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  privacyDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  dataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
  },
  deleteButton: {
    marginTop: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  buttonDescription: {
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

export default PrivacySettingsScreen; 