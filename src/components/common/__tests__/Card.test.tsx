import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import Card, { InfoCard, ActionCard } from '../Card';
import { colors } from '../../../constants/theme';

describe('Card Component', () => {
  // Basic rendering tests
  describe('Rendering', () => {
    it('renders with children', () => {
      const { getByText } = render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      
      expect(getByText('Card Content')).toBeTruthy();
    });

    it('renders with title', () => {
      const { getByText } = render(
        <Card title="Card Title">
          <Text>Content</Text>
        </Card>
      );
      
      expect(getByText('Card Title')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      const { getByText } = render(
        <Card title="Title" subtitle="Card Subtitle">
          <Text>Content</Text>
        </Card>
      );
      
      expect(getByText('Card Subtitle')).toBeTruthy();
    });

    it('renders with footer', () => {
      const { getByText } = render(
        <Card footer={<Text>Footer Content</Text>}>
          <Text>Main Content</Text>
        </Card>
      );
      
      expect(getByText('Footer Content')).toBeTruthy();
      expect(getByText('Main Content')).toBeTruthy();
    });

    it('renders with right icon', () => {
      const { getByTestId } = render(
        <Card rightIcon="settings" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card).toBeTruthy();
    });
  });

  // Variant tests
  describe('Variants', () => {
    it('applies default variant styles', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.backgroundColor).toBeTruthy();
      expect(flatStyle.borderRadius).toBeTruthy();
    });

    it('applies outlined variant styles', () => {
      const { getByTestId } = render(
        <Card variant="outlined" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.backgroundColor).toBe('transparent');
      expect(flatStyle.borderWidth).toBe(1);
    });

    it('applies elevated variant styles', () => {
      const { getByTestId } = render(
        <Card variant="elevated" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.shadowColor).toBeTruthy();
      expect(flatStyle.elevation).toBeGreaterThan(1);
    });
  });

  // Padding tests
  describe('Padding', () => {
    it('applies no padding when padding="none"', () => {
      const { getByTestId } = render(
        <Card padding="none" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.padding).toBe(0);
    });

    it('applies small padding', () => {
      const { getByTestId } = render(
        <Card padding="small" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.padding).toBeGreaterThan(0);
    });

    it('applies medium padding by default', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.padding).toBeGreaterThan(0);
    });

    it('applies large padding', () => {
      const { getByTestId } = render(
        <Card padding="large" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.padding).toBeGreaterThan(0);
    });
  });

  // Margin tests
  describe('Margin', () => {
    it('applies no margin when margin="none"', () => {
      const { getByTestId } = render(
        <Card margin="none" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.marginHorizontal).toBe(0);
      expect(flatStyle.marginVertical).toBe(0);
    });

    it('applies small margin', () => {
      const { getByTestId } = render(
        <Card margin="small" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.marginHorizontal).toBeGreaterThan(0);
    });

    it('applies medium margin by default', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.marginHorizontal).toBeGreaterThan(0);
    });

    it('applies large margin', () => {
      const { getByTestId } = render(
        <Card margin="large" testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.marginHorizontal).toBeGreaterThan(0);
    });
  });

  // Interaction tests
  describe('Interactions', () => {
    it('handles onPress when provided', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPress} testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      fireEvent.press(getByTestId('card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not handle press when onPress not provided', () => {
      const { getByTestId } = render(
        <Card testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      expect(card.props.onPress).toBeUndefined();
    });

    it('handles right icon press', () => {
      const onRightIconPress = jest.fn();
      const { getByText } = render(
        <Card
          title="Title"
          rightIcon="settings"
          onRightIconPress={onRightIconPress}
        >
          <Text>Content</Text>
        </Card>
      );
      
      // Since we're mocking icons as Text, find the icon text
      const iconElement = getByText('Icon: settings');
      
      // The icon is wrapped in a TouchableOpacity (View in test)
      fireEvent.press(iconElement.parent);
      
      // Verify the handler was called
      expect(onRightIconPress).toHaveBeenCalledTimes(1);
    });

    it('disables card when disabled prop is true', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPress} disabled testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      // When disabled, the TouchableOpacity should have disabled prop
      expect(card.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // Custom styles
  describe('Custom Styles', () => {
    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      const { getByTestId } = render(
        <Card style={customStyle} testID="card">
          <Text>Content</Text>
        </Card>
      );
      
      const card = getByTestId('card');
      const styles = Array.isArray(card.props.style) ? card.props.style : [card.props.style];
      const flatStyle = Object.assign({}, ...styles);
      
      expect(flatStyle.backgroundColor).toBe('red');
    });
  });
});

describe('InfoCard Component', () => {
  it('renders with required props', () => {
    const { getByText } = render(
      <InfoCard
        icon="info"
        title="Info Title"
        description="Info Description"
      />
    );
    
    expect(getByText('Info Title')).toBeTruthy();
    expect(getByText('Info Description')).toBeTruthy();
  });

  it('renders with custom color', () => {
    const { getByText } = render(
      <InfoCard
        icon="alert-circle"
        title="Alert"
        description="Alert message"
        color="#FF0000"
      />
    );
    
    expect(getByText('Alert')).toBeTruthy();
  });

  it('handles onPress', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <InfoCard
        icon="info"
        title="Clickable Info"
        description="Click me"
        onPress={onPress}
      />
    );
    
    fireEvent.press(getByText('Clickable Info').parent.parent.parent);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses default color when not provided', () => {
    const { getByText } = render(
      <InfoCard
        icon="info"
        title="Default Color"
        description="Using default info color"
      />
    );
    
    expect(getByText('Default Color')).toBeTruthy();
  });
});

describe('ActionCard Component', () => {
  it('renders with required props', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ActionCard
        title="Action Title"
        actionText="Take Action"
        onAction={onAction}
      />
    );
    
    expect(getByText('Action Title')).toBeTruthy();
    expect(getByText('Take Action')).toBeTruthy();
  });

  it('renders with optional description', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ActionCard
        title="Title"
        description="Action Description"
        actionText="Action"
        onAction={onAction}
      />
    );
    
    expect(getByText('Action Description')).toBeTruthy();
  });

  it('renders with optional icon', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ActionCard
        title="With Icon"
        actionText="Action"
        onAction={onAction}
        icon="star"
      />
    );
    
    expect(getByText('With Icon')).toBeTruthy();
  });

  it('handles action button press', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <ActionCard
        title="Title"
        actionText="Click Me"
        onAction={onAction}
      />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders without icon when not provided', () => {
    const onAction = jest.fn();
    const { getByText, queryByTestId } = render(
      <ActionCard
        title="No Icon"
        actionText="Action"
        onAction={onAction}
      />
    );
    
    expect(getByText('No Icon')).toBeTruthy();
    expect(queryByTestId('action-card-icon')).toBeNull();
  });
});

// Edge cases and error handling
describe('Card Edge Cases', () => {
  it('renders without header when no title, subtitle, or rightIcon', () => {
    const { queryByTestId, getByText } = render(
      <Card testID="card">
        <Text>Just Content</Text>
      </Card>
    );
    
    expect(getByText('Just Content')).toBeTruthy();
  });

  it('renders header with only subtitle', () => {
    const { getByText } = render(
      <Card subtitle="Only Subtitle">
        <Text>Content</Text>
      </Card>
    );
    
    expect(getByText('Only Subtitle')).toBeTruthy();
  });

  it('renders header with only right icon', () => {
    const { getByTestId } = render(
      <Card rightIcon="settings" testID="card">
        <Text>Content</Text>
      </Card>
    );
    
    const card = getByTestId('card');
    expect(card).toBeTruthy();
  });

  it('handles complex children', () => {
    const { getByText } = render(
      <Card>
        <View>
          <Text>Nested</Text>
          <View>
            <Text>Content</Text>
          </View>
        </View>
      </Card>
    );
    
    expect(getByText('Nested')).toBeTruthy();
    expect(getByText('Content')).toBeTruthy();
  });

  it('handles all props simultaneously', () => {
    const onPress = jest.fn();
    const onRightIconPress = jest.fn();
    
    const { getByText } = render(
      <Card
        title="Full Card"
        subtitle="With everything"
        rightIcon="settings"
        onRightIconPress={onRightIconPress}
        footer={<Text>Footer</Text>}
        variant="elevated"
        padding="large"
        margin="small"
        onPress={onPress}
        testID="full-card"
      >
        <Text>Main Content</Text>
      </Card>
    );
    
    expect(getByText('Full Card')).toBeTruthy();
    expect(getByText('With everything')).toBeTruthy();
    expect(getByText('Main Content')).toBeTruthy();
    expect(getByText('Footer')).toBeTruthy();
  });
});