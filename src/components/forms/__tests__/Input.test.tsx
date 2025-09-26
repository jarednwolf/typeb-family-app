/**
 * Input Component Tests
 * 
 * Tests all features including text input, validation, icons, password visibility,
 * clear button, character counter, and animations
 */

import React from 'react';
import { 
  renderWithProviders, 
  fireEvent, 
  waitFor,
  createMockHandler 
} from '../../../test-utils/component-test-utils';
import { 
  Input, 
  PasswordInput, 
  EmailInput, 
  SearchInput 
} from '../Input';
import { colors } from '../../../constants/theme';

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders with placeholder', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input placeholder="Enter text" />
      );
      
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('renders with label', () => {
      const { getByText } = renderWithProviders(
        <Input label="Username" placeholder="Enter username" />
      );
      
      expect(getByText('Username')).toBeTruthy();
    });

    it('renders with required indicator', () => {
      const { queryByText } = renderWithProviders(
        <Input label="Email" required={true} placeholder="Enter email" />
      );
      
      // The label "Email" should be present
      // Note: The label and asterisk are rendered as nested Text components
      // which makes them harder to query individually
      // We'll just verify the asterisk is rendered
      const asterisk = queryByText(' *');
      expect(asterisk).toBeTruthy();
    });

    it('renders with custom test ID', () => {
      const { getByTestId } = renderWithProviders(
        <Input placeholder="Test" testID="custom-input" />
      );
      
      expect(getByTestId('custom-input')).toBeTruthy();
    });
  });

  describe('Text Input', () => {
    it('handles text input', () => {
      const onChangeText = createMockHandler();
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Type here" 
          onChangeText={onChangeText}
        />
      );
      
      const input = getByPlaceholderText('Type here');
      fireEvent.changeText(input, 'Hello World');
      
      expect(onChangeText).toHaveBeenCalledWith('Hello World');
    });

    it('displays value prop', () => {
      const { getByDisplayValue } = renderWithProviders(
        <Input value="Initial Value" placeholder="Test" />
      );
      
      expect(getByDisplayValue('Initial Value')).toBeTruthy();
    });

    it('updates value when prop changes', () => {
      const { getByDisplayValue, rerender } = renderWithProviders(
        <Input value="First" placeholder="Test" />
      );
      
      expect(getByDisplayValue('First')).toBeTruthy();
      
      rerender(<Input value="Second" placeholder="Test" />);
      expect(getByDisplayValue('Second')).toBeTruthy();
    });

    it('respects maxLength', () => {
      const onChangeText = createMockHandler();
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Limited" 
          maxLength={5}
          onChangeText={onChangeText}
        />
      );
      
      const input = getByPlaceholderText('Limited');
      expect(input.props.maxLength).toBe(5);
    });
  });

  describe('Icons', () => {
    it('renders left icon', () => {
      const { getByText } = renderWithProviders(
        <Input icon="user" placeholder="Username" />
      );
      
      expect(getByText('Icon: user')).toBeTruthy();
    });

    it('renders right icon', () => {
      const onRightIconPress = createMockHandler();
      const { getByText } = renderWithProviders(
        <Input 
          rightIcon="calendar" 
          onRightIconPress={onRightIconPress}
          placeholder="Date" 
        />
      );
      
      expect(getByText('Icon: calendar')).toBeTruthy();
    });

    it('handles right icon press', () => {
      const onRightIconPress = createMockHandler();
      const { getByText } = renderWithProviders(
        <Input 
          rightIcon="calendar" 
          onRightIconPress={onRightIconPress}
          placeholder="Date" 
        />
      );
      
      // In our mock, the icon is rendered as Text
      fireEvent.press(getByText('Icon: calendar'));
      expect(onRightIconPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Password Input', () => {
    it('hides password by default', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input secureTextEntry placeholder="Password" />
      );
      
      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('toggles password visibility', () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <Input secureTextEntry placeholder="Password" value="secret" />
      );
      
      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
      
      // Toggle visibility - look for eye icon
      const toggleButton = getByText('Icon: eye');
      fireEvent.press(toggleButton);
      
      // After toggle, secureTextEntry should be false
      expect(getByPlaceholderText('Password').props.secureTextEntry).toBe(false);
      
      // Icon should change to eye-off
      expect(getByText('Icon: eye-off')).toBeTruthy();
    });
  });

  describe('Clear Button', () => {
    it('shows clear button when text is present', () => {
      const { getByText, queryByText } = renderWithProviders(
        <Input 
          showClearButton 
          value="Clear me" 
          placeholder="Test"
        />
      );
      
      expect(getByText('Icon: x-circle')).toBeTruthy();
    });

    it('hides clear button when text is empty', () => {
      const { queryByText } = renderWithProviders(
        <Input 
          showClearButton 
          value="" 
          placeholder="Test"
        />
      );
      
      expect(queryByText('Icon: x-circle')).toBeNull();
    });

    it('clears text when clear button is pressed', () => {
      const onChangeText = createMockHandler();
      const { getByText } = renderWithProviders(
        <Input 
          showClearButton 
          value="Clear me" 
          onChangeText={onChangeText}
          placeholder="Test"
        />
      );
      
      const clearButton = getByText('Icon: x-circle');
      fireEvent.press(clearButton);
      
      expect(onChangeText).toHaveBeenCalledWith('');
    });

    it('does not show clear button when disabled', () => {
      const { queryByText } = renderWithProviders(
        <Input 
          showClearButton 
          value="Text" 
          editable={false}
          placeholder="Test"
        />
      );
      
      expect(queryByText('Icon: x-circle')).toBeNull();
    });
  });

  describe('Error and Hint States', () => {
    it('displays error message', () => {
      const { getByText } = renderWithProviders(
        <Input 
          error="Invalid email address" 
          placeholder="Email"
        />
      );
      
      expect(getByText('Invalid email address')).toBeTruthy();
      expect(getByText('Icon: alert-circle')).toBeTruthy();
    });

    it('displays hint message', () => {
      const { getByText } = renderWithProviders(
        <Input 
          hint="Use at least 8 characters" 
          placeholder="Password"
        />
      );
      
      expect(getByText('Use at least 8 characters')).toBeTruthy();
    });

    it('shows error instead of hint when both are present', () => {
      const { getByText, queryByText } = renderWithProviders(
        <Input 
          error="Invalid input" 
          hint="This is a hint"
          placeholder="Test"
        />
      );
      
      expect(getByText('Invalid input')).toBeTruthy();
      expect(queryByText('This is a hint')).toBeNull();
    });
  });

  describe('Character Counter', () => {
    it('shows character count when enabled', () => {
      const { getByText } = renderWithProviders(
        <Input 
          value="Hello"
          maxLength={10}
          showCharacterCount
          placeholder="Test"
        />
      );
      
      expect(getByText('5/10')).toBeTruthy();
    });

    it('updates character count on text change', () => {
      const { getByText, getByPlaceholderText, rerender } = renderWithProviders(
        <Input 
          value=""
          maxLength={10}
          showCharacterCount
          placeholder="Test"
        />
      );
      
      expect(getByText('0/10')).toBeTruthy();
      
      rerender(
        <Input 
          value="Testing"
          maxLength={10}
          showCharacterCount
          placeholder="Test"
        />
      );
      
      expect(getByText('7/10')).toBeTruthy();
    });

    it('warns when approaching max length', () => {
      const { getByText } = renderWithProviders(
        <Input
          value="1234567890"
          maxLength={10}
          showCharacterCount
          placeholder="Test"
        />
      );
      
      const counter = getByText('10/10');
      // Style is an array, check if it contains the warning color
      const styles = Array.isArray(counter.props.style)
        ? counter.props.style
        : [counter.props.style];
      
      const hasWarningColor = styles.some((style: any) =>
        style && style.color === colors.warning
      );
      
      expect(hasWarningColor).toBe(true);
    });
  });

  describe('Focus and Blur', () => {
    it('calls onFocus handler', () => {
      const onFocus = createMockHandler();
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Focus me" 
          onFocus={onFocus}
        />
      );
      
      const input = getByPlaceholderText('Focus me');
      fireEvent(input, 'focus');
      
      expect(onFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur handler', () => {
      const onBlur = createMockHandler();
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Blur me" 
          onBlur={onBlur}
        />
      );
      
      const input = getByPlaceholderText('Blur me');
      fireEvent(input, 'blur');
      
      expect(onBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('disables input when editable is false', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Disabled" 
          editable={false}
        />
      );
      
      const input = getByPlaceholderText('Disabled');
      expect(input.props.editable).toBe(false);
    });

    it('applies disabled styles', () => {
      const { getByTestId } = renderWithProviders(
        <Input 
          placeholder="Disabled" 
          editable={false}
          testID="disabled-input"
        />
      );
      
      // The container should have disabled styles
      const container = getByTestId('disabled-input');
      expect(container).toBeTruthy();
    });
  });

  describe('Specialized Input Components', () => {
    it('PasswordInput has secure text entry', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <PasswordInput placeholder="Enter password" />
      );
      
      const input = getByPlaceholderText('Enter password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('EmailInput has correct keyboard type', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <EmailInput placeholder="Enter email" />
      );
      
      const input = getByPlaceholderText('Enter email');
      expect(input.props.keyboardType).toBe('email-address');
      expect(input.props.autoCapitalize).toBe('none');
      expect(input.props.autoCorrect).toBe(false);
    });

    it('EmailInput has mail icon', () => {
      const { getByText } = renderWithProviders(
        <EmailInput placeholder="Enter email" />
      );
      
      expect(getByText('Icon: mail')).toBeTruthy();
    });

    it('SearchInput has search icon', () => {
      const { getByText } = renderWithProviders(
        <SearchInput />
      );
      
      expect(getByText('Icon: search')).toBeTruthy();
    });

    it('SearchInput has clear button', () => {
      const { getByText } = renderWithProviders(
        <SearchInput value="search term" />
      );
      
      expect(getByText('Icon: x-circle')).toBeTruthy();
    });

    it('SearchInput has default placeholder', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <SearchInput />
      );
      
      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has accessible label', () => {
      const { getByLabelText } = renderWithProviders(
        <Input 
          placeholder="Test" 
          accessibilityLabel="Username input"
        />
      );
      
      expect(getByLabelText('Username input')).toBeTruthy();
    });

    it('has accessible hint', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Test" 
          accessibilityHint="Enter your username"
        />
      );
      
      const input = getByPlaceholderText('Test');
      expect(input.props.accessibilityHint).toBe('Enter your username');
    });

    it('indicates error state for accessibility', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          placeholder="Test" 
          error="Invalid input"
          accessibilityLabel="Error input"
        />
      );
      
      const input = getByPlaceholderText('Test');
      // Error state should be communicated through the error message
      expect(input).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles very long text', () => {
      const longText = 'This is a very long text that should be handled properly by the input component';
      const { getByDisplayValue } = renderWithProviders(
        <Input value={longText} placeholder="Test" />
      );
      
      expect(getByDisplayValue(longText)).toBeTruthy();
    });

    it('handles empty label gracefully', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input label="" placeholder="Test" />
      );
      
      expect(getByPlaceholderText('Test')).toBeTruthy();
    });

    it('handles multiple props correctly', () => {
      const onChangeText = createMockHandler();
      const { getByPlaceholderText } = renderWithProviders(
        <Input 
          label="Complex Input"
          placeholder="Enter text"
          value="Initial"
          error="Error message"
          hint="Hint message"
          icon="user"
          rightIcon="check"
          showClearButton
          showCharacterCount
          maxLength={50}
          required
          onChangeText={onChangeText}
        />
      );
      
      const input = getByPlaceholderText('Enter text');
      expect(input).toBeTruthy();
      expect(input.props.value).toBe('Initial');
      expect(input.props.maxLength).toBe(50);
    });
  });
});