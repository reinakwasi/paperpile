import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const JournalDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { journal } = route.params;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Journal Info */}
        <View style={styles.journalInfo}>
          <MaterialCommunityIcons 
            name="book-open-variant" 
            size={48} 
            color={journal.color || '#4f5ef7'} 
          />
          <Text style={styles.journalName}>{journal.name}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journal.paperCount}</Text>
              <Text style={styles.statLabel}>Papers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{journal.citationCount}</Text>
              <Text style={styles.statLabel}>Citations</Text>
            </View>
            {journal.impact && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{journal.impact}</Text>
                <Text style={styles.statLabel}>Impact Factor</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Papers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Papers</Text>
          <Text style={styles.emptyText}>No recent papers available</Text>
        </View>

        {/* Top Authors Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Authors</Text>
          <Text style={styles.emptyText}>No author data available</Text>
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
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  journalInfo: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  journalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default JournalDetails; 