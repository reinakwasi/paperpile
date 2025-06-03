import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ActionSheetIOS, Platform, SectionList, Image } from 'react-native';
import Header from '../components/Header';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import PaperItem from '../components/PaperItem';
import * as FileSystem from 'expo-file-system';

const filters = [
  { label: 'All', icon: 'apps' },
  { label: 'Articles', icon: 'file-document-outline' },
  { label: 'Authors', icon: 'account-outline' },
  { label: 'Journals', icon: 'book-outline' },
];

const FavoritesScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState({
    articles: [],
    authors: [],
    journals: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Load favorites from AsyncStorage when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadFavorites = async () => {
        try {
          setLoading(true);
          const savedPapers = await AsyncStorage.getItem('papers');
          const savedAuthors = await AsyncStorage.getItem('favorite_authors');
          const savedJournals = await AsyncStorage.getItem('favorite_journals');
          
          if (savedPapers) {
            const parsedPapers = JSON.parse(savedPapers);
            // Filter only starred papers
            const starredPapers = parsedPapers.filter(paper => paper.starred);
            setFavorites(prev => ({ ...prev, articles: starredPapers }));
          } else {
            setFavorites(prev => ({ ...prev, articles: [] }));
          }
          
          if (savedAuthors) {
            const authors = JSON.parse(savedAuthors);
            setFavorites(prev => ({ ...prev, authors }));
          } else {
            setFavorites(prev => ({ ...prev, authors: [] }));
          }
          
          if (savedJournals) {
            const journals = JSON.parse(savedJournals);
            setFavorites(prev => ({ ...prev, journals }));
          } else {
            setFavorites(prev => ({ ...prev, journals: [] }));
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
        } finally {
          setLoading(false);
        }
      };
      loadFavorites();
    }, [])
  );

  // Toggle star handler for articles
  const toggleStar = async (id) => {
    try {
      const updatedArticles = favorites.articles.map(paper =>
        paper.id === id ? { ...paper, starred: !paper.starred } : paper
      );
      setFavorites(prev => ({ ...prev, articles: updatedArticles.filter(paper => paper.starred) }));
      
      // Update in AsyncStorage
      const allPapers = await AsyncStorage.getItem('papers');
      if (allPapers) {
        const parsedAllPapers = JSON.parse(allPapers);
        const updatedAllPapers = parsedAllPapers.map(paper =>
          paper.id === id ? { ...paper, starred: !paper.starred } : paper
        );
        await AsyncStorage.setItem('papers', JSON.stringify(updatedAllPapers));
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // Toggle favorite for authors
  const toggleAuthorFavorite = async (author) => {
    try {
      const updatedAuthors = favorites.authors.filter(a => a.id !== author.id);
      if (updatedAuthors.length === favorites.authors.length) {
        updatedAuthors.push(author);
      }
      setFavorites(prev => ({ ...prev, authors: updatedAuthors }));
      await AsyncStorage.setItem('favorite_authors', JSON.stringify(updatedAuthors));
    } catch (error) {
      console.error('Error toggling author favorite:', error);
    }
  };

  // Toggle favorite for journals
  const toggleJournalFavorite = async (journal) => {
    try {
      const updatedJournals = favorites.journals.filter(j => j.id !== journal.id);
      if (updatedJournals.length === favorites.journals.length) {
        updatedJournals.push(journal);
      }
      setFavorites(prev => ({ ...prev, journals: updatedJournals }));
      await AsyncStorage.setItem('favorite_journals', JSON.stringify(updatedJournals));
    } catch (error) {
      console.error('Error toggling journal favorite:', error);
    }
  };

  // Download handler
  const handleDownload = async (item) => {
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
      const updatedArticles = favorites.articles.map(paper => 
        paper.id === item.id ? { ...paper, localUri: uri } : paper
      );
      setFavorites(prev => ({ ...prev, articles: updatedArticles }));
      
      // Update in AsyncStorage
      const allPapers = await AsyncStorage.getItem('papers');
      if (allPapers) {
        const parsedAllPapers = JSON.parse(allPapers);
        const updatedAllPapers = parsedAllPapers.map(paper =>
          paper.id === item.id ? { ...paper, localUri: uri } : paper
        );
        await AsyncStorage.setItem('papers', JSON.stringify(updatedAllPapers));
      }
      
      Alert.alert('Success', 'PDF downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download PDF: ' + error.message);
    }
  };

  // Open PDF handler
  const handleOpenPDF = async (item) => {
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
        const updatedArticles = favorites.articles.map(paper => 
          paper.id === item.id ? { ...paper, localUri: uri } : paper
        );
        setFavorites(prev => ({ ...prev, articles: updatedArticles }));
        
        // Update in AsyncStorage
        const allPapers = await AsyncStorage.getItem('papers');
        if (allPapers) {
          const parsedAllPapers = JSON.parse(allPapers);
          const updatedAllPapers = parsedAllPapers.map(paper =>
            paper.id === item.id ? { ...paper, localUri: uri } : paper
          );
          await AsyncStorage.setItem('papers', JSON.stringify(updatedAllPapers));
        }
      }

      navigation.navigate('PDFViewer', { uri: uriToOpen, title: item.title });
    } catch (error) {
      Alert.alert('Error', 'Failed to open PDF: ' + error.message);
    }
  };

  // More handler
  const handleMore = (item) => {
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
            navigation.navigate('PaperDetail', { paper: item });
          }
          if (buttonIndex === 2) {
            // Handle move
          }
          if (buttonIndex === 3) {
            // Handle delete
          }
          if (buttonIndex === 4) {
            // Handle read status
          }
        }
      );
    } else {
      Alert.alert(
        item.title,
        '',
        [
          {
            text: 'Details',
            onPress: () => navigation.navigate('PaperDetail', { paper: item }),
          },
          {
            text: 'Move',
            onPress: () => {
              // Handle move
            },
          },
          { text: 'Delete', onPress: () => {
            // Handle delete
          }, style: 'destructive' },
          {
            text: item.readStatus === 'read' ? 'Mark as Unread' : 'Mark as Read',
            onPress: () => {
              // Handle read status
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Handle item press based on type
  const handleItemPress = (item, type) => {
    switch (type) {
      case 'article':
        if (item.pdfUrl || item.localUri) {
          handleOpenPDF(item);
        } else {
          navigation.navigate('PaperDetail', { paper: item });
        }
        break;
      case 'author':
        navigation.navigate('AuthorDetails', { author: item });
        break;
      case 'journal':
        navigation.navigate('JournalDetails', { journal: item });
        break;
    }
  };

  // Filter and organize data for SectionList
  const getFilteredSections = () => {
    const sections = [];
    
    // Filter based on search query
    const filterByQuery = (items) => {
      if (!searchQuery) return items;
      const query = searchQuery.toLowerCase();
      return items.filter(item => 
        (item.title || item.name || '').toLowerCase().includes(query) ||
        (item.authors || '').toLowerCase().includes(query)
      );
    };

    // Add articles section if active
    if (activeFilter === 'All' || activeFilter === 'Articles') {
      const filteredArticles = filterByQuery(favorites.articles);
      if (filteredArticles.length > 0) {
        sections.push({
          title: 'Articles',
          data: filteredArticles,
          type: 'article'
        });
      }
    }

    // Add authors section if active
    if (activeFilter === 'All' || activeFilter === 'Authors') {
      const filteredAuthors = filterByQuery(favorites.authors);
      if (filteredAuthors.length > 0) {
        sections.push({
          title: 'Authors',
          data: filteredAuthors,
          type: 'author'
        });
      }
    }

    // Add journals section if active
    if (activeFilter === 'All' || activeFilter === 'Journals') {
      const filteredJournals = filterByQuery(favorites.journals);
      if (filteredJournals.length > 0) {
        sections.push({
          title: 'Journals',
          data: filteredJournals,
          type: 'journal'
        });
      }
    }

    return sections;
  };

  // Render section header
  const renderSectionHeader = ({ section: { title, data } }) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{data.length}</Text>
      </View>
    );
  };

  // Render item based on type
  const renderItem = ({ item, section }) => {
    switch (section.type) {
      case 'article':
        return (
          <TouchableOpacity 
            onPress={() => handleItemPress(item, 'article')}
            activeOpacity={0.7}
          >
            <PaperItem
              item={item}
              onPress={() => handleItemPress(item, 'article')}
              onStar={() => toggleStar(item.id)}
              onDownload={() => handleDownload(item)}
              onMore={() => handleMore(item)}
            />
          </TouchableOpacity>
        );
      case 'author':
        return (
          <TouchableOpacity 
            style={styles.authorCard}
            onPress={() => handleItemPress(item, 'author')}
            activeOpacity={0.7}
          >
            <Image source={{ uri: item.avatar }} style={styles.authorAvatar} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.name}</Text>
              <Text style={styles.authorAffiliation}>{item.affiliation}</Text>
              <View style={styles.authorStats}>
                <Text style={styles.authorStat}>{item.paperCount} papers</Text>
                <Text style={styles.authorStat}>{item.citationCount} citations</Text>
                <Text style={styles.authorStat}>h-index: {item.hIndex}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={() => toggleAuthorFavorite(item)}
            >
              <Ionicons name="star" size={24} color="#FFD600" />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      case 'journal':
        return (
          <TouchableOpacity 
            style={styles.journalCard}
            onPress={() => handleItemPress(item, 'journal')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="book-open-variant" size={24} color={item.color || '#4f5ef7'} />
            <View style={styles.journalInfo}>
              <Text style={styles.journalName}>{item.name}</Text>
              <Text style={styles.journalStats}>
                {item.paperCount} papers • {item.citationCount} citations
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.favoriteButton}
              onPress={() => toggleJournalFavorite(item)}
            >
              <Ionicons name="star" size={24} color="#FFD600" />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f5ef7" />
      </View>
    );
  }

  const sections = getFilteredSections();

  return (
    <View style={{ flex: 1, backgroundColor: '#fafbfc' }}>
      <Header title="Favorites" />
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#bbb" style={{ marginLeft: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search favorites..."
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterIcon}>
          <Ionicons name="options-outline" size={20} color="#4f5ef7" />
        </TouchableOpacity>
      </View>
      <View style={styles.filterBar}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[styles.filterChip, activeFilter === filter.label && styles.filterChipActive]}
            onPress={() => setActiveFilter(filter.label)}
          >
            <MaterialCommunityIcons 
              name={filter.icon} 
              size={18} 
              color={activeFilter === filter.label ? '#fff' : '#888'} 
              style={{ marginRight: 4 }} 
            />
            <Text style={[styles.filterText, activeFilter === filter.label && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubText}>
              {activeFilter === 'All' 
                ? 'Star papers, authors, or journals to see them here'
                : `No ${activeFilter.toLowerCase()} in your favorites`}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
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
  filterIcon: {
    padding: 6,
    marginRight: 4,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#f2f2f2',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4f5ef7',
  },
  filterText: {
    color: '#888',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fafbfc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  sectionCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  authorAffiliation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  authorStats: {
    flexDirection: 'row',
  },
  authorStat: {
    fontSize: 12,
    color: '#888',
    marginRight: 12,
  },
  journalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  journalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  journalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  journalStats: {
    fontSize: 14,
    color: '#666',
  },
  favoriteButton: {
    padding: 8,
  },
});

export default FavoritesScreen;