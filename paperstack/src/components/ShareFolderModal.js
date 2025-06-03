import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Share,
  Clipboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

const ShareFolderModal = ({ visible, onClose, folder }) => {
  const [copied, setCopied] = useState(false);

  const generateShareLink = () => {
    // In a real app, this would generate a unique link with the folder ID
    return `https://paperstack.app/folder/${folder.id}`;
  };

  const handleShare = async () => {
    try {
      const link = generateShareLink();
      await Share.share({
        message: `Check out this folder "${folder.name}" on PaperStack: ${link}`,
        url: link
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share folder');
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = generateShareLink();
      await Clipboard.setString(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Folder</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#222" />
            </TouchableOpacity>
          </View>

          <View style={styles.folderInfo}>
            <Text style={styles.folderName}>{folder.name}</Text>
            <Text style={styles.folderMeta}>{folder.count} papers</Text>
          </View>

          <View style={styles.linkContainer}>
            <TextInput
              style={styles.linkInput}
              value={generateShareLink()}
              editable={false}
            />
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
            >
              <Text style={styles.copyButtonText}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share Link</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Anyone with the link can view this folder. They can request access to collaborate.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  folderInfo: {
    marginBottom: 20,
  },
  folderName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  folderMeta: {
    fontSize: 14,
    color: '#666',
  },
  linkContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  linkInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    color: '#666',
  },
  copyButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#4f5ef7',
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#4f5ef7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default ShareFolderModal; 