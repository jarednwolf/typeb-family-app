import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { 
  EmptyState,
  NoTasksEmpty,
  NoFamilyEmpty,
  NoNotificationsEmpty,
  SearchEmpty,
  ErrorState,
  OfflineState
} from '../EmptyState';
import { renderWithProviders } from '../../../test-utils/component-test-utils';
import { colors } from '../../../constants/theme';

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const mockAnimated = {
    ...RN.Animated,
    parallel: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
    timing: jest.fn(() => ({
      start: jest.fn((cb) => cb && cb()),
    })),
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
      interpolate: jest.fn(),
      animate: jest.fn(),
    })),
    View: RN.View,
  };
  
  return {
    ...RN,
    Animated: mockAnimated,
  };
});

describe('EmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      const { getByText } = renderWithProviders(
        <EmptyState title="No items" />
      );
      
      expect(getByText('No items')).toBeTruthy();
    });

    it('renders with icon', () => {
      const { UNSAFE_getByProps } = renderWithProviders(
        <EmptyState title="No items" icon="inbox" />
      );
      
      const icon = UNSAFE_getByProps({ name: 'inbox' });
      expect(icon).toBeTruthy();
    });

    it('renders with custom icon', () => {
      const { UNSAFE_getByProps } = renderWithProviders(
        <EmptyState title="No items" icon="search" />
      );
      
      const icon = UNSAFE_getByProps({ name: 'search' });
      expect(icon).toBeTruthy();
    });

    it('renders with message', () => {
      const { getByText } = renderWithProviders(
        <EmptyState 
          title="No items" 
          message="Start by adding your first item"
        />
      );
      
      expect(getByText('Start by adding your first item')).toBeTruthy();
    });

    it('renders without message', () => {
      const { queryByText } = renderWithProviders(
        <EmptyState title="No items" />
      );
      
      expect(queryByText(/Start by adding/)).toBeNull();
    });
  });

  describe('Action Buttons', () => {
    it('renders primary action button', () => {
      const onAction = jest.fn();
      const { getByText } = renderWithProviders(
        <EmptyState 
          title="No items"
          actionLabel="Add Item"
          onAction={onAction}
        />
      );
      
      const button = getByText('Add Item');
      expect(button).toBeTruthy();
      
      fireEvent.press(button);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders secondary action button', () => {
      const onSecondaryAction = jest.fn();
      const { getByText } = renderWithProviders(
        <EmptyState 
          title="No items"
          secondaryActionLabel="Learn More"
          onSecondaryAction={onSecondaryAction}
        />
      );
      
      const button = getByText('Learn More');
      expect(button).toBeTruthy();
      
      fireEvent.press(button);
      expect(onSecondaryAction).toHaveBeenCalledTimes(1);
    });

    it('renders both action buttons', () => {
      const onAction = jest.fn();
      const onSecondaryAction = jest.fn();
      const { getByText } = renderWithProviders(
        <EmptyState 
          title="No items"
          actionLabel="Add Item"
          onAction={onAction}
          secondaryActionLabel="Learn More"
          onSecondaryAction={onSecondaryAction}
        />
      );
      
      expect(getByText('Add Item')).toBeTruthy();
      expect(getByText('Learn More')).toBeTruthy();
    });

    it('does not render action without handler', () => {
      const { queryByText } = renderWithProviders(
        <EmptyState 
          title="No items"
          actionLabel="Add Item"
        />
      );
      
      expect(queryByText('Add Item')).toBeNull();
    });

    it('does not render secondary action without handler', () => {
      const { queryByText } = renderWithProviders(
        <EmptyState 
          title="No items"
          secondaryActionLabel="Learn More"
        />
      );
      
      expect(queryByText('Learn More')).toBeNull();
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { UNSAFE_getByProps } = renderWithProviders(
        <EmptyState title="No items" />
      );
      
      const icon = UNSAFE_getByProps({ name: 'inbox' });
      expect(icon.props.size).toBe(48);
    });

    it('renders compact variant', () => {
      const { UNSAFE_getByProps, getByText } = renderWithProviders(
        <EmptyState
          title="No items"
          variant="compact"
          actionLabel="Add"
          onAction={jest.fn()}
        />
      );
      
      const icon = UNSAFE_getByProps({ name: 'inbox' });
      expect(icon.props.size).toBe(32);
      
      // Button should exist in compact variant
      const button = getByText('Add');
      expect(button).toBeTruthy();
    });

    it('renders large variant', () => {
      const { UNSAFE_getByProps } = renderWithProviders(
        <EmptyState title="No items" variant="large" />
      );
      
      const icon = UNSAFE_getByProps({ name: 'inbox' });
      expect(icon.props.size).toBe(64);
    });
  });

  describe('Animations', () => {
    it('triggers animations on mount', async () => {
      renderWithProviders(
        <EmptyState title="No items" />
      );
      
      await waitFor(() => {
        expect(Animated.parallel).toHaveBeenCalled();
        expect(Animated.timing).toHaveBeenCalled();
        expect(Animated.spring).toHaveBeenCalled();
      });
    });

    it('applies animation styles', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <EmptyState title="No items" />
      );
      
      const animatedView = UNSAFE_getByType(Animated.View);
      expect(animatedView.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opacity: expect.any(Object),
            transform: expect.arrayContaining([
              { scale: expect.any(Object) }
            ]),
          }),
        ])
      );
    });
  });

  describe('Preset Components', () => {
    describe('NoTasksEmpty', () => {
      it('renders with correct props', () => {
        const onCreateTask = jest.fn();
        const { getByText } = renderWithProviders(
          <NoTasksEmpty onCreateTask={onCreateTask} />
        );
        
        expect(getByText('No tasks yet')).toBeTruthy();
        expect(getByText(/Create your first task/)).toBeTruthy();
        
        const button = getByText('Create Task');
        fireEvent.press(button);
        expect(onCreateTask).toHaveBeenCalledTimes(1);
      });
    });

    describe('NoFamilyEmpty', () => {
      it('renders with both actions', () => {
        const onCreate = jest.fn();
        const onJoin = jest.fn();
        const { getByText } = renderWithProviders(
          <NoFamilyEmpty onCreate={onCreate} onJoin={onJoin} />
        );
        
        expect(getByText('Welcome to TypeB')).toBeTruthy();
        expect(getByText(/Start by creating/)).toBeTruthy();
        
        fireEvent.press(getByText('Create Family'));
        expect(onCreate).toHaveBeenCalledTimes(1);
        
        fireEvent.press(getByText('Join Family'));
        expect(onJoin).toHaveBeenCalledTimes(1);
      });
    });

    describe('NoNotificationsEmpty', () => {
      it('renders compact variant', () => {
        const { getByText, UNSAFE_getByProps } = renderWithProviders(
          <NoNotificationsEmpty />
        );
        
        expect(getByText('No notifications')).toBeTruthy();
        expect(getByText(/all caught up/)).toBeTruthy();
        
        const icon = UNSAFE_getByProps({ name: 'bell' });
        expect(icon.props.size).toBe(32); // Compact size
      });
    });

    describe('SearchEmpty', () => {
      it('renders with search term', () => {
        const onClear = jest.fn();
        const { getByText } = renderWithProviders(
          <SearchEmpty searchTerm="test query" onClear={onClear} />
        );
        
        expect(getByText('No results found')).toBeTruthy();
        expect(getByText(/couldn't find anything matching "test query"/)).toBeTruthy();
        
        fireEvent.press(getByText('Clear Search'));
        expect(onClear).toHaveBeenCalledTimes(1);
      });

      it('renders without clear action', () => {
        const { queryByText } = renderWithProviders(
          <SearchEmpty searchTerm="test" />
        );
        
        expect(queryByText('Clear Search')).toBeNull();
      });
    });

    describe('ErrorState', () => {
      it('renders with default message', () => {
        const onRetry = jest.fn();
        const { getByText } = renderWithProviders(
          <ErrorState onRetry={onRetry} />
        );
        
        expect(getByText('Oops!')).toBeTruthy();
        expect(getByText('Something went wrong')).toBeTruthy();
        
        fireEvent.press(getByText('Try Again'));
        expect(onRetry).toHaveBeenCalledTimes(1);
      });

      it('renders with custom message', () => {
        const { getByText } = renderWithProviders(
          <ErrorState message="Network error occurred" />
        );
        
        expect(getByText('Network error occurred')).toBeTruthy();
      });

      it('renders without retry action', () => {
        const { queryByText } = renderWithProviders(
          <ErrorState />
        );
        
        expect(queryByText('Try Again')).toBeNull();
      });
    });

    describe('OfflineState', () => {
      it('renders offline message', () => {
        const onRetry = jest.fn();
        const { getByText, UNSAFE_getByProps } = renderWithProviders(
          <OfflineState onRetry={onRetry} />
        );
        
        expect(getByText('No connection')).toBeTruthy();
        expect(getByText(/check your internet/)).toBeTruthy();
        
        const icon = UNSAFE_getByProps({ name: 'wifi-off' });
        expect(icon).toBeTruthy();
        expect(icon.props.size).toBe(32); // Compact size
        
        fireEvent.press(getByText('Retry'));
        expect(onRetry).toHaveBeenCalledTimes(1);
      });

      it('renders without retry action', () => {
        const { queryByText } = renderWithProviders(
          <OfflineState />
        );
        
        expect(queryByText('Retry')).toBeNull();
      });
    });
  });

  describe('Styling', () => {
    it('applies correct icon color', () => {
      const { UNSAFE_getByProps } = renderWithProviders(
        <EmptyState title="No items" />
      );
      
      const icon = UNSAFE_getByProps({ name: 'inbox' });
      expect(icon.props.color).toBe(colors.textTertiary);
    });

    it('centers content', () => {
      const { UNSAFE_getByType } = renderWithProviders(
        <EmptyState title="No items" />
      );
      
      const container = UNSAFE_getByType(Animated.View);
      const styles = container.props.style;
      
      expect(styles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            alignItems: 'center',
            justifyContent: 'center',
          }),
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      const { getByText } = renderWithProviders(
        <EmptyState title="" />
      );
      
      // Title element should still exist even if empty
      const titleElements = getByText('');
      expect(titleElements).toBeTruthy();
    });

    it('handles long message text', () => {
      const longMessage = 'This is a very long message that should wrap properly and not overflow the container boundaries when displayed in the empty state component';
      const { getByText } = renderWithProviders(
        <EmptyState title="No items" message={longMessage} />
      );
      
      const messageElement = getByText(longMessage);
      expect(messageElement).toBeTruthy();
      
      // Check if style is an array or object and verify properties
      const style = Array.isArray(messageElement.props.style)
        ? messageElement.props.style[0]
        : messageElement.props.style;
      
      expect(style).toMatchObject({
        textAlign: 'center',
        maxWidth: 280,
      });
    });

    it('handles special characters in search term', () => {
      const { getByText } = renderWithProviders(
        <SearchEmpty searchTerm="test@#$%^&*()" />
      );
      
      expect(getByText(/couldn't find anything matching "test@#\$%\^&\*\(\)"/)).toBeTruthy();
    });
  });
});