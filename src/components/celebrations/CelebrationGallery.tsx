/**
 * CelebrationGallery Component
 * Photo/video gallery for celebrations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../constants/themeExtended';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedBy: string;
  uploadedAt: Date;
  celebrationId: string;
}

interface CelebrationGalleryProps {
  media: MediaItem[];
  title?: string;
  columns?: number;
  showCaptions?: boolean;
  onMediaPress?: (item: MediaItem) => void;
  onAddMedia?: () => void;
}

const CelebrationGallery: React.FC<CelebrationGalleryProps> = ({
  media,
  title = 'Celebration Gallery',
  columns = 3,
  showCaptions = false,
  onMediaPress,
  onAddMedia,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  const itemSize = (SCREEN_WIDTH - spacing.md * 2 - spacing.xs * (columns - 1)) / columns;

  const handleMediaPress = (item: MediaItem) => {
    if (onMediaPress) {
      onMediaPress(item);
    } else {
      setSelectedMedia(item);
      setModalVisible(true);
    }
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => {
    const isVideo = item.type === 'video';
    const isLoading = imageLoading[item.id];

    return (
      <TouchableOpacity
        style={[
          styles.mediaItem,
          {
            width: itemSize,
            height: itemSize,
          },
        ]}
        onPress={() => handleMediaPress(item)}
        activeOpacity={0.9}
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.white} />
          </View>
        )}
        
        <Image
          source={{ uri: item.thumbnailUrl || item.url }}
          style={styles.mediaImage}
          onLoadStart={() => setImageLoading(prev => ({ ...prev, [item.id]: true }))}
          onLoadEnd={() => setImageLoading(prev => ({ ...prev, [item.id]: false }))}
        />
        
        {isVideo && (
          <View style={styles.videoOverlay}>
            <Icon name="play-circle" size={24} color={colors.white} />
          </View>
        )}
        
        {showCaptions && item.caption && (
          <View style={styles.captionOverlay}>
            <Text style={styles.captionText} numberOfLines={2}>
              {item.caption}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {onAddMedia && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddMedia}
        >
          <Icon name="plus" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="image" size={48} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No Media Yet</Text>
      <Text style={styles.emptyText}>
        Celebrate your achievements with photos and videos!
      </Text>
      {onAddMedia && (
        <TouchableOpacity
          style={styles.addMediaButton}
          onPress={onAddMedia}
        >
          <Icon name="camera" size={20} color={colors.white} />
          <Text style={styles.addMediaButtonText}>Add Media</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMediaModal = () => {
    if (!selectedMedia) return null;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Icon name="x" size={24} color={colors.white} />
          </TouchableOpacity>

          <View style={styles.modalContent}>
            {selectedMedia.type === 'photo' ? (
              <Image
                source={{ uri: selectedMedia.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.videoContainer}>
                <Icon name="play-circle" size={64} color={colors.white} />
                <Text style={styles.videoText}>Video playback coming soon</Text>
              </View>
            )}

            {selectedMedia.caption && (
              <View style={styles.modalCaption}>
                <Text style={styles.modalCaptionText}>
                  {selectedMedia.caption}
                </Text>
                <Text style={styles.modalMeta}>
                  by {selectedMedia.uploadedBy}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (media.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={media}
        renderItem={renderMediaItem}
        keyExtractor={item => item.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />

      {renderMediaModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: colors.text,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    paddingBottom: spacing.xs,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  mediaItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  videoOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.xs,
  },
  captionText: {
    ...typography.caption,
    color: colors.white,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.gray700,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  addMediaButtonText: {
    ...typography.bodySemibold,
    color: colors.white,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: spacing.sm,
  },
  modalContent: {
    width: SCREEN_WIDTH,
    maxHeight: SCREEN_HEIGHT * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  videoText: {
    ...typography.body,
    color: colors.white,
    marginTop: spacing.md,
  },
  modalCaption: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.md,
    borderRadius: 12,
  },
  modalCaptionText: {
    ...typography.body,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  modalMeta: {
    ...typography.caption,
    color: colors.gray300,
  },
});

export default CelebrationGallery;