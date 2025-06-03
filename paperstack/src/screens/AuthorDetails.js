import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const AuthorDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { author } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState([]);

  useEffect(() => {
    loadAuthorPapers();
  }, []);

  const loadAuthorPapers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://export.arxiv.org/api/query?search_query=au:${encodeURIComponent(author.name)}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch papers');
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

        results.push({
          id,
          title,
          authors,
          year: published.getFullYear().toString(),
          abstract: summary,
          url: pdfUrl,
        });
      }

      setPapers(results);
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handlePaperPress = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Author Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Author Header */}
        <View style={styles.authorHeader}>
          <Image
            source={{ uri: author.avatar }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{author.name}</Text>
            <Text style={styles.affiliation}>{author.affiliation}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{author.paperCount}</Text>
                <Text style={styles.statLabel}>Papers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{author.citationCount}</Text>
                <Text style={styles.statLabel}>Citations</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{author.hIndex}</Text>
                <Text style={styles.statLabel}>h-index</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Papers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Papers</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#4f5ef7" style={styles.loader} />
          ) : (
            papers.map((paper) => (
              <TouchableOpacity
                key={paper.id}
                style={styles.paperCard}
                onPress={() => handlePaperPress(paper.url)}
              >
                <Text style={styles.paperTitle}>{paper.title}</Text>
                <Text style={styles.paperAuthors}>{paper.authors}</Text>
                <Text style={styles.paperYear}>{paper.year}</Text>
                <Text style={styles.paperAbstract} numberOfLines={2}>
                  {paper.abstract}
                </Text>
                <View style={styles.paperFooter}>
                  <MaterialCommunityIcons name="file-pdf-box" size={20} color="#4f5ef7" />
                  <Text style={styles.paperLink}>View PDF</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  content: {
    flex: 1,
  },
  authorHeader: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  authorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  affiliation: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f5ef7',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  loader: {
    marginTop: 20,
  },
  paperCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  paperAuthors: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paperYear: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  paperAbstract: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  paperFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paperLink: {
    fontSize: 14,
    color: '#4f5ef7',
    marginLeft: 4,
  },
});

export default AuthorDetails; 