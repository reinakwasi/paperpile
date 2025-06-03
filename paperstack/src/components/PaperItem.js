import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PaperItem = ({ item, onPress, onStar, onDownload, onMore, isSelected, showCheckbox }) => {
  const handleDownload = () => {
    if (!item.pdfUrl) {
      Alert.alert('Error', 'No PDF available for this paper.');
      return;
    }
    onDownload(item);
  };

  const handlePress = () => {
    if (!item.pdfUrl && !item.localUri) {
      Alert.alert('Error', 'No PDF available for this paper.');
      return;
    }
    onPress(item);
  };

  return (
    <View style={[
      styles.container,
      isSelected && styles.selectedContainer
    ]}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={handlePress}
      >
        <View style={styles.leftContent}>
          {showCheckbox && (
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected
              ]}>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.authors} numberOfLines={1}>
              {item.authors}
            </Text>
            <Text style={styles.journal}>
              {item.journal} • {item.year}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onStar(item.id)}>
            <Ionicons 
              name={item.starred ? "star" : "star-outline"} 
              size={20} 
              color={item.starred ? "#ffd700" : "#bbb"} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onMore(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#bbb" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedContainer: {
    backgroundColor: '#f0f4ff',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f5ef7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#4f5ef7',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  authors: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  journal: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PaperItem;