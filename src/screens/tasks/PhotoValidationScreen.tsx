import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/forms/Input';
import PremiumGate from '../../components/premium/PremiumGate';
import { spacing, borderRadius } from '../../constants/theme';
import { AppDispatch, RootState } from '../../store/store';
import {
  fetchFamilyTasks,
  validateTask,
  selectTasks,
  selectTasksLoading,
} from '../../store/slices/tasksSlice';
import { selectFamilyMembers } from '../../store/slices/familySlice';
import { useTheme } from '../../contexts/ThemeContext';
import { getRoleLabel } from '../../utils/roleHelpers';

interface ValidationItem {
  taskId: string;
  taskTitle: string;
  assignedTo: string;
  assignedToName: string;
  completedAt?: string;
  photoUrl: string;
  points?: number;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

const PhotoValidationScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);
  
  const userProfile = useSelector((state: RootState) => state.auth.userProfile);
  const family = useSelector((state: RootState) => state.family.currentFamily);
  const tasks = useSelector(selectTasks);
  const isLoading = useSelector(selectTasksLoading);
  const familyMembers = useSelector(selectFamilyMembers);
  
  const [selectedItem, setSelectedItem] = useState<ValidationItem | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  
  const isManager = userProfile?.role === 'parent';
  const parentLabel = family ? getRoleLabel(family, 'parent', false) : 'Parent';
  const childLabel = family ? getRoleLabel(family, 'child', false) : 'Child';
  
  // Filter tasks that need validation
  const validationQueue = useMemo(() => {
    return tasks
      .filter(task => 
        task.status === 'completed' && 
        task.requiresPhoto && 
        task.photoUrl &&
        (!task.validationStatus || task.validationStatus === 'pending')
      )
      .map(task => {
        const member = familyMembers.find(m => m.id === task.assignedTo);
        return {
          taskId: task.id,
          taskTitle: task.title,
          assignedTo: task.assignedTo,
          assignedToName: member?.displayName || 'Unknown',
          completedAt: task.completedAt,
          photoUrl: task.photoUrl,
          points: task.points,
          category: task.category,
        } as ValidationItem;
      })
      .sort((a, b) => {
        // Sort by completion date, newest first
        if (!a.completedAt || !b.completedAt) return 0;
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });
  }, [tasks, familyMembers]);
  
  useEffect(() => {
    loadTasks();
  }, []);
  
  const loadTasks = useCallback(async () => {
    if (!family || !userProfile) return;
    
    try {
      await dispatch(fetchFamilyTasks({
        familyId: family.id,
        userId: userProfile.id,
      })).unwrap();
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [family, userProfile, dispatch]);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);
  
  const handleValidate = useCallback(async (approved: boolean) => {
    if (!selectedItem || !userProfile) return;
    
    setIsValidating(true);
    try {
      await dispatch(validateTask({
        taskId: selectedItem.taskId,
        validatorId: userProfile.id,
        approved,
        notes: validationNotes.trim(),
      })).unwrap();
      
      Alert.alert(
        'Success',
        `Task ${approved ? 'approved' : 'rejected'} successfully!`,
        [{ text: 'OK', onPress: () => {
          setSelectedItem(null);
          setValidationNotes('');
        }}]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate task');
    } finally {
      setIsValidating(false);
    }
  }, [selectedItem, userProfile, validationNotes, dispatch]);
  
  const renderValidationItem = (item: ValidationItem) => (
    <TouchableOpacity
      key={item.taskId}
      onPress={() => setSelectedItem(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.validationCard}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{item.category.icon}</Text>
            <Text style={[styles.categoryName, { color: item.category.color }]}>
              {item.category.name}
            </Text>
          </View>
          {item.points && (
            <View style={styles.pointsBadge}>
              <Feather name="star" size={14} color={theme.colors.warning} />
              <Text style={styles.pointsText}>{item.points}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.taskTitle}>{item.taskTitle}</Text>
        
        <View style={styles.assigneeInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.assignedToName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.assigneeDetails}>
            <Text style={styles.assigneeName}>{item.assignedToName}</Text>
            {item.completedAt && (
              <Text style={styles.completedTime}>
                Completed {new Date(item.completedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.photoPreview}>
          {imageLoading[item.taskId] && (
            <ActivityIndicator 
              style={styles.imageLoader} 
              color={theme.colors.primary} 
            />
          )}
          <Image 
            source={{ uri: item.photoUrl }} 
            style={styles.previewImage}
            onLoadStart={() => setImageLoading(prev => ({ ...prev, [item.taskId]: true }))}
            onLoadEnd={() => setImageLoading(prev => ({ ...prev, [item.taskId]: false }))}
          />
          <View style={styles.photoOverlay}>
            <Feather name="eye" size={20} color="#fff" />
            <Text style={styles.photoOverlayText}>Tap to review</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  const renderSelectedItemModal = () => {
    if (!selectedItem) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Task Completion</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedItem(null);
                setValidationNotes('');
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTaskTitle}>{selectedItem.taskTitle}</Text>
            
            <View style={styles.modalAssigneeInfo}>
              <Text style={styles.modalLabel}>Completed by:</Text>
              <Text style={styles.modalValue}>{selectedItem.assignedToName}</Text>
            </View>
            
            {selectedItem.completedAt && (
              <View style={styles.modalAssigneeInfo}>
                <Text style={styles.modalLabel}>Completed on:</Text>
                <Text style={styles.modalValue}>
                  {new Date(selectedItem.completedAt).toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={styles.fullImageContainer}>
              <Image 
                source={{ uri: selectedItem.photoUrl }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
            
            <Input
              label="Validation Notes (Optional)"
              value={validationNotes}
              onChangeText={setValidationNotes}
              placeholder="Add any feedback or notes..."
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
            
            <View style={styles.validationActions}>
              <Button
                title="Reject"
                variant="danger"
                onPress={() => handleValidate(false)}
                loading={isValidating}
                disabled={isValidating}
                style={styles.validationButton}
              />
              <Button
                title="Approve"
                variant="primary"
                onPress={() => handleValidate(true)}
                loading={isValidating}
                disabled={isValidating}
                style={styles.validationButton}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };
  
  if (!isManager) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Photo Validation</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.emptyContainer}>
          <Feather name="lock" size={48} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>Access Restricted</Text>
          <Text style={styles.emptyMessage}>
            Only {parentLabel}s can review and validate task photos.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <PremiumGate
      feature="photoValidation"
      isPremium={family?.isPremium || false}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Photo Validation Queue</Text>
          <View style={styles.queueBadge}>
            <Text style={styles.queueCount}>{validationQueue.length}</Text>
          </View>
        </View>
        
        {isLoading && validationQueue.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : validationQueue.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <Feather name="check-circle" size={48} color={theme.colors.success} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyMessage}>
              No tasks pending photo validation.
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <Text style={styles.sectionTitle}>
              Tasks Awaiting Validation ({validationQueue.length})
            </Text>
            {validationQueue.map(renderValidationItem)}
          </ScrollView>
        )}
        
        {renderSelectedItemModal()}
      </SafeAreaView>
    </PremiumGate>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.M,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  queueBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.S,
    paddingVertical: spacing.XXS,
    borderRadius: borderRadius.round,
    minWidth: 24,
    alignItems: 'center',
  },
  queueCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    padding: spacing.L,
    paddingBottom: spacing.XXL,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
  },
  validationCard: {
    marginBottom: spacing.M,
    padding: spacing.M,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.S,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XS,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.XXS,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.warning,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: spacing.M,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.S,
    marginBottom: spacing.M,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  assigneeDetails: {
    flex: 1,
  },
  assigneeName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  completedTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  photoPreview: {
    height: 150,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.textTertiary,
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
    zIndex: 1,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.S,
    paddingVertical: spacing.S,
  },
  photoOverlayText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.XL,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: spacing.M,
    marginBottom: spacing.S,
  },
  emptyMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.L,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.large,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.L,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: spacing.XS,
  },
  modalTaskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    padding: spacing.L,
    paddingBottom: spacing.S,
  },
  modalAssigneeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.L,
    paddingVertical: spacing.XS,
  },
  modalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  fullImageContainer: {
    margin: spacing.L,
    height: 300,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundTexture,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  notesInput: {
    marginHorizontal: spacing.L,
    marginBottom: spacing.M,
  },
  validationActions: {
    flexDirection: 'row',
    gap: spacing.M,
    padding: spacing.L,
    paddingTop: 0,
  },
  validationButton: {
    flex: 1,
  },
});

export default PhotoValidationScreen;