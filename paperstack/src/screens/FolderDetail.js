import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaperItem from '../components/PaperItem';
import ShareFolderModal from '../components/ShareFolderModal';
import { useRoute, useNavigation } from '@react-navigation/native';

const FolderDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { folder: initialFolder, selectedPapers, fromLibrary } = route.params || {};
  const [folder, setFolder] = useState(initialFolder);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Load folder data if not provided
  useEffect(() => {
    const loadFolderData = async () => {
      if (!folder || !folder.id) {
        try {
          console.log('Loading folder data from storage...');
          const savedFolders = await AsyncStorage.getItem('my_folders');
          if (savedFolders) {
            const folders = JSON.parse(savedFolders);
            console.log('Available folders:', folders);
            const currentFolder = folders.find(f => f.id === route.params?.folder?.id);
            if (currentFolder) {
              console.log('Found folder:', currentFolder);
              setFolder(currentFolder);
            } else {
              console.error('Folder not found in storage:', route.params?.folder?.id);
              Alert.alert('Error', 'Folder not found. Please try again.');
              navigation.goBack();
            }
          } else {
            console.error('No folders found in storage');
            Alert.alert('Error', 'No folders found. Please create a folder first.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Error loading folder:', error);
          Alert.alert('Error', 'Failed to load folder data. Please try again.');
          navigation.goBack();
        }
      } else {
        console.log('Using provided folder data:', folder);
      }
    };
    loadFolderData();
  }, [route.params?.folder?.id]);

  useEffect(() => {
    if (folder && folder.id) {
      console.log('Loading papers for folder:', folder.id);
      loadPapers();
    }
  }, [folder]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedPapers && selectedPapers.length > 0 && folder && folder.id) {
        // Process all papers at once
        const addPapers = async () => {
          try {
            for (const paper of selectedPapers) {
              if (paper && paper.id && !papers.some(p => p.id === paper.id)) {
                await handleAddPaper(paper);
              }
            }
            // Only clear selection if we came from library
            if (fromLibrary) {
              navigation.setParams({ selectedPapers: undefined });
            }
          } catch (error) {
            console.error('Error adding papers:', error);
            Alert.alert('Error', 'Failed to add some papers to the folder');
          }
        };
        
        addPapers();
      }
    });

    return unsubscribe;
  }, [navigation, route.params, folder]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      // Load all papers from AsyncStorage
      const savedPapers = await AsyncStorage.getItem('papers');
      if (savedPapers) {
        const allPapers = JSON.parse(savedPapers);
        // Filter papers that belong to this folder
        const folderPapers = allPapers.filter(paper => 
          paper.folders && paper.folders.includes(folder.id)
        );
        setPapers(folderPapers);
      }
    } catch (error) {
      console.error('Error loading papers:', error);
      Alert.alert('Error', 'Failed to load papers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaper = async (paper) => {
    if (!folder || !folder.id) {
      console.error('No folder data available');
      return;
    }

    try {
      if (!paper || !paper.id) {
        console.log('Invalid paper:', paper);
        return;
      }

      if (papers.some(p => p.id === paper.id)) {
        console.log('Paper already in folder:', paper.id);
        return;
      }

      console.log('Adding paper to folder:', paper.id);
      
      // Update local state
      setPapers(prevPapers => [...prevPapers, paper]);

      // Update AsyncStorage
      const savedPapers = await AsyncStorage.getItem('papers');
      if (savedPapers) {
        const allPapers = JSON.parse(savedPapers);
        const updatedAllPapers = allPapers.map(p =>
          p.id === paper.id ? { ...p, folders: [...(p.folders || []), folder.id] } : p
        );
        await AsyncStorage.setItem('papers', JSON.stringify(updatedAllPapers));
      }

      // Update folder count
      const savedFolders = await AsyncStorage.getItem('my_folders');
      if (savedFolders) {
        const folders = JSON.parse(savedFolders);
        const updatedFolders = folders.map(f =>
          f.id === folder.id ? { ...f, count: f.count + 1 } : f
        );
        await AsyncStorage.setItem('my_folders', JSON.stringify(updatedFolders));
        // Update local folder state
        setFolder(prev => ({ ...prev, count: prev.count + 1 }));
      }
    } catch (error) {
      console.error('Error adding paper to folder:', error);
      throw error;
    }
  };

  const handleRemovePaper = async (paperId) => {
    try {
      // Remove paper from folder
      const updatedPapers = papers.filter(p => p.id !== paperId);
      setPapers(updatedPapers);

      // Update in AsyncStorage
      const savedPapers = await AsyncStorage.getItem('papers');
      if (savedPapers) {
        const allPapers = JSON.parse(savedPapers);
        const updatedAllPapers = allPapers.map(p =>
          p.id === paperId 
            ? { ...p, folders: (p.folders || []).filter(f => f !== folder.id) }
            : p
        );
        await AsyncStorage.setItem('papers', JSON.stringify(updatedAllPapers));
      }

      // Update folder count
      const savedFolders = await AsyncStorage.getItem('my_folders');
      if (savedFolders) {
        const folders = JSON.parse(savedFolders);
        const updatedFolders = folders.map(f =>
          f.id === folder.id ? { ...f, count: f.count - 1 } : f
        );
        await AsyncStorage.setItem('my_folders', JSON.stringify(updatedFolders));
      }
    } catch (error) {
      console.error('Error removing paper from folder:', error);
      Alert.alert('Error', 'Failed to remove paper from folder');
    }
  };

  const handlePaperPress = (paper) => {
    if (paper.pdfUrl || paper.localUri) {
      navigation.navigate('PDFViewer', { 
        uri: paper.localUri || paper.pdfUrl,
        title: paper.title 
      });
    } else {
      Alert.alert('Error', 'No PDF available for this paper');
    }
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f5ef7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <MaterialCommunityIcons 
            name={folder.icon} 
            size={24} 
            color={folder.color} 
          />
          <Text style={styles.headerTitle}>{folder.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShareModalVisible(true)}
          >
            <Ionicons name="share-outline" size={24} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Library', { 
              onSelect: (papers) => {
                if (Array.isArray(papers)) {
                  papers.forEach(paper => {
                    navigation.setParams({ selectedPaper: paper });
                  });
                } else {
                  navigation.setParams({ selectedPaper: papers });
                }
              },
              multiSelect: true,
              folder: folder
            })}
          >
            <Ionicons name="add" size={24} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#bbb" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search papers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Papers List */}
      <FlatList
        data={filteredPapers}
        renderItem={({ item }) => (
          <PaperItem
            item={item}
            onPress={() => handlePaperPress(item)}
            onStar={() => {}}
            onDownload={() => {}}
            onMore={() => {
              Alert.alert(
                'Paper Options',
                '',
                [
                  {
                    text: 'Remove from Folder',
                    onPress: () => handleRemovePaper(item.id),
                    style: 'destructive'
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
            }}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No papers in this folder</Text>
            <Text style={styles.emptySubText}>
              Add papers by tapping the + button
            </Text>
          </View>
        }
      />

      <ShareFolderModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        folder={folder}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    marginLeft: 8,
    paddingVertical: 6,
  },
  listContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
});

export default FolderDetail; 