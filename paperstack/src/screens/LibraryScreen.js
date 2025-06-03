import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, Modal, Pressable, ActivityIndicator, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import PaperItem from '../components/PaperItem';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';

const LibraryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { onSelect, multiSelect, folder } = route.params || {};
  
  const [activeFilter, setActiveFilter] = useState('recent');
  const [papers, setPapers] = useState([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [collections, setCollections] = useState(['Default', 'Research', 'Favorites']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(multiSelect || false);

  const filters = [
    { label: 'All' },
    { label: 'Recent' },
    { label: 'Read' },
    { label: 'Unread' },
    { label: 'Cited' },
    { label: 'PDF' },
    { label: 'Open Access' },
  ];

  // Load papers from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadPapers = async () => {
        try {
          setLoading(true);
          const savedPapers = await AsyncStorage.getItem('papers');
          if (savedPapers) {
            const parsedPapers = JSON.parse(savedPapers);
            // Sort papers by date added (most recent first)
            const sortedPapers = parsedPapers.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            setPapers(sortedPapers);
          }
        } catch (error) {
          console.error('Error loading papers:', error);
          Alert.alert('Error', 'Failed to load papers');
        } finally {
          setLoading(false);
        }
      };
      loadPapers();
    }, [])
  );

  // Save papers to AsyncStorage
  useEffect(() => {
    const savePapers = async () => {
      try {
        await AsyncStorage.setItem('papers', JSON.stringify(papers));
      } catch (error) {
        Alert.alert('Error', 'Failed to save papers.');
      }
    };
    if (papers.length > 0) {
      savePapers();
    }
  }, [papers]);

  // Add effect to validate folder data
  useEffect(() => {
    if (multiSelect && (!folder || !folder.id)) {
      console.error('No folder data provided for multi-select mode');
      Alert.alert('Error', 'Invalid folder data. Please try again.');
      navigation.goBack();
    }
  }, [multiSelect, folder]);

  // Filtering logic
  const getFilteredPapers = () => {
    switch (activeFilter) {
      case 'recent':
        return papers.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      case 'read':
        return papers.filter(paper => paper.readStatus?.toLowerCase() === 'read');
      case 'unread':
        return papers.filter(paper => !paper.readStatus || paper.readStatus.toLowerCase() === 'unread');
      case 'cited':
        return papers.filter(paper => paper.citationCount > 0);
      default:
        return papers;
    }
  };

  // Toggle star handler
  const toggleStar = id => {
    setPapers(prevPapers =>
      prevPapers.map(paper =>
        paper.id === id ? { ...paper, starred: !paper.starred } : paper
      )
    );
  };

  // Toggle read status
  const toggleReadStatus = id => {
    setPapers(prevPapers =>
      prevPapers.map(paper =>
        paper.id === id
          ? { ...paper, readStatus: paper.readStatus === 'read' ? null : 'read' }
          : paper
      )
    );
  };

  // Download handler
  const handleDownload = async item => {
    try {
      if (!item.pdfUrl) {
        Alert.alert('Error', 'No PDF URL available for this paper.');
        return;
      }

      const fileName = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      const downloadResumable = FileSystem.createDownloadResumable(
        item.pdfUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${progress * 100}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      // Update the paper's localUri in the state
      const updatedPapers = papers.map(paper => 
        paper.id === item.id ? { ...paper, localUri: uri } : paper
      );
      setPapers(updatedPapers);
      await AsyncStorage.setItem('papers', JSON.stringify(updatedPapers));
      
      Alert.alert('Success', 'PDF downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download PDF: ' + error.message);
    }
  };

  // Open PDF handler
  const handleOpenPDF = async item => {
    try {
      if (!item.pdfUrl && !item.localUri) {
        Alert.alert('Error', 'No PDF available for this paper.');
        return;
      }

      let uriToOpen = item.localUri;
      if (!uriToOpen && item.pdfUrl) {
        // If no local copy exists, download it
        const fileName = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        const downloadResumable = FileSystem.createDownloadResumable(
          item.pdfUrl,
          fileUri,
          {},
          (downloadProgress) => {
            const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            console.log(`Download progress: ${progress * 100}%`);
          }
        );

        const { uri } = await downloadResumable.downloadAsync();
        uriToOpen = uri;

        // Update the paper's localUri in the state
        const updatedPapers = papers.map(paper => 
          paper.id === item.id ? { ...paper, localUri: uri } : paper
        );
        setPapers(updatedPapers);
        await AsyncStorage.setItem('papers', JSON.stringify(updatedPapers));
      }

      // Mark the paper as read when opening it
      const updatedPapers = papers.map(paper => 
        paper.id === item.id ? { ...paper, readStatus: 'read' } : paper
      );
      setPapers(updatedPapers);
      await AsyncStorage.setItem('papers', JSON.stringify(updatedPapers));

      navigation.navigate('PDFViewer', { uri: uriToOpen, title: item.title });
    } catch (error) {
      Alert.alert('Error', 'Failed to open PDF: ' + error.message);
    }
  };

  // More handler
  const handleMore = item => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Details', 'Move', 'Delete', item.readStatus === 'read' ? 'Mark as Unread' : 'Mark as Read'],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 0,
          title: item.title,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            setSelectedPaper(item);
            setDetailsModalVisible(true);
          }
          if (buttonIndex === 2) {
            setSelectedPaper(item);
            setMoveModalVisible(true);
          }
          if (buttonIndex === 3) handleDelete(item.id);
          if (buttonIndex === 4) toggleReadStatus(item.id);
        }
      );
    } else {
      Alert.alert(
        item.title,
        '',
        [
          {
            text: 'Details',
            onPress: () => {
              setSelectedPaper(item);
              setDetailsModalVisible(true);
            },
          },
          {
            text: 'Move',
            onPress: () => {
              setSelectedPaper(item);
              setMoveModalVisible(true);
            },
          },
          { text: 'Delete', onPress: () => handleDelete(item.id), style: 'destructive' },
          {
            text: item.readStatus === 'read' ? 'Mark as Unread' : 'Mark as Read',
            onPress: () => toggleReadStatus(item.id),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Delete handler
  const handleDelete = id => {
    setPapers(prevPapers => prevPapers.filter(paper => paper.id !== id));
  };

  // Move to collection
  const handleMoveToCollection = collection => {
    setPapers(prevPapers =>
      prevPapers.map(paper =>
        paper.id === selectedPaper.id ? { ...paper, collection } : paper
      )
    );
    setMoveModalVisible(false);
  };

  const handleDone = () => {
    if (selectedPapers.length > 0) {
      console.log('Selected papers before navigation:', selectedPapers);
      console.log('Folder data:', folder);
      if (!folder || !folder.id) {
        Alert.alert('Error', 'Invalid folder data');
        return;
      }
      navigation.navigate('FolderDetail', {
        selectedPapers: selectedPapers,
        folder: folder,
        fromLibrary: true
      });
    } else {
      Alert.alert('Info', 'Please select at least one paper');
    }
  };

  const handlePaperPress = (paper) => {
    if (isSelectionMode) {
      togglePaperSelection(paper);
    } else if (onSelect) {
      if (!folder || !folder.id) {
        Alert.alert('Error', 'Invalid folder data');
        return;
      }
      navigation.navigate('FolderDetail', {
        selectedPapers: [paper],
        folder: folder,
        fromLibrary: true
      });
    } else {
      handleOpenPDF(paper);
    }
  };

  const togglePaperSelection = (paper) => {
    setSelectedPapers(prev => {
      const isSelected = prev.some(p => p.id === paper.id);
      if (isSelected) {
        return prev.filter(p => p.id !== paper.id);
      } else {
        return [...prev, paper];
      }
    });
  };

  const filteredPapers = papers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFilterButton = (filter, label) => (
    <TouchableOpacity
      style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[styles.filterButtonText, activeFilter === filter && styles.activeFilterButtonText]}>
        {label}
      </Text>
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
      <Header />
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>My Library</Text>
        {isSelectionMode ? (
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done ({selectedPapers.length})</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddPaper')}
          >
            <Ionicons name="add" size={18} color="#4f5ef7" />
            <Text style={styles.addButtonText}>Add Paper</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filterContainer}>
        {renderFilterButton('recent', 'Recent')}
        {renderFilterButton('read', 'Read')}
        {renderFilterButton('unread', 'Unread')}
        {renderFilterButton('cited', 'Cited')}
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#bbb" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search papers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={getFilteredPapers()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePaperPress(item)}
            onLongPress={() => {
              if (onSelect && !isSelectionMode) {
                setIsSelectionMode(true);
                togglePaperSelection(item);
              }
            }}
          >
            <PaperItem
              item={item}
              onPress={() => handlePaperPress(item)}
              onStar={() => toggleStar(item.id)}
              onDownload={() => handleDownload(item)}
              onMore={() => handleMore(item)}
              isSelected={isSelectionMode && selectedPapers.some(p => p.id === item.id)}
              showCheckbox={isSelectionMode}
            />
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No papers found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery ? 'Try a different search term' : 'Add papers to your library'}
            </Text>
          </View>
        }
      />
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Paper Details</Text>
            {selectedPaper && (
              <>
                <Text style={styles.modalLabel}>Title:</Text>
                <Text style={styles.modalValue}>{selectedPaper.title}</Text>
                <Text style={styles.modalLabel}>Authors:</Text>
                <Text style={styles.modalValue}>{selectedPaper.authors}</Text>
                <Text style={styles.modalLabel}>Source:</Text>
                <Text style={styles.modalValue}>{selectedPaper.source}</Text>
                <Text style={styles.modalLabel}>Year:</Text>
                <Text style={styles.modalValue}>{selectedPaper.year}</Text>
                <Text style={styles.modalLabel}>Pages:</Text>
                <Text style={styles.modalValue}>{selectedPaper.pages}</Text>
                <Text style={styles.modalLabel}>Tag:</Text>
                <Text style={styles.modalValue}>{selectedPaper.tag}</Text>
                <Text style={styles.modalLabel}>Collection:</Text>
                <Text style={styles.modalValue}>{selectedPaper.collection}</Text>
                <Text style={styles.modalLabel}>DOI:</Text>
                <Text style={styles.modalValue}>{selectedPaper.doi || 'N/A'}</Text>
              </>
            )}
            <Pressable style={styles.modalCloseButton} onPress={() => setDetailsModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={moveModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move Paper</Text>
            {selectedPaper && (
              <>
                <Text style={styles.modalLabel}>Title:</Text>
                <Text style={styles.modalValue}>{selectedPaper.title}</Text>
                <Text style={styles.modalLabel}>Move to Collection:</Text>
                {collections.map(collection => (
                  <TouchableOpacity
                    key={collection}
                    style={styles.collectionButton}
                    onPress={() => handleMoveToCollection(collection)}
                  >
                    <Text style={styles.collectionButtonText}>{collection}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <Pressable style={styles.modalCloseButton} onPress={() => setMoveModalVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7eaff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#4f5ef7',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  activeFilterButton: {
    backgroundColor: '#4f5ef7',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#4f5ef7',
    marginTop: 8,
  },
  modalValue: {
    color: '#222',
    marginBottom: 2,
  },
  modalCloseButton: {
    marginTop: 18,
    backgroundColor: '#4f5ef7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  collectionButton: {
    backgroundColor: '#e7eaff',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  collectionButtonText: {
    color: '#4f5ef7',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7eaff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneButtonText: {
    color: '#4f5ef7',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
});

export default LibraryScreen;