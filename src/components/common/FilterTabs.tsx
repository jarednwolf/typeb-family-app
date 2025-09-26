import React, { FC, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { theme } from '../../constants/theme';

export interface FilterTab {
  id: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  testID?: string;
  accessibilityLabel?: string;
}

export const FilterTabs: FC<FilterTabsProps> = memo(({
  tabs,
  activeTab,
  onTabPress,
  testID = 'filter-tabs',
  accessibilityLabel = 'Filter tabs',
}) => {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(animatedValue, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [activeTab, tabs]);

  // Calculate the actual pixel value for translateX based on container width
  const tabWidth = containerWidth / tabs.length;
  const indicatorTranslateX = animatedValue.interpolate({
    inputRange: tabs.map((_, index) => index),
    outputRange: tabs.map((_, index) => index * tabWidth),
  });

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tablist"
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
              testID={`${testID}-tab-${tab.id}`}
              accessibilityLabel={`${tab.label} tab${tab.count !== undefined ? `, ${tab.count} items` : ''}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[
                styles.tabText,
                isActive && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={[
                  styles.badge,
                  isActive && styles.activeBadge
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isActive && styles.activeBadgeText
                  ]}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Animated indicator */}
      {containerWidth > 0 && (
        <View style={styles.indicatorContainer}>
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidth,
                transform: [
                  {
                    translateX: indicatorTranslateX,
                  },
                ],
              },
            ]}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.separator,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.M,
    minWidth: '100%',
  },
  tab: {
    paddingHorizontal: theme.spacing.M,
    paddingVertical: theme.spacing.S,
    marginRight: theme.spacing.L,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    // Active state handled by text color
  },
  tabText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  badge: {
    marginLeft: theme.spacing.XS,
    backgroundColor: theme.colors.backgroundTexture,
    paddingHorizontal: theme.spacing.XS,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    fontSize: theme.typography.caption2.fontSize,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  activeBadgeText: {
    color: theme.colors.background,
  },
  indicatorContainer: {
    height: 2,
    backgroundColor: theme.colors.separator,
  },
  indicator: {
    height: 2,
    backgroundColor: theme.colors.primary,
  },
});