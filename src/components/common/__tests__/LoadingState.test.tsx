import React from 'react';
import { ActivityIndicator, Animated } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import LoadingState, { InlineLoader } from '../LoadingState';
import { renderWithProviders } from '../../../test-utils/component-test-utils';
import { colors } from '../../../constants/theme';

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockAnimated = {
    ...RN.Animated,
    loop: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
    parallel: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
    timing: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
    delay: jest.fn(() => ({
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

describe('LoadingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Spinner Variant (Default)', () => {
    it('renders default spinner variant', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator).toBeTruthy();
      expect(indicator.props.color).toBe(colors.primary);
    });

    it('renders with message', () => {
      const { getByText, UNSAFE_getByType } = renderWithProviders(
        <LoadingState message="Loading data..." />
      );
      
      expect(getByText('Loading data...')).toBeTruthy();
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('renders small size', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState size="small" />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('small');
    });

    it('renders medium size', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState size="medium" />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('large');
    });

    it('renders large size', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState size="large" />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('large');
    });

    it('centers content', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState />
      );
      
      const container = UNSAFE_getByType(ActivityIndicator).parent;
      expect(container?.props.style).toMatchObject({
        alignItems: 'center',
        justifyContent: 'center',
      });
    });
  });

  describe('Skeleton Variant', () => {
    it('renders skeleton loader', () => {
      const { UNSAFE_getAllByType } = renderWithProviders(
        <LoadingState variant="skeleton" />
      );
      
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      // Should have 3 skeleton cards
      expect(animatedViews.length).toBeGreaterThanOrEqual(3);
    });

    it('triggers shimmer animation', async () => {
      renderWithProviders(
        <LoadingState variant="skeleton" />
      );
      
      await waitFor(() => {
        expect(Animated.loop).toHaveBeenCalled();
        expect(Animated.sequence).toHaveBeenCalled();
        expect(Animated.timing).toHaveBeenCalled();
      });
    });

    it('renders skeleton cards with proper structure', () => {
      const { UNSAFE_queryAllByProps } = renderWithProviders(
        <LoadingState variant="skeleton" />
      );
      
      // Check for skeleton elements by looking for specific style properties
      // Skeleton circles
      const allViews = UNSAFE_queryAllByProps({});
      const circles = allViews.filter(view => {
        const style = view.props.style;
        return style && style.width === 24 && style.height === 24 && style.borderRadius === 12;
      });
      expect(circles.length).toBeGreaterThan(0);
      
      // Check for title bars
      const titles = allViews.filter(view => {
        const style = view.props.style;
        return style && style.height === 16 && style.width === '70%';
      });
      expect(titles.length).toBeGreaterThan(0);
      
      // Check for subtitle bars
      const subtitles = allViews.filter(view => {
        const style = view.props.style;
        return style && style.height === 12 && style.width === '50%';
      });
      expect(subtitles.length).toBeGreaterThan(0);
    });

    it('applies opacity animation to skeleton cards', () => {
      const { UNSAFE_getAllByType } = renderWithProviders(
        <LoadingState variant="skeleton" />
      );
      
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      const skeletonCards = animatedViews.filter(view =>
        view.props.style && Array.isArray(view.props.style) &&
        view.props.style.some((s: any) => s?.opacity)
      );
      
      expect(skeletonCards.length).toBeGreaterThan(0);
    });
  });

  describe('Dots Variant', () => {
    it('renders dots loader', () => {
      const { UNSAFE_getAllByType } = renderWithProviders(
        <LoadingState variant="dots" />
      );
      
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      // Should have at least 3 dots
      const dots = animatedViews.filter(view => {
        const style = Array.isArray(view.props.style) ? view.props.style[0] : view.props.style;
        return style?.width === 10 && style?.height === 10;
      });
      expect(dots.length).toBe(3);
    });

    it('renders dots with message', () => {
      const { getByText } = renderWithProviders(
        <LoadingState variant="dots" message="Processing..." />
      );
      
      expect(getByText('Processing...')).toBeTruthy();
    });

    it('triggers dots animation', async () => {
      renderWithProviders(
        <LoadingState variant="dots" />
      );
      
      await waitFor(() => {
        expect(Animated.parallel).toHaveBeenCalled();
        expect(Animated.loop).toHaveBeenCalled();
        expect(Animated.sequence).toHaveBeenCalled();
        expect(Animated.delay).toHaveBeenCalled();
      });
    });

    it('applies transform animation to dots', () => {
      const { UNSAFE_getAllByType } = renderWithProviders(
        <LoadingState variant="dots" />
      );
      
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      const dots = animatedViews.filter(view => {
        const styles = Array.isArray(view.props.style) ? view.props.style : [view.props.style];
        return styles.some((s: any) => s?.transform);
      });
      
      expect(dots.length).toBeGreaterThan(0);
    });
  });

  describe('Overlay Variant', () => {
    it('renders overlay loader', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState variant="overlay" />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator).toBeTruthy();
      expect(indicator.props.color).toBe(colors.white);
    });

    it('renders overlay with message', () => {
      const { getByText } = renderWithProviders(
        <LoadingState variant="overlay" message="Saving changes..." />
      );
      
      expect(getByText('Saving changes...')).toBeTruthy();
    });

    it('applies fade animation', async () => {
      renderWithProviders(
        <LoadingState variant="overlay" />
      );
      
      await waitFor(() => {
        expect(Animated.timing).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        );
      });
    });

    it('renders with absolute positioning', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState variant="overlay" />
      );
      
      const overlay = UNSAFE_getByType(Animated.View);
      const styles = Array.isArray(overlay.props.style) ? overlay.props.style : [overlay.props.style];
      
      const hasAbsolutePosition = styles.some((style: any) =>
        style?.position === 'absolute' ||
        (style?.bottom === 0 && style?.left === 0 && style?.right === 0 && style?.top === 0)
      );
      
      expect(hasAbsolutePosition).toBe(true);
    });

    it('renders with dark background', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState variant="overlay" />
      );
      
      const overlay = UNSAFE_getByType(Animated.View);
      const styles = Array.isArray(overlay.props.style) ? overlay.props.style : [overlay.props.style];
      
      const hasBackground = styles.some((style: any) =>
        style?.backgroundColor === 'rgba(0, 0, 0, 0.7)'
      );
      
      expect(hasBackground).toBe(true);
    });
  });

  describe('InlineLoader', () => {
    it('renders with default text', () => {
      const { getByText, UNSAFE_getByType } = renderWithProviders(
        <InlineLoader />
      );
      
      expect(getByText('Loading')).toBeTruthy();
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('renders with custom text', () => {
      const { getByText } = renderWithProviders(
        <InlineLoader text="Fetching..." />
      );
      
      expect(getByText('Fetching...')).toBeTruthy();
    });

    it('renders small activity indicator', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <InlineLoader />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('small');
      expect(indicator.props.color).toBe(colors.primary);
    });

    it('renders in horizontal layout', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <InlineLoader />
      );
      
      const container = UNSAFE_getByType(ActivityIndicator).parent;
      expect(container?.props.style).toMatchObject({
        flexDirection: 'row',
        alignItems: 'center',
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty message gracefully', () => {
      const { queryByText } = renderWithProviders(
        <LoadingState message="" />
      );
      
      // Empty message should not render text element
      expect(queryByText('')).toBeNull();
    });

    it('handles long message text', () => {
      const longMessage = 'This is a very long loading message that should wrap properly and not overflow the container';
      const { getByText } = renderWithProviders(
        <LoadingState message={longMessage} />
      );
      
      const messageElement = getByText(longMessage);
      expect(messageElement).toBeTruthy();
      expect(messageElement.props.style).toMatchObject({
        textAlign: 'center',
      });
    });

    it('handles variant change', () => {
      const { rerender, UNSAFE_queryByType, UNSAFE_getAllByType } = renderWithProviders(
        <LoadingState variant="spinner" />
      );
      
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
      
      rerender(<LoadingState variant="skeleton" />);
      
      const animatedViews = UNSAFE_getAllByType(Animated.View);
      expect(animatedViews.length).toBeGreaterThan(0);
    });

    it('handles size change for spinner variant', () => {
      const { rerender, UNSAFE_getByType } = renderWithProviders(
        <LoadingState size="small" />
      );
      
      let indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('small');
      
      rerender(<LoadingState size="large" />);
      
      indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.size).toBe('large');
    });
  });

  describe('Styling', () => {
    it('applies correct colors', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState />
      );
      
      const indicator = UNSAFE_getByType(ActivityIndicator);
      expect(indicator.props.color).toBe(colors.primary);
    });

    it('applies correct spacing', () => {
      const { getByText } = renderWithProviders(
        <LoadingState message="Loading..." />
      );
      
      const message = getByText('Loading...');
      expect(message.props.style).toMatchObject({
        marginTop: expect.any(Number),
      });
    });

    it('centers overlay content', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <LoadingState variant="overlay" />
      );
      
      const overlay = UNSAFE_getByType(Animated.View);
      const styles = Array.isArray(overlay.props.style) ? overlay.props.style : [overlay.props.style];
      
      const hasCentering = styles.some((style: any) =>
        style?.alignItems === 'center' && style?.justifyContent === 'center'
      );
      
      expect(hasCentering).toBe(true);
    });
  });
});