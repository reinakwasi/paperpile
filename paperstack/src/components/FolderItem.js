// src/components/FolderItem.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FolderItem = ({ item, shared }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{item.name}</Text>
      {shared ? (
        <Text style={styles.meta}>Shared by {item.sharedBy} • {item.updated}</Text>
      ) : (
        <Text style={styles.meta}>Last updated {item.updated}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: 'gray',
  },
});

export default FolderItem;