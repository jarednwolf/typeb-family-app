/**
 * Universal Search Overlay Component
 * 
 * Features:
 * - Search across tasks, events, members, achievements
 * - Recent searches
 * - Search suggestions
 * - Filtered results by type
 * - Quick navigation to results
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { useReduceMotion } from '../../contexts/AccessibilityContext';
import { HapticFeedback } from '../../utils/haptics';
import { useAppSelector } from '../../hooks/redux';
import { selectTasks } from '../../store/slices/tasksSlice';
import { selectFamilyMembers } from '../../store/slices/familySlice';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 5;

type SearchResultType = 'task' | 'event' | 'member' | 'achievement' | 'chat';

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon: string;
  color: string;
  data: any;
}

interface SearchFilter {
  type: SearchResultType;
  label: string;
  icon: string;
  color: string;
  active: boolean;
}

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ visible, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilter[]>([
    { type: 'task', label: 'Tasks', icon: 'clipboard', color: '#3B82F6', active: true },
    { type: 'event', label: 'Events', icon: 'calendar', color: '#F59E0B', active: true },
    { type: 'member', label: 'Members', icon: 'users', color: '#10B981', active: true },
    { type: 'achievement', label: 'Achievements', icon: 'award', color: '#8B5CF6', active: true },
    { type: 'chat', label: 'Chats', icon: 'message-circle', color: '#EC4899', active: true },
  ]);
  
  const { theme, isDarkMode } = useTheme();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const searchInputRef = useRef<TextInput>(null);
  const tasks = useAppSelector(selectTasks);
  const familyMembers = useAppSelector(selectFamilyMembers);
  
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  
  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      searchInputRef.current?.focus();
      
      if (!reduceMotion) {
        overlayOpacity.value = withTiming(1, { duration: 200 });
        contentTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      } else {
        overlayOpacity.value = 1;
        contentTranslateY.value = 0;
      }
    } else {
      if (!reduceMotion) {
        overlayOpacity.value = withTiming(0, { duration: 150 });
        contentTranslateY.value = withTiming(50, { duration: 150 });
      } else {
        overlayOpacity.value = 0;
        contentTranslateY.value = 50;
      }
    }
  }, [visible, reduceMotion]);
  
  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };
  
  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      const updatedSearches = [
        query,
        ...recentSearches.filter(s => s !== query)
      ].slice(0, MAX_RECENT_SEARCHES);
      
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };
  
  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      HapticFeedback.impact.light();
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };
  
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const activeFilters = filters.filter(f => f.active);
    const results: SearchResult[] = [];
    const searchLower = query.toLowerCase();
    
    // Search tasks
    if (activeFilters.some(f => f.type === 'task')) {
      const taskResults = tasks
        .filter(task => 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower)
        )
        .map(task => ({
          id: task.id,
          type: 'task' as SearchResultType,
          title: task.title,
          subtitle: task.description,
          icon: 'clipboard',
          color: '#3B82F6',
          data: task,
        }));
      results.push(...taskResults);
    }
    
    // Search family members
    if (activeFilters.some(f => f.type === 'member')) {
      const memberResults = familyMembers
        .filter(member => 
          member.displayName.toLowerCase().includes(searchLower) ||
          member.email?.toLowerCase().includes(searchLower)
        )
        .map(member => ({
          id: member.id,
          type: 'member' as SearchResultType,
          title: member.displayName,
          subtitle: member.role,
          icon: 'user',
          color: '#10B981',
          data: member,
        }));
      results.push(...memberResults);
    }
    
    // Mock search for events, achievements, chats
    if (activeFilters.some(f => f.type === 'event')) {
      // Add mock event results
      if ('birthday'.includes(searchLower)) {
        results.push({
          id: 'event-1',
          type: 'event',
          title: 'Sarah\'s Birthday',
          subtitle: 'Tomorrow at 3:00 PM',
          icon: 'calendar',
          color: '#F59E0B',
          data: {},
        });
      }
    }
    
    setSearchResults(results);
    setIsSearching(false);
    
    if (query.trim()) {
      saveRecentSearch(query);
    }
  };
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, filters]);
  
  const toggleFilter = (type: SearchResultType) => {
    setFilters(prev => prev.map(filter => 
      filter.type === type ? { ...filter, active: !filter.active } : filter
    ));
    HapticFeedback.selection();
  };
  
  const handleResultPress = (result: SearchResult) => {
    HapticFeedback.impact.light();
    onClose();
    
    // Navigate based on result type
    switch (result.type) {
      case 'task':
        (navigation as any).navigate('Tasks', {
          screen: 'TaskDetail',
          params: { taskId: result.id },
        });
        break;
      case 'member':
        (navigation as any).navigate('Family', {
          screen: 'MemberProfile',
          params: { memberId: result.id },
        });
        break;
      case 'event':
        (navigation as any).navigate('Family', {
          screen: 'EventDetail',
          params: { eventId: result.id },
        });
        break;
      case 'achievement':
        (navigation as any).navigate('Dashboard', {
          screen: 'Achievements',
          params: { achievementId: result.id },
        });
        break;
      case 'chat':
        (navigation as any).navigate('Chat', {
          screen: 'ChatRoom',
          params: { chatId: result.id },
        });
        break;
    }
  };
  
  const renderFilter = ({ item }: { item: SearchFilter }) => (
    <TouchableOpacity
      onPress={() => toggleFilter(item.type)}
      style={[
        styles.filterChip,
        {
          backgroundColor: item.active ? item.color : theme.colors.surface,
          borderColor: item.active ? item.color : theme.colors.separator,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${item.label}`}
      accessibilityState={{ selected: item.active }}
    >
      <Feather
        name={item.icon as any}
        size={16}
        color={item.active ? '#FFFFFF' : theme.colors.textSecondary}
      />
      <Text
        style={[
          styles.filterText,
          {
            color: item.active ? '#FFFFFF' : theme.colors.textSecondary,
          },
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
  
  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => handleResultPress(item)}
      style={[
        styles.resultItem,
        { backgroundColor: theme.colors.surface },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.subtitle || ''}`}
    >
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: item.color + '20' },
        ]}
      >
        <Feather
          name={item.icon as any}
          size={20}
          color={item.color}
        />
      </View>
      <View style={styles.resultContent}>
        <Text
          style={[
            styles.resultTitle,
            { color: theme.colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.subtitle && (
          <Text
            style={[
              styles.resultSubtitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        )}
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={theme.colors.textTertiary}
      />
    </TouchableOpacity>
  );
  
  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  
  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[
            styles.overlay,
            animatedOverlayStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
          />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.content,
            animatedContentStyle,
            {
              backgroundColor: theme.colors.background,
              paddingTop: insets.top,
            },
          ]}
        >
          {/* Search Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Feather
                name="search"
                size={20}
                color={theme.colors.textTertiary}
              />
              <TextInput
                ref={searchInputRef}
                style={[
                  styles.searchInput,
                  { color: theme.colors.textPrimary },
                ]}
                placeholder="Search tasks, members, events..."
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => performSearch(searchQuery)}
                accessibilityLabel="Search input"
                accessibilityHint="Enter text to search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel="Clear search"
                >
                  <Feather
                    name="x-circle"
                    size={18}
                    color={theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
              accessibilityLabel="Cancel search"
            >
              <Text
                style={[
                  styles.cancelText,
                  { color: theme.colors.primary },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {filters.map((filter) => (
              <View key={filter.type}>
                {renderFilter({ item: filter })}
              </View>
            ))}
          </ScrollView>
          
          {/* Content */}
          <ScrollView
            style={styles.resultsContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {searchQuery.length === 0 ? (
              <>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Recent Searches
                      </Text>
                      <TouchableOpacity
                        onPress={clearRecentSearches}
                        accessibilityLabel="Clear recent searches"
                      >
                        <Text
                          style={[
                            styles.clearButton,
                            { color: theme.colors.primary },
                          ]}
                        >
                          Clear
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {recentSearches.map((search, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSearchQuery(search)}
                        style={[
                          styles.recentItem,
                          { backgroundColor: theme.colors.surface },
                        ]}
                        accessibilityLabel={`Recent search: ${search}`}
                      >
                        <Feather
                          name="clock"
                          size={16}
                          color={theme.colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.recentText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {search}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                {/* Suggestions */}
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Suggestions
                  </Text>
                  <View style={styles.suggestions}>
                    {['Homework', 'Chores', 'Birthday', 'Meeting'].map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        onPress={() => setSearchQuery(suggestion)}
                        style={[
                          styles.suggestionChip,
                          { backgroundColor: theme.colors.surface },
                        ]}
                        accessibilityLabel={`Suggestion: ${suggestion}`}
                      >
                        <Text
                          style={[
                            styles.suggestionText,
                            { color: theme.colors.textPrimary },
                          ]}
                        >
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Search Results */}
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <Text
                      style={[
                        styles.loadingText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Searching...
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <View style={styles.section}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {searchResults.length} Results
                    </Text>
                    {searchResults.map((result) => (
                      <View key={result.id}>
                        {renderResult({ item: result })}
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Feather
                      name="search"
                      size={48}
                      color={theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.emptyText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      No results found
                    </Text>
                    <Text
                      style={[
                        styles.emptySubtext,
                        { color: theme.colors.textTertiary },
                      ]}
                    >
                      Try adjusting your search or filters
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 8,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filtersContainer: {
    maxHeight: 50,
    paddingVertical: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 14,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  recentText: {
    fontSize: 15,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SearchOverlay;