// src/screens/FolderScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  SectionList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const FOLDER_COLORS = [
  '#FFA726', '#42A5F5', '#EC407A', '#26A69A', '#7E57C2', 
  '#FFD600', '#00B8D4', '#FF7043', '#5C6BC0', '#66BB6A'
];

const FolderScreen = ({ navigation }) => {
  const [myFolders, setMyFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);

  // Load folders when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadFolders();
    }, [])
  );

  const loadFolders = async () => {
    try {
      setLoading(true);
      const savedMyFolders = await AsyncStorage.getItem('my_folders');
      
      if (savedMyFolders) {
        setMyFolders(JSON.parse(savedMyFolders));
      } else {
        // Initialize with default folders if none exist
        const defaultFolders = [
          { 
            id: '1', 
            name: 'Project Z', 
            updated: new Date().toISOString(), 
            color: FOLDER_COLORS[0], 
            count: 0, 
            icon: 'folder',
            papers: []
          },
          { 
            id: '2', 
            name: 'Literature Review', 
            updated: new Date().toISOString(), 
            color: FOLDER_COLORS[1], 
            count: 0, 
            icon: 'folder',
            papers: []
          }
        ];
        await AsyncStorage.setItem('my_folders', JSON.stringify(defaultFolders));
        setMyFolders(defaultFolders);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      Alert.alert('Error', 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const createNewFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      const newFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        updated: new Date().toISOString(),
        color: selectedColor,
        count: 0,
        icon: 'folder',
        papers: []
      };

      const updatedFolders = [...myFolders, newFolder];
      await AsyncStorage.setItem('my_folders', JSON.stringify(updatedFolders));
      setMyFolders(updatedFolders);
      setShowNewFolderModal(false);
      setNewFolderName('');
      setSelectedColor(FOLDER_COLORS[0]);
    } catch (error) {
      console.error('Error creating folder:', error);
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const deleteFolder = async (folderId) => {
    Alert.alert(
      'Delete Folder',
      'Are you sure you want to delete this folder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedFolders = myFolders.filter(f => f.id !== folderId);
              await AsyncStorage.setItem('my_folders', JSON.stringify(updatedFolders));
              setMyFolders(updatedFolders);
            } catch (error) {
              console.error('Error deleting folder:', error);
              Alert.alert('Error', 'Failed to delete folder');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'just now';
    }
  };

  const renderNewFolderModal = () => (
    <Modal
      visible={showNewFolderModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNewFolderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Folder</Text>
          <TextInput
            style={styles.input}
            placeholder="Folder name"
            value={newFolderName}
            onChangeText={setNewFolderName}
            autoFocus
          />
          <Text style={styles.colorTitle}>Choose a color</Text>
          <View style={styles.colorGrid}>
            {FOLDER_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowNewFolderModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton]}
              onPress={createNewFolder}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSectionHeader = (title, actionButton) => (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionButton}
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.folderCard}
      onPress={() => navigation.navigate('FolderDetail', { folder: item })}
      onLongPress={() => deleteFolder(item.id)}
    >
      <View style={[styles.folderIcon, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
      </View>
      <View style={styles.folderInfo}>
        <Text style={styles.folderName}>{item.name}</Text>
        <Text style={styles.folderMeta}>
          {item.count} papers • Updated {formatDate(item.updated)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#bbb" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f5ef7" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Folders</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 12 }}>
            <Ionicons name="search" size={22} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={22} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={myFolders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderSectionHeader(
          'MY FOLDERS',
          null
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowNewFolderModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      {renderNewFolderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f5ef7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 13,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  folderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderInfo: {
    flex: 1,
  },
  folderName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  folderMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    backgroundColor: '#4f5ef7',
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  colorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 8,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#222',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  createButton: {
    backgroundColor: '#4f5ef7',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default FolderScreen;