import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { PremiumGate, PremiumIndicator } from './PremiumGate';
import { useSelector } from 'react-redux';
import { selectActiveFamily } from '../../store/slices/familySlice';
import { selectCurrentUser } from '../../store/slices/userSlice';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as Haptics from 'expo-haptics';
import * as Sentry from '@sentry/react-native';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  createdBy: string;
  createdAt: any;
  isCustom: boolean;
  familyId: string;
}

const ICON_OPTIONS = [
  'home', 'school', 'fitness', 'book', 'musical-notes',
  'brush', 'football', 'restaurant', 'cart', 'construct',
  'leaf', 'paw', 'game-controller', 'desktop', 'car',
  'airplane', 'bicycle', 'boat', 'bus', 'train',
];

const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#FFB6C1', '#87CEEB', '#F4A460',
  '#9370DB', '#20B2AA', '#FF69B4', '#00CED1', '#FF8C00',
];

export const CustomCategories: React.FC = () => {
  const theme = useTheme();
  const activeFamily = useSelector(selectActiveFamily);
  const currentUser = useSelector(selectCurrentUser);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeFamily?.id) return;

    // Subscribe to custom categories for the family
    const q = query(
      collection(db, 'categories'),
      where('familyId', '==', activeFamily.id),
      where('isCustom', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Category));
        setCategories(cats);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        Sentry.captureException(error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeFamily?.id]);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!activeFamily?.id || !currentUser?.uid) {
      Alert.alert('Error', 'Unable to add category. Please try again.');
      return;
    }

    setIsSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const categoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
        icon: selectedIcon,
        color: selectedColor,
        isCustom: true,
        familyId: activeFamily.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      };

      if (editingCategory) {
        // Update existing category
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          ...categoryData,
          createdAt: editingCategory.createdAt, // Preserve original creation date
        });
      } else {
        // Add new category
        await addDoc(collection(db, 'categories'), categoryData);
      }

      // Reset form
      setCategoryName('');
      setCategoryDescription('');
      setSelectedIcon(ICON_OPTIONS[0]);
      setSelectedColor(COLOR_OPTIONS[0]);
      setEditingCategory(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
      Sentry.captureException(error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setSelectedIcon(category.icon);
    setSelectedColor(category.color);
    setShowAddModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteDoc(doc(db, 'categories', category.id));
            } catch (error) {
              console.error('Error deleting category:', error);
              Sentry.captureException(error);
              Alert.alert('Error', 'Failed to delete category. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <ScrollView
        style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.modalContent}
      >
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            {editingCategory ? 'Edit Category' : 'Add Custom Category'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Category Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={categoryName}
            onChangeText={setCategoryName}
            placeholder="e.g., Music Practice"
            placeholderTextColor={theme.colors.text + '66'}
            maxLength={30}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Description (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.colors.card,
                color: theme.colors.text,
                borderColor: theme.colors.border,
              },
            ]}
            value={categoryDescription}
            onChangeText={setCategoryDescription}
            placeholder="Brief description of this category"
            placeholderTextColor={theme.colors.text + '66'}
            multiline
            numberOfLines={3}
            maxLength={100}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Choose Icon
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconSelector}
          >
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[
                  styles.iconOption,
                  {
                    backgroundColor:
                      selectedIcon === icon
                        ? theme.colors.primary
                        : theme.colors.card,
                  },
                ]}
                onPress={() => setSelectedIcon(icon)}
              >
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={selectedIcon === icon ? '#FFFFFF' : theme.colors.text}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Choose Color
          </Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.preview}>
          <Text style={[styles.previewLabel, { color: theme.colors.text }]}>
            Preview
          </Text>
          <View
            style={[
              styles.previewCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <View
              style={[
                styles.previewIcon,
                { backgroundColor: selectedColor + '20' },
              ]}
            >
              <Ionicons
                name={selectedIcon as any}
                size={28}
                color={selectedColor}
              />
            </View>
            <View style={styles.previewTextContainer}>
              <Text style={[styles.previewName, { color: theme.colors.text }]}>
                {categoryName || 'Category Name'}
              </Text>
              {categoryDescription ? (
                <Text style={[styles.previewDescription, { color: theme.colors.text + '99' }]}>
                  {categoryDescription}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: isSaving || !categoryName.trim() ? 0.5 : 1,
            },
          ]}
          onPress={handleAddCategory}
          disabled={isSaving || !categoryName.trim()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Custom Categories
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text + '99' }]}>
              Create personalized task categories for your family
            </Text>
          </View>
          <PremiumIndicator />
        </View>

        <ScrollView style={styles.categoriesList}>
          {categories.map((category) => (
            <View
              key={category.id}
              style={[styles.categoryCard, { backgroundColor: theme.colors.card }]}
            >
              <View style={styles.categoryContent}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color + '20' },
                  ]}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={24}
                    color={category.color}
                  />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                    {category.name}
                  </Text>
                  {category.description && (
                    <Text style={[styles.categoryDescription, { color: theme.colors.text + '99' }]}>
                      {category.description}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditCategory(category)}
                >
                  <Ionicons name="pencil" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteCategory(category)}
                >
                  <Ionicons name="trash" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {categories.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={48} color={theme.colors.text + '66'} />
              <Text style={[styles.emptyText, { color: theme.colors.text + '99' }]}>
                No custom categories yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.text + '66' }]}>
                Create your first category to get started
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            setEditingCategory(null);
            setCategoryName('');
            setCategoryDescription('');
            setSelectedIcon(ICON_OPTIONS[0]);
            setSelectedColor(COLOR_OPTIONS[0]);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {renderAddModal()}
      </>
    );
  };

  return (
    <PremiumGate
      feature="custom_categories"
      featureName="Custom Categories"
      featureDescription="Create personalized task categories tailored to your family's unique needs and activities."
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderContent()}
      </View>
    </PremiumGate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconSelector: {
    marginTop: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  preview: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  saveButton: {
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
