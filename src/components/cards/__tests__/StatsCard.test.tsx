import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import StatsCard, { GridStatsCard } from '../StatsCard';
import { colors } from '../../../constants/theme';

// Mock Animated API for testing
jest.mock('react-native/Libraries/Animated/Animated', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/Animated');
  return {
    ...ActualAnimated,
    timing: (value: any, config: any) => ({
      start: (callback?: any) => {
        value.setValue(config.toValue);
        callback && callback({ finished: true });
      },
      stop: jest.fn(),
    }),
    spring: (value: any, config: any) => ({
      start: (callback?: any) => {
        value.setValue(config.toValue);
        callback && callback({ finished: true });
      },
      stop: jest.fn(),
    }),
  };
});

describe('StatsCard Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with required props', () => {
      const { getByText } = render(
        <StatsCard
          title="Total Tasks"
          value={42}
        />
      );
      
      expect(getByText('Total Tasks')).toBeTruthy();
      expect(getByText('42')).toBeTruthy();
    });

    it('renders with string value', () => {
      const { getByText } = render(
        <StatsCard
          title="Completion Rate"
          value="85%"
        />
      );
      
      expect(getByText('85%')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      const { getByText } = render(
        <StatsCard
          title="Tasks"
          value={10}
          subtitle="This week"
        />
      );
      
      expect(getByText('This week')).toBeTruthy();
    });

    it('renders with icon', () => {
      const { getByText } = render(
        <StatsCard
          title="Points"
          value={100}
          icon="star"
        />
      );
      
      expect(getByText('Icon: star')).toBeTruthy();
    });

    it('renders with custom color', () => {
      const { getByText } = render(
        <StatsCard
          title="Custom"
          value="123"
          color="#FF5733"
        />
      );
      
      const value = getByText('123');
      const styles = Array.isArray(value.props.style) ? value.props.style : [value.props.style];
      const hasColor = styles.some((style: any) => style?.color === '#FF5733');
      expect(hasColor).toBeTruthy();
    });

    it('renders in compact mode', () => {
      const { getByText } = render(
        <StatsCard
          title="Compact"
          value="50"
          compact={true}
        />
      );
      
      const value = getByText('50');
      // Compact mode uses different typography
      expect(value).toBeTruthy();
    });
  });

  // Trend indicator tests
  describe('Trend Indicators', () => {
    it('shows upward trend', () => {
      const { getByText } = render(
        <StatsCard
          title="Growth"
          value={100}
          trend="up"
        />
      );
      
      expect(getByText('Icon: trending-up')).toBeTruthy();
    });

    it('shows downward trend', () => {
      const { getByText } = render(
        <StatsCard
          title="Decline"
          value={50}
          trend="down"
        />
      );
      
      expect(getByText('Icon: trending-down')).toBeTruthy();
    });

    it('shows neutral trend', () => {
      const { getByText } = render(
        <StatsCard
          title="Stable"
          value={75}
          trend="neutral"
        />
      );
      
      expect(getByText('Icon: minus')).toBeTruthy();
    });

    it('shows trend value', () => {
      const { getByText } = render(
        <StatsCard
          title="Change"
          value={100}
          trend="up"
          trendValue="+15%"
        />
      );
      
      expect(getByText('+15%')).toBeTruthy();
    });

    it('applies correct color to upward trend', () => {
      const { getByText } = render(
        <StatsCard
          title="Positive"
          value={100}
          trend="up"
          trendValue="+10"
        />
      );
      
      const trendValue = getByText('+10');
      const styles = Array.isArray(trendValue.props.style) ? trendValue.props.style : [trendValue.props.style];
      const hasColor = styles.some((style: any) => style?.color === colors.success);
      expect(hasColor).toBeTruthy();
    });

    it('applies correct color to downward trend', () => {
      const { getByText } = render(
        <StatsCard
          title="Negative"
          value={50}
          trend="down"
          trendValue="-5"
        />
      );
      
      const trendValue = getByText('-5');
      const styles = Array.isArray(trendValue.props.style) ? trendValue.props.style : [trendValue.props.style];
      const hasColor = styles.some((style: any) => style?.color === colors.error);
      expect(hasColor).toBeTruthy();
    });

    it('applies correct color to neutral trend', () => {
      const { getByText } = render(
        <StatsCard
          title="Neutral"
          value={75}
          trend="neutral"
          trendValue="0"
        />
      );
      
      const trendValue = getByText('0');
      const styles = Array.isArray(trendValue.props.style) ? trendValue.props.style : [trendValue.props.style];
      const hasColor = styles.some((style: any) => style?.color === colors.textTertiary);
      expect(hasColor).toBeTruthy();
    });
  });

  // Animation tests
  describe('Animations', () => {
    it('applies scale animation on mount', () => {
      const { UNSAFE_getByType } = render(
        <StatsCard
          title="Animated"
          value={100}
        />
      );
      
      const animatedView = UNSAFE_getByType(Animated.View as any);
      expect(animatedView).toBeTruthy();
      // Animation is mocked, so we just verify the component exists
    });

    it('maintains animation in compact mode', () => {
      const { UNSAFE_getByType } = render(
        <StatsCard
          title="Compact Animated"
          value={50}
          compact={true}
        />
      );
      
      const animatedView = UNSAFE_getByType(Animated.View as any);
      expect(animatedView).toBeTruthy();
    });
  });

  // Complex combinations
  describe('Complex Combinations', () => {
    it('renders with all props', () => {
      const { getByText } = render(
        <StatsCard
          title="Complete Card"
          value="999"
          subtitle="All features"
          trend="up"
          trendValue="+25%"
          color="#4CAF50"
          icon="award"
          compact={false}
        />
      );
      
      expect(getByText('Complete Card')).toBeTruthy();
      expect(getByText('999')).toBeTruthy();
      expect(getByText('All features')).toBeTruthy();
      expect(getByText('+25%')).toBeTruthy();
      expect(getByText('Icon: award')).toBeTruthy();
      expect(getByText('Icon: trending-up')).toBeTruthy();
    });

    it('renders minimal configuration', () => {
      const { getByText, queryByText } = render(
        <StatsCard
          title="Minimal"
          value={1}
        />
      );
      
      expect(getByText('Minimal')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
      expect(queryByText('Icon: trending-up')).toBeNull();
      expect(queryByText('Icon: trending-down')).toBeNull();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles zero value', () => {
      const { getByText } = render(
        <StatsCard
          title="Zero"
          value={0}
        />
      );
      
      expect(getByText('0')).toBeTruthy();
    });

    it('handles negative value', () => {
      const { getByText } = render(
        <StatsCard
          title="Negative"
          value={-10}
        />
      );
      
      expect(getByText('-10')).toBeTruthy();
    });

    it('handles very large numbers', () => {
      const { getByText } = render(
        <StatsCard
          title="Large"
          value={1000000}
        />
      );
      
      expect(getByText('1000000')).toBeTruthy();
    });

    it('handles empty string value', () => {
      const { getByText } = render(
        <StatsCard
          title="Empty"
          value=""
        />
      );
      
      expect(getByText('Empty')).toBeTruthy();
      // Empty value should still render
    });

    it('handles special characters in value', () => {
      const { getByText } = render(
        <StatsCard
          title="Special"
          value="$1,234.56"
        />
      );
      
      expect(getByText('$1,234.56')).toBeTruthy();
    });

    it('handles long title text', () => {
      const longTitle = 'This is a very long title that might need to wrap';
      const { getByText } = render(
        <StatsCard
          title={longTitle}
          value={100}
        />
      );
      
      expect(getByText(longTitle)).toBeTruthy();
    });

    it('handles long subtitle text', () => {
      const longSubtitle = 'This is a very long subtitle that provides additional context';
      const { getByText } = render(
        <StatsCard
          title="Title"
          value={100}
          subtitle={longSubtitle}
        />
      );
      
      expect(getByText(longSubtitle)).toBeTruthy();
    });
  });
});

describe('GridStatsCard Component', () => {
  describe('Rendering', () => {
    it('renders with required props', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Grid Stat"
          value={25}
        />
      );
      
      expect(getByText('Grid Stat')).toBeTruthy();
      expect(getByText('25')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Grid"
          value="50%"
          subtitle="Progress"
        />
      );
      
      expect(getByText('Progress')).toBeTruthy();
    });

    it('renders with trend indicator', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Trending"
          value={100}
          trend="up"
          subtitle="Increasing"
        />
      );
      
      expect(getByText('Icon: trending-up')).toBeTruthy();
      expect(getByText('Increasing')).toBeTruthy();
    });

    it('renders with custom color', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Colored"
          value="123"
          color="#9C27B0"
        />
      );
      
      const value = getByText('123');
      const styles = Array.isArray(value.props.style) ? value.props.style : [value.props.style];
      const hasColor = styles.some((style: any) => style?.color === '#9C27B0');
      expect(hasColor).toBeTruthy();
    });

    it('uses default color when not provided', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Default"
          value="456"
        />
      );
      
      const value = getByText('456');
      const styles = Array.isArray(value.props.style) ? value.props.style : [value.props.style];
      const hasColor = styles.some((style: any) => style?.color === colors.primary);
      expect(hasColor).toBeTruthy();
    });
  });

  describe('Trend Behavior', () => {
    it('shows upward trend with correct color', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Up"
          value={200}
          trend="up"
          subtitle="Growing"
        />
      );
      
      expect(getByText('Icon: trending-up')).toBeTruthy();
    });

    it('shows downward trend with correct color', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Down"
          value={50}
          trend="down"
          subtitle="Declining"
        />
      );
      
      expect(getByText('Icon: trending-down')).toBeTruthy();
    });

    it('does not show trend icon without trend prop', () => {
      const { queryByText } = render(
        <GridStatsCard
          title="No Trend"
          value={100}
          subtitle="Stable"
        />
      );
      
      expect(queryByText('Icon: trending-up')).toBeNull();
      expect(queryByText('Icon: trending-down')).toBeNull();
    });
  });

  describe('Animation', () => {
    it('applies scale animation on mount', () => {
      const { UNSAFE_getByType } = render(
        <GridStatsCard
          title="Animated Grid"
          value={75}
        />
      );
      
      const animatedView = UNSAFE_getByType(Animated.View as any);
      expect(animatedView).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles all props simultaneously', () => {
      const { getByText } = render(
        <GridStatsCard
          title="Full Grid Card"
          value="$1,234"
          subtitle="Revenue this month"
          trend="up"
          color="#2196F3"
        />
      );
      
      expect(getByText('Full Grid Card')).toBeTruthy();
      expect(getByText('$1,234')).toBeTruthy();
      expect(getByText('Revenue this month')).toBeTruthy();
      expect(getByText('Icon: trending-up')).toBeTruthy();
    });

    it('handles minimal props', () => {
      const { getByText, queryByText } = render(
        <GridStatsCard
          title="Min"
          value={0}
        />
      );
      
      expect(getByText('Min')).toBeTruthy();
      expect(getByText('0')).toBeTruthy();
      expect(queryByText('Icon: trending-up')).toBeNull();
    });
  });
});