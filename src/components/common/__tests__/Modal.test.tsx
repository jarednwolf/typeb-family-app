import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import Modal, { BottomSheet, FullScreenModal } from '../Modal';

// Mock Animated API
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
    parallel: (animations: any[]) => ({
      start: (callback?: any) => {
        animations.forEach(anim => anim.start && anim.start());
        callback && callback({ finished: true });
      },
      stop: jest.fn(),
    }),
  };
});

describe('Modal Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders when visible', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()}>
          <Text>Modal Content</Text>
        </Modal>
      );
      
      expect(getByText('Modal Content')).toBeTruthy();
    });

    it('does not render content when not visible', () => {
      const { queryByText } = render(
        <Modal visible={false} onClose={jest.fn()}>
          <Text>Modal Content</Text>
        </Modal>
      );
      
      expect(queryByText('Modal Content')).toBeNull();
    });

    it('renders with title', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()} title="Modal Title">
          <Text>Content</Text>
        </Modal>
      );
      
      expect(getByText('Modal Title')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()} title="Title" subtitle="Modal Subtitle">
          <Text>Content</Text>
        </Modal>
      );
      
      expect(getByText('Modal Subtitle')).toBeTruthy();
    });

    it('renders with custom footer', () => {
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          footer={<Text>Custom Footer</Text>}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      expect(getByText('Custom Footer')).toBeTruthy();
    });

    it('renders close button by default', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()} title="Title">
          <Text>Content</Text>
        </Modal>
      );
      
      // Close button is rendered as an icon (mocked as text)
      expect(getByText('Icon: x')).toBeTruthy();
    });

    it('hides close button when showCloseButton is false', () => {
      const { queryByText } = render(
        <Modal visible={true} onClose={jest.fn()} title="Title" showCloseButton={false}>
          <Text>Content</Text>
        </Modal>
      );
      
      expect(queryByText('Icon: x')).toBeNull();
    });
  });

  // Action buttons tests
  describe('Action Buttons', () => {
    it('renders primary action button', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          primaryAction={{
            label: 'Confirm',
            onPress
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      expect(getByText('Confirm')).toBeTruthy();
    });

    it('renders secondary action button', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          secondaryAction={{
            label: 'Cancel',
            onPress
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('renders both action buttons', () => {
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          primaryAction={{
            label: 'Save',
            onPress: jest.fn()
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: jest.fn()
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      expect(getByText('Save')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('handles primary action press', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          primaryAction={{
            label: 'Confirm',
            onPress
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      fireEvent.press(getByText('Confirm'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('handles secondary action press', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          secondaryAction={{
            label: 'Cancel',
            onPress
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      fireEvent.press(getByText('Cancel'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('disables primary action when disabled prop is true', () => {
      const { getByText } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          primaryAction={{
            label: 'Save',
            onPress: jest.fn(),
            disabled: true
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      const button = getByText('Save');
      expect(button.parent.props.accessibilityState?.disabled).toBe(true);
    });

    it('shows loading state on primary action', () => {
      const { getByTestId } = render(
        <Modal 
          visible={true} 
          onClose={jest.fn()}
          primaryAction={{
            label: 'Save',
            onPress: jest.fn(),
            loading: true
          }}
        >
          <Text>Content</Text>
        </Modal>
      );
      
      // Loading indicator should be present
      expect(getByTestId('button-loading')).toBeTruthy();
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('calls onClose when close button is pressed', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <Modal visible={true} onClose={onClose} title="Title">
          <Text>Content</Text>
        </Modal>
      );
      
      const closeButton = getByText('Icon: x');
      fireEvent.press(closeButton.parent);
      
      // Animation completes and then onClose is called
      waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('calls onClose when backdrop is pressed with closeOnBackdrop true', () => {
      const onClose = jest.fn();
      const { UNSAFE_getByType } = render(
        <Modal visible={true} onClose={onClose} closeOnBackdrop={true}>
          <Text>Content</Text>
        </Modal>
      );
      
      // Find the backdrop TouchableOpacity
      const touchables = UNSAFE_getByType('TouchableOpacity' as any);
      if (Array.isArray(touchables)) {
        fireEvent.press(touchables[0]);
      } else {
        fireEvent.press(touchables);
      }
      
      waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not call onClose when backdrop is pressed with closeOnBackdrop false', () => {
      const onClose = jest.fn();
      const { UNSAFE_getByType } = render(
        <Modal visible={true} onClose={onClose} closeOnBackdrop={false}>
          <Text>Content</Text>
        </Modal>
      );
      
      const touchables = UNSAFE_getByType('TouchableOpacity' as any);
      if (Array.isArray(touchables)) {
        fireEvent.press(touchables[0]);
      } else {
        fireEvent.press(touchables);
      }
      
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // Full screen mode tests
  describe('Full Screen Mode', () => {
    it('renders in full screen mode', () => {
      const { getByText, UNSAFE_queryByType } = render(
        <Modal visible={true} onClose={jest.fn()} fullScreen={true}>
          <Text>Full Screen Content</Text>
        </Modal>
      );
      
      expect(getByText('Full Screen Content')).toBeTruthy();
      
      // Drag indicator should not be present in full screen mode
      const views = UNSAFE_queryByType('View' as any);
      const hasDragIndicator = Array.isArray(views) 
        ? views.some(v => v.props.style?.height === 4)
        : false;
      expect(hasDragIndicator).toBe(false);
    });

    it('renders drag indicator when not full screen', () => {
      const { UNSAFE_queryByType } = render(
        <Modal visible={true} onClose={jest.fn()} fullScreen={false}>
          <Text>Content</Text>
        </Modal>
      );
      
      // Check for drag indicator (a View with specific styles)
      const views = UNSAFE_queryByType('View' as any);
      const hasDragIndicator = Array.isArray(views) 
        ? views.some(v => {
            const style = v.props.style;
            return style && (
              (Array.isArray(style) && style.some(s => s?.height === 4)) ||
              style.height === 4
            );
          })
        : false;
      expect(hasDragIndicator).toBe(true);
    });
  });

  // Scrollable content tests
  describe('Scrollable Content', () => {
    it('renders content in ScrollView when scrollable is true', () => {
      const { UNSAFE_queryByType } = render(
        <Modal visible={true} onClose={jest.fn()} scrollable={true}>
          <Text>Scrollable Content</Text>
        </Modal>
      );
      
      const scrollView = UNSAFE_queryByType('ScrollView' as any);
      expect(scrollView).toBeTruthy();
    });

    it('renders content in View when scrollable is false', () => {
      const { UNSAFE_queryByType, getByText } = render(
        <Modal visible={true} onClose={jest.fn()} scrollable={false}>
          <Text>Non-scrollable Content</Text>
        </Modal>
      );
      
      expect(getByText('Non-scrollable Content')).toBeTruthy();
      const scrollView = UNSAFE_queryByType('ScrollView' as any);
      expect(scrollView).toBeNull();
    });
  });

  // Complex children tests
  describe('Complex Content', () => {
    it('renders complex nested children', () => {
      const { getByText } = render(
        <Modal visible={true} onClose={jest.fn()}>
          <View>
            <Text>Parent</Text>
            <View>
              <Text>Child 1</Text>
              <Text>Child 2</Text>
            </View>
          </View>
        </Modal>
      );
      
      expect(getByText('Parent')).toBeTruthy();
      expect(getByText('Child 1')).toBeTruthy();
      expect(getByText('Child 2')).toBeTruthy();
    });

    it('renders with all props simultaneously', () => {
      const onClose = jest.fn();
      const onPrimary = jest.fn();
      const onSecondary = jest.fn();
      
      const { getByText } = render(
        <Modal
          visible={true}
          onClose={onClose}
          title="Complete Modal"
          subtitle="With all features"
          showCloseButton={true}
          closeOnBackdrop={true}
          fullScreen={false}
          scrollable={true}
          primaryAction={{
            label: 'Save',
            onPress: onPrimary,
            loading: false,
            disabled: false
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: onSecondary
          }}
          footer={<Text>Custom Footer Override</Text>}
        >
          <Text>Complex Content</Text>
        </Modal>
      );
      
      expect(getByText('Complete Modal')).toBeTruthy();
      expect(getByText('With all features')).toBeTruthy();
      expect(getByText('Complex Content')).toBeTruthy();
      expect(getByText('Custom Footer Override')).toBeTruthy();
      expect(getByText('Icon: x')).toBeTruthy();
    });
  });
});

describe('BottomSheet Component', () => {
  it('renders as bottom sheet (not full screen)', () => {
    const { getByText } = render(
      <BottomSheet visible={true} onClose={jest.fn()}>
        <Text>Bottom Sheet Content</Text>
      </BottomSheet>
    );
    
    expect(getByText('Bottom Sheet Content')).toBeTruthy();
  });

  it('passes props correctly to Modal', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <BottomSheet 
        visible={true} 
        onClose={onClose}
        title="Bottom Sheet Title"
      >
        <Text>Content</Text>
      </BottomSheet>
    );
    
    expect(getByText('Bottom Sheet Title')).toBeTruthy();
  });
});

describe('FullScreenModal Component', () => {
  it('renders as full screen modal', () => {
    const { getByText } = render(
      <FullScreenModal visible={true} onClose={jest.fn()}>
        <Text>Full Screen Modal Content</Text>
      </FullScreenModal>
    );
    
    expect(getByText('Full Screen Modal Content')).toBeTruthy();
  });

  it('passes props correctly to Modal', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <FullScreenModal 
        visible={true} 
        onClose={onClose}
        title="Full Screen Title"
      >
        <Text>Content</Text>
      </FullScreenModal>
    );
    
    expect(getByText('Full Screen Title')).toBeTruthy();
  });
});

// Edge cases
describe('Modal Edge Cases', () => {
  it('handles visibility change from false to true', () => {
    const { rerender, getByText, queryByText } = render(
      <Modal visible={false} onClose={jest.fn()}>
        <Text>Dynamic Content</Text>
      </Modal>
    );
    
    expect(queryByText('Dynamic Content')).toBeNull();
    
    rerender(
      <Modal visible={true} onClose={jest.fn()}>
        <Text>Dynamic Content</Text>
      </Modal>
    );
    
    expect(getByText('Dynamic Content')).toBeTruthy();
  });

  it('handles visibility change from true to false', () => {
    const { rerender, queryByText } = render(
      <Modal visible={true} onClose={jest.fn()}>
        <Text>Dynamic Content</Text>
      </Modal>
    );
    
    expect(queryByText('Dynamic Content')).toBeTruthy();
    
    rerender(
      <Modal visible={false} onClose={jest.fn()}>
        <Text>Dynamic Content</Text>
      </Modal>
    );
    
    expect(queryByText('Dynamic Content')).toBeNull();
  });

  it('renders without title or subtitle', () => {
    const { getByText, queryByText } = render(
      <Modal visible={true} onClose={jest.fn()}>
        <Text>Just Content</Text>
      </Modal>
    );
    
    expect(getByText('Just Content')).toBeTruthy();
    expect(queryByText('Title')).toBeNull();
    expect(queryByText('Subtitle')).toBeNull();
  });

  it('renders without any actions', () => {
    const { getByText, queryByText } = render(
      <Modal visible={true} onClose={jest.fn()}>
        <Text>No Actions</Text>
      </Modal>
    );
    
    expect(getByText('No Actions')).toBeTruthy();
    expect(queryByText('Save')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });
});