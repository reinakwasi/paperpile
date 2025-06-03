import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultAvatar = 'https://randomuser.me/api/portraits/men/32.jpg';

const SearchResultCard = ({ item, type, onStar }) => {
  const handleStar = async () => {
    try {
      switch (type) {
        case 'article':
          // Update papers in AsyncStorage
          const savedPapers = await AsyncStorage.getItem('papers');
          let papers = savedPapers ? JSON.parse(savedPapers) : [];
          const paperExists = papers.some(p => p.id === item.id);
          
          if (paperExists) {
            // Toggle star status of existing paper
            papers = papers.map(paper =>
              paper.id === item.id ? { ...paper, starred: !paper.starred } : paper
            );
          } else {
            // Add new paper with starred status
            papers.push({ ...item, starred: true });
          }
          await AsyncStorage.setItem('papers', JSON.stringify(papers));
          break;

        case 'author':
          // Update favorite authors in AsyncStorage
          const savedAuthors = await AsyncStorage.getItem('favorite_authors');
          let authors = savedAuthors ? JSON.parse(savedAuthors) : [];
          const authorExists = authors.some(a => a.id === item.id);
          
          if (authorExists) {
            authors = authors.filter(a => a.id !== item.id);
          } else {
            authors.push(item);
          }
          await AsyncStorage.setItem('favorite_authors', JSON.stringify(authors));
          break;

        case 'journal':
          // Update favorite journals in AsyncStorage
          const savedJournals = await AsyncStorage.getItem('favorite_journals');
          let journals = savedJournals ? JSON.parse(savedJournals) : [];
          const journalExists = journals.some(j => j.id === item.id);
          
          if (journalExists) {
            journals = journals.filter(j => j.id !== item.id);
          } else {
            journals.push(item);
          }
          await AsyncStorage.setItem('favorite_journals', JSON.stringify(journals));
          break;
      }

      // Call the onStar callback if provided
      if (onStar) {
        onStar(item);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderArticleCard = () => (
    <View style={styles.card}>
      <View style={styles.articleHeader}>
        <View style={[styles.tag, { backgroundColor: item.tagColor + '22' }]}>
          <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
        </View>
        {item.open && (
          <View style={[styles.tag, { backgroundColor: '#2ecc7122' }]}>
            <Text style={[styles.tagText, { color: '#2ecc71' }]}>Open Access</Text>
          </View>
        )}
        <TouchableOpacity style={styles.starButton} onPress={handleStar}>
          <Ionicons 
            name={item.starred ? "star" : "star-outline"} 
            size={20} 
            color={item.starred ? "#FFD600" : "#888"} 
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.authors} numberOfLines={1}>{item.authors}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.journal}</Text>
        <Text style={styles.metaText}>•</Text>
        <Text style={styles.metaText}>{item.year}</Text>
        {item.citations > 0 && (
          <>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{item.citations} citations</Text>
          </>
        )}
      </View>
      {item.abstract && (
        <Text style={styles.abstract} numberOfLines={2}>{item.abstract}</Text>
      )}
    </View>
  );

  const renderAuthorCard = () => (
    <View style={styles.card}>
      <View style={styles.authorHeader}>
        <Image source={{ uri: item.avatar }} style={styles.authorAvatar} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.name}</Text>
          <Text style={styles.affiliation}>{item.affiliation}</Text>
        </View>
        <TouchableOpacity style={styles.starButton} onPress={handleStar}>
          <Ionicons 
            name={item.starred ? "star" : "star-outline"} 
            size={20} 
            color={item.starred ? "#FFD600" : "#888"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.paperCount}</Text>
          <Text style={styles.statLabel}>Papers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.citationCount}</Text>
          <Text style={styles.statLabel}>Citations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.hIndex}</Text>
          <Text style={styles.statLabel}>h-index</Text>
        </View>
      </View>
    </View>
  );

  const renderJournalCard = () => (
    <View style={styles.card}>
      <View style={styles.journalHeader}>
        <MaterialCommunityIcons name="book-outline" size={24} color={item.tagColor} />
        <View style={styles.journalInfo}>
          <Text style={styles.journalName}>{item.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Impact Factor: {item.impact}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{item.paperCount} papers</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{item.citationCount} citations</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.starButton} onPress={handleStar}>
          <Ionicons 
            name={item.starred ? "star" : "star-outline"} 
            size={20} 
            color={item.starred ? "#FFD600" : "#888"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  switch (type) {
    case 'article':
      return renderArticleCard();
    case 'author':
      return renderAuthorCard();
    case 'journal':
      return renderJournalCard();
    default:
      return renderArticleCard();
  }
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  articleHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  authors: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 13,
    color: '#888',
    marginRight: 4,
  },
  abstract: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  affiliation: {
    fontSize: 13,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  journalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  starButton: {
    marginLeft: 'auto',
    padding: 4,
  },
});

export default SearchResultCard; 