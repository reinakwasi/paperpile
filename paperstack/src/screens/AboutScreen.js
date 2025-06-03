import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Linking, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AboutScreen = ({ navigation }) => {
  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Cannot Open Link",
          "The requested URL cannot be opened. Please try again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while trying to open the link. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About PaperStack</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo and Version */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.version}>Version 1.4.1</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>
            PaperStack is your personal academic companion, designed to help you organize, 
            discover, and engage with research papers and academic content more effectively.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            <FeatureItem icon="library" text="Smart Library Organization" />
            <FeatureItem icon="search" text="Advanced Search Capabilities" />
            <FeatureItem icon="star" text="Personalized Collections" />
            <FeatureItem icon="folder" text="Custom Folder Management" />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openLink('mailto:support@paperstack.app')}
          >
            <Ionicons name="mail" size={20} color="#4f8cff" />
            <Text style={styles.linkText}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#bbb" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2024 PaperStack. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={20} color="#4f5ef7" />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  version: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4f5ef722',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
    marginLeft: 12,
  },
  copyright: {
    textAlign: 'center',
    color: '#999',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 32,
  },
});

export default AboutScreen; 