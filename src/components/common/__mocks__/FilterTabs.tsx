import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { theme } from '../../../constants/theme';

const FilterTabsMock: React.FC<any> = ({
  tabs = [],
  activeTab,
  onTabPress = () => {},
  testID = 'filter-tabs',
  accessibilityLabel = 'Filter tabs',
}) => {
  const widthPercent = tabs.length > 0 ? `${100 / tabs.length}%` : '0%';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idx = Math.max(0, tabs.findIndex((t: any) => t.id === activeTab));
    Animated.spring(anim, {
      toValue: idx,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start?.();
  }, [activeTab, tabs]);

  return (
    <View testID={testID} accessibilityLabel={accessibilityLabel} accessibilityRole="tablist">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((t: any) => {
          const selected = t.id === activeTab;
          return (
            <TouchableOpacity
              key={t.id || t.key}
              testID={`${testID}-tab-${t.id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t.label} tab${typeof t.count === 'number' ? `, ${t.count} items` : ''}`}
              onPress={() => onTabPress(t.id)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}
            >
              <Text
                style={[
                  { color: theme.colors.textSecondary, fontWeight: '500' },
                  selected && { color: theme.colors.textPrimary, fontWeight: '600' },
                ]}
              >
                {t.label}
              </Text>
              {typeof t.count === 'number' && t.count > 0 ? (
                <Text style={{ marginLeft: 6 }}>
                  {t.count > 99 ? '99+' : String(t.count)}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Animated.View testID="indicator" style={[{ height: 2 }, { width: widthPercent }]} />
      <Text>{activeTab}</Text>
    </View>
  );
};

export default FilterTabsMock;
export const FilterTabs = FilterTabsMock;
export type FilterTab = { id: string; label: string; count?: number };

