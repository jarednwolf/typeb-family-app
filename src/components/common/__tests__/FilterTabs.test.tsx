import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { FilterTabs, FilterTab } from '../FilterTabs';
import { renderWithProviders } from '../../../test-utils/component-test-utils';
import { theme } from '../../../constants/theme';

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockAnimated = {
    ...RN.Animated,
    spring: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
    Value: jest.fn().mockImplementation((value) => ({
      _value: value,
      setValue: jest.fn(),
      setOffset: jest.fn(),
      flattenOffset: jest.fn(),
      extractOffset: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      stopAnimation: jest.fn(),
      resetAnimation: jest.fn(),
      interpolate: jest.fn((config) => ({
        _parent: null,
        _config: config,
        _value: config.outputRange[0],
        interpolate: jest.fn((nestedConfig) => ({
          _parent: null,
          _config: nestedConfig,
          _value: nestedConfig.outputRange[0],
        })),
      })),
      animate: jest.fn(),
    })),
    View: RN.View,
  };
  
  return {
    ...RN,
    Animated: mockAnimated,
  };
});

describe('FilterTabs', () => {
  const mockTabs: FilterTab[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active', count: 5 },
    { id: 'completed', label: 'Completed', count: 12 },
    { id: 'archived', label: 'Archived', count: 0 },
  ];

  const mockOnTabPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all tabs', () => {
      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      expect(getByText('All')).toBeTruthy();
      expect(getByText('Active')).toBeTruthy();
      expect(getByText('Completed')).toBeTruthy();
      expect(getByText('Archived')).toBeTruthy();
    });

    it('renders with custom testID', () => {
      const { getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
          testID="custom-filter"
        />
      );

      expect(getByTestId('custom-filter')).toBeTruthy();
      expect(getByTestId('custom-filter-tab-all')).toBeTruthy();
      expect(getByTestId('custom-filter-tab-active')).toBeTruthy();
    });

    it('renders with custom accessibility label', () => {
      const { getByLabelText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
          accessibilityLabel="Task filters"
        />
      );

      expect(getByLabelText('Task filters')).toBeTruthy();
    });
  });

  describe('Tab Selection', () => {
    it('highlights active tab', () => {
      const { getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="active"
          onTabPress={mockOnTabPress}
        />
      );

      const activeTab = getByTestId('filter-tabs-tab-active');
      expect(activeTab.props.accessibilityState?.selected).toBe(true);
    });

    it('calls onTabPress when tab is pressed', () => {
      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      fireEvent.press(getByText('Active'));
      expect(mockOnTabPress).toHaveBeenCalledWith('active');

      fireEvent.press(getByText('Completed'));
      expect(mockOnTabPress).toHaveBeenCalledWith('completed');
    });

    it('updates active tab when prop changes', () => {
      const { rerender, getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      let activeTab = getByTestId('filter-tabs-tab-all');
      expect(activeTab.props.accessibilityState?.selected).toBe(true);

      rerender(
        <FilterTabs
          tabs={mockTabs}
          activeTab="completed"
          onTabPress={mockOnTabPress}
        />
      );

      activeTab = getByTestId('filter-tabs-tab-completed');
      expect(activeTab.props.accessibilityState?.selected).toBe(true);
    });
  });

  describe('Badge Display', () => {
    it('displays count badges', () => {
      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      expect(getByText('5')).toBeTruthy(); // Active count
      expect(getByText('12')).toBeTruthy(); // Completed count
    });

    it('does not display badge for zero count', () => {
      const { queryByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      // Archived has count: 0, should not show badge
      expect(queryByText('0')).toBeNull();
    });

    it('does not display badge when count is undefined', () => {
      const tabsWithoutCount = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
      ];

      const { queryByText } = renderWithProviders(
        <FilterTabs
          tabs={tabsWithoutCount}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      // Should not show any badges
      expect(queryByText(/^\d+$/)).toBeNull();
    });

    it('displays 99+ for counts over 99', () => {
      const tabsWithHighCount = [
        { id: 'all', label: 'All', count: 150 },
      ];

      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={tabsWithHighCount}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      expect(getByText('99+')).toBeTruthy();
    });
  });

  describe('Animations', () => {
    it('triggers animation on mount', async () => {
      renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      await waitFor(() => {
        expect(Animated.spring).toHaveBeenCalled();
      });
    });

    it('triggers animation when active tab changes', async () => {
      const { rerender } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      jest.clearAllMocks();

      rerender(
        <FilterTabs
          tabs={mockTabs}
          activeTab="active"
          onTabPress={mockOnTabPress}
        />
      );

      await waitFor(() => {
        expect(Animated.spring).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            toValue: 1, // Index of 'active' tab
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          })
        );
      });
    });

    it('creates indicator with correct width', () => {
      const { UNSAFE_getAllByType } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      const animatedViews = UNSAFE_getAllByType(Animated.View);
      const indicator = animatedViews.find(view => {
        const styles = Array.isArray(view.props.style) ? view.props.style : [view.props.style];
        return styles.some((style: any) => style?.width === '25%'); // 100 / 4 tabs
      });

      expect(indicator).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sets correct accessibility roles', () => {
      const { getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      const container = getByTestId('filter-tabs');
      expect(container.props.accessibilityRole).toBe('tablist');

      const tab = getByTestId('filter-tabs-tab-all');
      expect(tab.props.accessibilityRole).toBe('tab');
    });

    it('includes count in accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      const activeTab = getByTestId('filter-tabs-tab-active');
      expect(activeTab.props.accessibilityLabel).toBe('Active tab, 5 items');

      const allTab = getByTestId('filter-tabs-tab-all');
      expect(allTab.props.accessibilityLabel).toBe('All tab');
    });

    it('sets selected state for active tab', () => {
      const { getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="completed"
          onTabPress={mockOnTabPress}
        />
      );

      const completedTab = getByTestId('filter-tabs-tab-completed');
      expect(completedTab.props.accessibilityState?.selected).toBe(true);

      const allTab = getByTestId('filter-tabs-tab-all');
      expect(allTab.props.accessibilityState?.selected).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty tabs array', () => {
      const { queryByTestId } = renderWithProviders(
        <FilterTabs
          tabs={[]}
          activeTab=""
          onTabPress={mockOnTabPress}
        />
      );

      expect(queryByTestId('filter-tabs')).toBeTruthy();
    });

    it('handles single tab', () => {
      const singleTab = [{ id: 'only', label: 'Only Tab' }];
      
      const { getByText, UNSAFE_getAllByType } = renderWithProviders(
        <FilterTabs
          tabs={singleTab}
          activeTab="only"
          onTabPress={mockOnTabPress}
        />
      );

      expect(getByText('Only Tab')).toBeTruthy();
      
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      const indicator = animatedViews.find(view => {
        const styles = Array.isArray(view.props.style) ? view.props.style : [view.props.style];
        return styles.some((style: any) => style?.width === '100%'); // 100 / 1 tab
      });

      expect(indicator).toBeTruthy();
    });

    it('handles activeTab not in tabs array', () => {
      const { getByTestId } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="nonexistent"
          onTabPress={mockOnTabPress}
        />
      );

      // Should still render without crashing
      expect(getByTestId('filter-tabs')).toBeTruthy();
    });

    it('handles very long tab labels', () => {
      const longLabelTabs = [
        { id: 'long', label: 'This is a very long tab label that might overflow' },
      ];

      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={longLabelTabs}
          activeTab="long"
          onTabPress={mockOnTabPress}
        />
      );

      expect(getByText('This is a very long tab label that might overflow')).toBeTruthy();
    });

    it('handles rapid tab changes', () => {
      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="all"
          onTabPress={mockOnTabPress}
        />
      );

      // Rapidly press different tabs
      fireEvent.press(getByText('Active'));
      fireEvent.press(getByText('Completed'));
      fireEvent.press(getByText('Archived'));
      fireEvent.press(getByText('All'));

      expect(mockOnTabPress).toHaveBeenCalledTimes(4);
      expect(mockOnTabPress).toHaveBeenLastCalledWith('all');
    });
  });

  describe('Styling', () => {
    it('applies correct colors to active tab', () => {
      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="active"
          onTabPress={mockOnTabPress}
        />
      );

      const activeTabText = getByText('Active');
      expect(activeTabText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: theme.colors.textPrimary,
            fontWeight: '600',
          }),
        ])
      );
    });

    it('applies correct colors to inactive tabs', () => {
      const { getByText } = renderWithProviders(
        <FilterTabs
          tabs={mockTabs}
          activeTab="active"
          onTabPress={mockOnTabPress}
        />
      );

      const inactiveTabText = getByText('All');
      expect(inactiveTabText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: theme.colors.textSecondary,
          }),
        ])
      );
    });
  });
});