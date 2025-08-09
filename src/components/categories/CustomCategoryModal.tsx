import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Modal from '../common/Modal';
import Input from '../forms/Input';
import Button from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { TaskCategory } from '../../types/models';

interface CustomCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (category: Omit<TaskCategory, 'id'>) => void;
  existingCategories: TaskCategory[];
  editingCategory?: TaskCategory;
}

const PRESET_COLORS = [
  '#10B981', // Green
  '#3B82F6', // Blue
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6B7280', // Gray
  '#84CC16', // Lime
];

const PRESET_ICONS = [
  'home',
  'briefcase',
  'book',
  'heart',
  'star',
  'flag',
  'shopping-cart',
  'gift',
  'music',
  'camera',
  'coffee',
  'sun',
];

const CustomCategoryModal: React.FC<CustomCategoryModalProps> = ({
  visible,
  onClose,
  onSave,
  existingCategories,
  editingCategory,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [name, setName] = useState(editingCategory?.name || '');
  const [selectedColor, setSelectedColor] = useState(editingCategory?.color || PRESET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(editingCategory?.icon || PRESET_ICONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = React.useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  const handleSave = useCallback(() => {
    // Validate name
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (name.trim().length > 20) {
      Alert.alert('Error', 'Category name must be less than 20 characters');
      return;
    }

    // Check for duplicate names (excluding current if editing)
    const isDuplicate = existingCategories.some(
      cat => cat.name.toLowerCase() === name.trim().toLowerCase() && 
      cat.id !== editingCategory?.id
    );

    if (isDuplicate) {
      Alert.alert('Error', 'A category with this name already exists');
      return;
    }

    setIsSubmitting(true);

    // Calculate order (place at end)
    const maxOrder = Math.max(...existingCategories.map(c => c.order), 0);

    onSave({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      order: editingCategory?.order || maxOrder + 1,
    });

    // Reset form
    setName('');
    setSelectedColor(PRESET_COLORS[0]);
    setSelectedIcon(PRESET_ICONS[0]);
    setIsSubmitting(false);
  }, [name, selectedColor, selectedIcon, existingCategories, editingCategory, onSave]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={editingCategory ? 'Edit Category' : 'Create Custom Category'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Category Name */}
          <View style={styles.section}>
            <Input
              label="Category Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter category name"
              maxLength={20}
            />
            <Text style={styles.charCount}>{name.length}/20</Text>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                  activeOpacity={0.7}
                >
                  {selectedColor === color && (
                    <Feather name="check" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Choose Icon</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.iconSelected,
                    selectedIcon === icon && { backgroundColor: selectedColor + '20' },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={icon as any}
                    size={24}
                    color={selectedIcon === icon ? selectedColor : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewSection}>
            <Text style={styles.label}>Preview</Text>
            <View style={[styles.previewCard, { backgroundColor: selectedColor + '15' }]}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor + '30' }]}>
                <Feather name={selectedIcon as any} size={20} color={selectedColor} />
              </View>
              <Text style={[styles.previewText, { color: theme.colors.textPrimary }]}>
                {name || 'Category Name'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.actionButton}
              disabled={isSubmitting}
            />
            <Button
              title={editingCategory ? 'Save Changes' : 'Create Category'}
              onPress={handleSave}
              style={styles.actionButton}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.L,
  },
  section: {
    marginBottom: theme.spacing.L,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.S,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: 'right',
    marginTop: theme.spacing.XS,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.S,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.S,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundTexture,
  },
  iconSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  previewSection: {
    marginBottom: theme.spacing.XL,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.M,
    borderRadius: theme.borderRadius.medium,
    gap: theme.spacing.M,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.M,
  },
  actionButton: {
    flex: 1,
  },
});

export default CustomCategoryModal;