// src/screens/SearchScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, SectionList, Alert, Linking } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import SearchResultCard from '../components/SearchResultCard';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';

const filters = [
  { label: 'All', icon: 'apps' },
  { label: 'Articles', icon: 'file-document-outline' },
  { label: 'Authors', icon: 'account-outline' },
  { label: 'Journals', icon: 'book-outline' },
];

const RECENT_SEARCHES_KEY = '@PaperStack:recentSearches';
const MAX_RECENT_SEARCHES = 5;

// API endpoints
const ARXIV_API = 'https://export.arxiv.org/api/query';

// Custom debounce hook
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Simple XML parser for React Native
const extractTagContent = (xml, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
};

const extractAuthors = (xml) => {
  const authorRegex = /<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs;
  const authors = [];
  let match;
  while ((match = authorRegex.exec(xml)) !== null) {
    authors.push(match[1].trim());
  }
  return authors;
};

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    articles: [],
    authors: [],
    journals: []
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Load favorite states when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadFavoriteStates = async () => {
        try {
          // Load favorite papers
          const savedPapers = await AsyncStorage.getItem('papers');
          if (savedPapers) {
            const papers = JSON.parse(savedPapers);
            const starredPaperIds = new Set(papers.filter(p => p.starred).map(p => p.id));
            
            // Update search results with starred state
            setSearchResults(prev => ({
              ...prev,
              articles: prev.articles.map(article => ({
                ...article,
                starred: starredPaperIds.has(article.id)
              }))
            }));
          }

          // Load favorite authors
          const savedAuthors = await AsyncStorage.getItem('favorite_authors');
          if (savedAuthors) {
            const authors = JSON.parse(savedAuthors);
            const starredAuthorIds = new Set(authors.map(a => a.id));
            
            // Update search results with starred state
            setSearchResults(prev => ({
              ...prev,
              authors: prev.authors.map(author => ({
                ...author,
                starred: starredAuthorIds.has(author.id)
              }))
            }));
          }

          // Load favorite journals
          const savedJournals = await AsyncStorage.getItem('favorite_journals');
          if (savedJournals) {
            const journals = JSON.parse(savedJournals);
            const starredJournalIds = new Set(journals.map(j => j.id));
            
            // Update search results with starred state
            setSearchResults(prev => ({
              ...prev,
              journals: prev.journals.map(journal => ({
                ...journal,
                starred: starredJournalIds.has(journal.id)
              }))
            }));
          }
        } catch (error) {
          console.error('Error loading favorite states:', error);
        }
      };
      loadFavoriteStates();
    }, [])
  );

  const loadRecentSearches = async () => {
    try {
      const savedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (search) => {
    try {
      const updatedSearches = [search, ...recentSearches.filter(s => s.label !== search.label)]
        .slice(0, MAX_RECENT_SEARCHES);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
      setRecentSearches(updatedSearches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const searchPapers = async (query) => {
    try {
      const response = await fetch(
        `${ARXIV_API}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=20&sortBy=relevance&sortOrder=descending`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const xmlData = await response.text();
      const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      const results = [];

      for (const entry of entries) {
        const id = extractTagContent(entry, 'id').split('/').pop();
        const title = extractTagContent(entry, 'title').replace(/\n/g, ' ').trim();
        const authors = extractAuthors(entry).join(', ');
        const published = new Date(extractTagContent(entry, 'published'));
        const summary = extractTagContent(entry, 'summary').replace(/\n/g, ' ').trim();
        const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
        const categories = extractTagContent(entry, 'arxiv:primary_category')?.split('.') || [];
        const journal = categories[0] || 'arXiv';

        results.push({
          id,
          type: 'Article',
          tag: 'Article',
          tagColor: '#4f5ef7',
          title,
          authors,
          journal,
          year: published.getFullYear().toString(),
          open: true,
          abstract: summary,
          citations: 0,
          url: pdfUrl,
        });
      }

      return results;
    } catch (error) {
      console.error('Error searching papers:', error);
      Alert.alert(
        'Search Error',
        error.message || 'Failed to search papers. Please try again.'
      );
      return [];
    }
  };

  const searchAuthors = async (query) => {
    try {
      const response = await fetch(
        `${ARXIV_API}?search_query=au:${encodeURIComponent(query)}&start=0&max_results=50`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const xmlData = await response.text();
      const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      const authorMap = new Map();

      for (const entry of entries) {
        const authors = extractAuthors(entry);
        const categories = extractTagContent(entry, 'arxiv:primary_category')?.split('.') || [];
        const journal = categories[0] || 'arXiv';
        
        for (const name of authors) {
          if (!authorMap.has(name)) {
            authorMap.set(name, {
              id: name.toLowerCase().replace(/\s+/g, '-'),
              type: 'Author',
              tag: 'Author',
              tagColor: '#2ecc71',
              name,
              affiliation: journal,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
              paperCount: 1,
              citationCount: 0,
              hIndex: 0,
            });
          } else {
            const authorData = authorMap.get(name);
            authorData.paperCount += 1;
          }
        }
      }

      return Array.from(authorMap.values());
    } catch (error) {
      console.error('Error searching authors:', error);
      Alert.alert(
        'Search Error',
        error.message || 'Failed to search authors. Please try again.'
      );
      return [];
    }
  };

  const searchVenues = async (query) => {
    try {
      const response = await fetch(
        `${ARXIV_API}?search_query=all:${encodeURIComponent(query)}&start=0&max_results=50`
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const xmlData = await response.text();
      const entries = xmlData.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      const venueMap = new Map();

      for (const entry of entries) {
        const categories = extractTagContent(entry, 'arxiv:primary_category')?.split('.') || [];
        const journal = categories[0] || 'arXiv';
        
        if (!venueMap.has(journal)) {
          venueMap.set(journal, {
            id: journal.toLowerCase().replace(/\s+/g, '-'),
            type: 'Journal',
            tag: 'Journal',
            tagColor: '#f4d03f',
            name: journal,
            impact: 'N/A',
            paperCount: 1,
            citationCount: 0,
            url: `https://arxiv.org/list/${journal}/recent`,
          });
        } else {
          const venueData = venueMap.get(journal);
          venueData.paperCount += 1;
        }
      }

      return Array.from(venueMap.values());
    } catch (error) {
      console.error('Error searching venues:', error);
      Alert.alert(
        'Search Error',
        error.message || 'Failed to search journals. Please try again.'
      );
      return [];
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({ articles: [], authors: [], journals: [] });
      return;
    }

    setIsLoading(true);
    try {
      let results = {
        articles: [],
        authors: [],
        journals: []
      };
      
      // Always search all categories to get complete results
      results.articles = await searchPapers(query);
      results.authors = await searchAuthors(query);
      results.journals = await searchVenues(query);

      // Load favorite states and update results
      const savedPapers = await AsyncStorage.getItem('papers');
      const savedAuthors = await AsyncStorage.getItem('favorite_authors');
      const savedJournals = await AsyncStorage.getItem('favorite_journals');

      // Update articles with starred state
      if (savedPapers) {
        const papers = JSON.parse(savedPapers);
        const starredPaperIds = new Set(papers.filter(p => p.starred).map(p => p.id));
        results.articles = results.articles.map(article => ({
          ...article,
          starred: starredPaperIds.has(article.id)
        }));
      }

      // Update authors with starred state
      if (savedAuthors) {
        const authors = JSON.parse(savedAuthors);
        const starredAuthorIds = new Set(authors.map(a => a.id));
        results.authors = results.authors.map(author => ({
          ...author,
          starred: starredAuthorIds.has(author.id)
        }));
      }

      // Update journals with starred state
      if (savedJournals) {
        const journals = JSON.parse(savedJournals);
        const starredJournalIds = new Set(journals.map(j => j.id));
        results.journals = results.journals.map(journal => ({
          ...journal,
          starred: starredJournalIds.has(journal.id)
        }));
      }

      setSearchResults(results);
      
      // Save to recent searches if we got results
      if (results.articles.length > 0 || results.authors.length > 0 || results.journals.length > 0) {
        saveRecentSearch({
          label: query,
          color: '#4f5ef7',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ articles: [], authors: [], journals: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = useDebounce((query) => {
    performSearch(query);
  }, 500);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    performSearch(searchQuery);
  };

  const handleResultPress = (item, type) => {
    switch (type) {
      case 'article':
        // Open the PDF URL in a web view or browser
        Linking.openURL(item.url);
        break;
      case 'author':
        // Navigate to author details
        navigation.navigate('AuthorDetails', { author: item });
        break;
      case 'journal':
        // Open journal URL in a web view or browser
        Linking.openURL(item.url);
        break;
    }
  };

  // Handle star toggle
  const handleStar = (item) => {
    setSearchResults(prev => ({
      ...prev,
      articles: prev.articles.map(article => 
        article.id === item.id ? { ...article, starred: !article.starred } : article
      ),
      authors: prev.authors.map(author => 
        author.id === item.id ? { ...author, starred: !author.starred } : author
      ),
      journals: prev.journals.map(journal => 
        journal.id === item.id ? { ...journal, starred: !journal.starred } : journal
      )
    }));
  };

  const renderSectionHeader = ({ section: { title, data } }) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{data.length} results</Text>
      </View>
    );
  };

  const getFilteredSections = () => {
    const sections = [
      {
        title: 'Articles',
        data: searchResults.articles,
        renderItem: ({ item }) => (
          <TouchableOpacity
            onPress={() => handleResultPress(item, 'article')}
            activeOpacity={0.7}
          >
            <SearchResultCard
              item={item}
              type="article"
              onStar={handleStar}
            />
          </TouchableOpacity>
        )
      },
      {
        title: 'Authors',
        data: searchResults.authors,
        renderItem: ({ item }) => (
          <TouchableOpacity
            onPress={() => handleResultPress(item, 'author')}
            activeOpacity={0.7}
          >
            <SearchResultCard
              item={item}
              type="author"
              onStar={handleStar}
            />
          </TouchableOpacity>
        )
      },
      {
        title: 'Journals',
        data: searchResults.journals,
        renderItem: ({ item }) => (
          <TouchableOpacity
            onPress={() => handleResultPress(item, 'journal')}
            activeOpacity={0.7}
          >
            <SearchResultCard
              item={item}
              type="journal"
              onStar={handleStar}
            />
          </TouchableOpacity>
        )
      }
    ];

    // Filter sections based on active filter
    if (activeFilter !== 'All') {
      return sections.filter(section => section.title === activeFilter);
    }

    return sections;
  };

  return (
    <View style={styles.container}>
      <Header title="Search" onMenuPress={() => navigation.openDrawer()} />
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search papers, authors, or journals..."
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.label}
              style={[styles.filterChip, activeFilter === filter.label && styles.filterChipActive]}
              onPress={() => handleFilterChange(filter.label)}
            >
              <MaterialCommunityIcons name={filter.icon} size={18} color={activeFilter === filter.label ? '#fff' : '#888'} style={{ marginRight: 4 }} />
              <Text style={[styles.filterText, activeFilter === filter.label && styles.filterTextActive]}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <>
          <View style={styles.recentRow}>
            <Text style={styles.recentTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentChipsRow}>
            {recentSearches.map((item) => (
              <TouchableOpacity 
                key={item.label} 
                style={[styles.recentChip, { backgroundColor: item.color + '22' }]}
                onPress={() => handleSearchChange(item.label)}
              >
                <Text style={[styles.recentChipText, { color: item.color }]}>{item.label}</Text>
                <Ionicons name="open-outline" size={14} color={item.color} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Search Results */}
      {searchQuery && (
        <>
          <View style={styles.resultsRow}>
            <Text style={styles.resultsForText}>
              Showing results for "<Text style={{ color: '#4f5ef7' }}>{searchQuery}</Text>"
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f5ef7" />
            </View>
          ) : (
            <SectionList
              sections={getFilteredSections()}
              renderItem={({ item, section }) => (
                <TouchableOpacity
                  onPress={() => handleResultPress(item, section.type)}
                  activeOpacity={0.7}
                >
                  <SearchResultCard
                    item={item}
                    type={section.type}
                    onStar={handleStar}
                  />
                </TouchableOpacity>
              )}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 16 }}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubText}>Try adjusting your search query</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    marginTop: 8,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
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
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 2,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
  },
  clearText: {
    color: '#4f5ef7',
    fontWeight: 'bold',
    fontSize: 13,
  },
  recentChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  recentChipText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 2,
  },
  resultsForText: {
    color: '#888',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fafbfc',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  sectionCount: {
    fontSize: 13,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#888',
  },
});

export default SearchScreen;