import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { configureStore } from '@reduxjs/toolkit';
import CustomCategoryModal from '../../src/components/categories/CustomCategoryModal';
import CreateTaskModal from '../../src/screens/tasks/CreateTaskModal';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import familyReducer from '../../src/store/slices/familySlice';
import authReducer from '../../src/store/slices/authSlice';
import tasksReducer from '../../src/store/slices/tasksSlice';

describe('Custom Categories Premium Feature', () => {
  let store: any;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        family: familyReducer,
        tasks: tasksReducer,
      },
      preloadedState: {
        auth: {
          userProfile: {
            id: 'user1',
            role: 'parent',
            displayName: 'Test Parent',
            familyId: 'family1',
          },
        },
        family: {
          currentFamily: {
            id: 'family1',
            name: 'Test Family',
            isPremium: true,
            taskCategories: [
              { id: '1', name: 'Chores', color: '#10B981', icon: '🏠', order: 1 },
              { id: '2', name: 'School', color: '#3B82F6', icon: '📚', order: 2 },
            ],
          },
          members: [
            { id: 'user1', displayName: 'Parent', role: 'parent' },
            { id: 'user2', displayName: 'Child', role: 'child' },
          ],
        },
        tasks: {
          tasks: [],
        },
      },
    });
  });
  
  describe('CustomCategoryModal', () => {
    it('should render custom category modal', () => {
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
      
      const { getByText, getByPlaceholderText } = render(
        <Provider store={store}>
          <ThemeProvider>
            <CustomCategoryModal
              visible={true}
              onClose={mockOnClose}
              onSave={mockOnSave}
              existingCategories={[]}
            />
          </ThemeProvider>
        </Provider>
      );
      
      expect(getByText('Create Custom Category')).toBeTruthy();
      expect(getByPlaceholderText('Enter category name')).toBeTruthy();
      expect(getByText('Choose Color')).toBeTruthy();
      expect(getByText('Choose Icon')).toBeTruthy();
    });
    
    it('should validate category name', async () => {
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
      
      const { getByText, getByPlaceholderText } = render(
        <Provider store={store}>
          <ThemeProvider>
            <CustomCategoryModal
              visible={true}
              onClose={mockOnClose}
              onSave={mockOnSave}
              existingCategories={[]}
            />
          </ThemeProvider>
        </Provider>
      );
      
      // Try to save without entering a name
      const saveButton = getByText('Create Category');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('Category name is required')).toBeTruthy();
      });
      
      // Enter a name and save
      const nameInput = getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'Custom Task');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Custom Task',
          })
        );
      });
    });
    
    it('should prevent duplicate category names', async () => {
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
      
      const existingCategories = [
        { id: '1', name: 'Chores', color: '#10B981', icon: '🏠', order: 1 },
      ];
      
      const { getByText, getByPlaceholderText } = render(
        <Provider store={store}>
          <ThemeProvider>
            <CustomCategoryModal
              visible={true}
              onClose={mockOnClose}
              onSave={mockOnSave}
              existingCategories={existingCategories}
            />
          </ThemeProvider>
        </Provider>
      );
      
      const nameInput = getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'Chores');
      
      const saveButton = getByText('Create Category');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('Category name already exists')).toBeTruthy();
      });
    });
    
    it('should allow color selection', () => {
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
      
      const { getAllByTestId } = render(
        <Provider store={store}>
          <ThemeProvider>
            <CustomCategoryModal
              visible={true}
              onClose={mockOnClose}
              onSave={mockOnSave}
              existingCategories={[]}
            />
          </ThemeProvider>
        </Provider>
      );
      
      const colorOptions = getAllByTestId(/color-option-/);
      expect(colorOptions.length).toBeGreaterThan(0);
      
      // Select a color
      fireEvent.press(colorOptions[0]);
      // Color should be selected (visual feedback tested in integration tests)
    });
    
    it('should allow icon selection', () => {
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
      
      const { getAllByTestId } = render(
        <Provider store={store}>
          <ThemeProvider>
            <CustomCategoryModal
              visible={true}
              onClose={mockOnClose}
              onSave={mockOnSave}
              existingCategories={[]}
            />
          </ThemeProvider>
        </Provider>
      );
      
      const iconOptions = getAllByTestId(/icon-option-/);
      expect(iconOptions.length).toBeGreaterThan(0);
      
      // Select an icon
      fireEvent.press(iconOptions[0]);
      // Icon should be selected (visual feedback tested in integration tests)
    });
    
    it('should show live preview of category', () => {
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
      
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <Provider store={store}>
          <ThemeProvider>
            <CustomCategoryModal
              visible={true}
              onClose={mockOnClose}
              onSave={mockOnSave}
              existingCategories={[]}
            />
          </ThemeProvider>
        </Provider>
      );
      
      // Enter category name
      const nameInput = getByPlaceholderText('Enter category name');
      fireEvent.changeText(nameInput, 'Fitness');
      
      // Check preview updates
      expect(getByText('Preview')).toBeTruthy();
      expect(getByText('Fitness')).toBeTruthy();
    });
  });
  
  describe('CreateTaskModal with Custom Categories', () => {
    it('should show custom categories in task creation', () => {
      const mockOnClose = jest.fn();
      
      const { getByText } = render(
        <Provider store={store}>
          <ThemeProvider>
            <NavigationContainer>
              <CreateTaskModal
                visible={true}
                onClose={mockOnClose}
              />
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      );
      
      // Should show existing categories
      expect(getByText('Chores')).toBeTruthy();
      expect(getByText('School')).toBeTruthy();
    });
    
    it('should show Add Custom button for premium users', () => {
      const mockOnClose = jest.fn();
      
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <ThemeProvider>
            <NavigationContainer>
              <CreateTaskModal
                visible={true}
                onClose={mockOnClose}
              />
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      );
      
      expect(getByTestId('add-category-button')).toBeTruthy();
      expect(getByText('Add Custom')).toBeTruthy();
    });
    
    it('should not show Add Custom button for free users', () => {
      const freeStore = configureStore({
        reducer: {
          auth: authReducer,
          family: familyReducer,
          tasks: tasksReducer,
        },
        preloadedState: {
          ...store.getState(),
          family: {
            ...store.getState().family,
            currentFamily: {
              ...store.getState().family.currentFamily,
              isPremium: false,
            },
          },
        },
      });
      
      const mockOnClose = jest.fn();
      
      const { queryByTestId } = render(
        <Provider store={freeStore}>
          <ThemeProvider>
            <NavigationContainer>
              <CreateTaskModal
                visible={true}
                onClose={mockOnClose}
              />
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      );
      
      expect(queryByTestId('add-category-button')).toBeFalsy();
    });
    
    it('should open custom category modal when Add Custom is pressed', () => {
      const mockOnClose = jest.fn();
      
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <ThemeProvider>
            <NavigationContainer>
              <CreateTaskModal
                visible={true}
                onClose={mockOnClose}
              />
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      );
      
      const addButton = getByTestId('add-category-button');
      fireEvent.press(addButton);
      
      waitFor(() => {
        expect(getByText('Create Custom Category')).toBeTruthy();
      });
    });
  });
});