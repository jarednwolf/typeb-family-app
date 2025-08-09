import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import configureStore from 'redux-mock-store';
import PhotoValidationScreen from '../../src/screens/tasks/PhotoValidationScreen';
import { ThemeProvider } from '../../src/contexts/ThemeContext';

const mockStore = configureStore([]);

describe('Photo Validation Premium Feature', () => {
  let store: any;
  
  beforeEach(() => {
    store = mockStore({
      auth: {
        userProfile: {
          id: 'user1',
          role: 'parent',
          displayName: 'Test Parent',
        },
      },
      family: {
        currentFamily: {
          id: 'family1',
          name: 'Test Family',
          isPremium: true,
        },
        members: [
          { id: 'user1', displayName: 'Parent', role: 'parent' },
          { id: 'user2', displayName: 'Child', role: 'child' },
        ],
      },
      tasks: {
        tasks: [
          {
            id: 'task1',
            title: 'Clean Room',
            status: 'completed',
            requiresPhoto: true,
            photoUrl: 'https://example.com/photo1.jpg',
            validationStatus: 'pending',
            assignedTo: 'user2',
            completedAt: new Date().toISOString(),
            category: { name: 'Chores', color: '#10B981', icon: '🏠' },
            points: 10,
          },
          {
            id: 'task2',
            title: 'Do Homework',
            status: 'completed',
            requiresPhoto: true,
            photoUrl: 'https://example.com/photo2.jpg',
            validationStatus: 'pending',
            assignedTo: 'user2',
            completedAt: new Date().toISOString(),
            category: { name: 'School', color: '#3B82F6', icon: '📚' },
            points: 15,
          },
        ],
        isLoading: false,
      },
    });
  });
  
  it('should render photo validation queue for managers', () => {
    const { getByText, getAllByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('Photo Validation Queue')).toBeTruthy();
    expect(getByText('Tasks Awaiting Validation (2)')).toBeTruthy();
    expect(getByText('Clean Room')).toBeTruthy();
    expect(getByText('Do Homework')).toBeTruthy();
  });
  
  it('should show access restricted for non-managers', () => {
    store = mockStore({
      ...store.getState(),
      auth: {
        userProfile: {
          id: 'user2',
          role: 'child',
          displayName: 'Test Child',
        },
      },
    });
    
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('Access Restricted')).toBeTruthy();
    expect(getByText(/Only.*can review and validate task photos/)).toBeTruthy();
  });
  
  it('should open task detail modal when tapping on validation item', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    const taskCard = getByText('Clean Room');
    fireEvent.press(taskCard);
    
    // Modal should open with review options
    waitFor(() => {
      expect(getByText('Review Task Completion')).toBeTruthy();
      expect(getByText('Approve')).toBeTruthy();
      expect(getByText('Reject')).toBeTruthy();
    });
  });
  
  it('should handle photo approval', async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    // Open task detail
    fireEvent.press(getByText('Clean Room'));
    
    await waitFor(() => {
      const approveButton = getByText('Approve');
      fireEvent.press(approveButton);
    });
    
    // Check that validation action was dispatched
    const actions = store.getActions();
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: expect.stringContaining('validate'),
      })
    );
  });
  
  it('should handle photo rejection with notes', async () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    // Open task detail
    fireEvent.press(getByText('Clean Room'));
    
    await waitFor(() => {
      const notesInput = getByPlaceholderText('Add any feedback or notes...');
      fireEvent.changeText(notesInput, 'Photo is too blurry');
      
      const rejectButton = getByText('Reject');
      fireEvent.press(rejectButton);
    });
    
    // Check that validation action was dispatched with notes
    const actions = store.getActions();
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: expect.stringContaining('validate'),
        payload: expect.objectContaining({
          notes: 'Photo is too blurry',
        }),
      })
    );
  });
  
  it('should show empty state when no tasks pending validation', () => {
    store = mockStore({
      ...store.getState(),
      tasks: {
        tasks: [],
        isLoading: false,
      },
    });
    
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('All Caught Up!')).toBeTruthy();
    expect(getByText('No tasks pending photo validation.')).toBeTruthy();
  });
  
  it('should require premium for photo validation feature', () => {
    store = mockStore({
      ...store.getState(),
      family: {
        ...store.getState().family,
        currentFamily: {
          ...store.getState().family.currentFamily,
          isPremium: false,
        },
      },
    });
    
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <PhotoValidationScreen />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    // Should show premium gate
    expect(getByText(/Premium Feature/)).toBeTruthy();
  });
});