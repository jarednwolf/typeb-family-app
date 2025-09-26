import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import AnalyticsDashboard from '../../src/screens/analytics/AnalyticsDashboard';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { createMockStore } from '../../src/test-utils/mockStore';

describe('Analytics Dashboard Premium Feature', () => {
  let store: any;
  
  beforeEach(() => {
    store = createMockStore({
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
          { id: 'user2', displayName: 'Child 1', role: 'child' },
          { id: 'user3', displayName: 'Child 2', role: 'child' },
        ],
      },
      tasks: {
        tasks: [
          {
            id: 'task1',
            title: 'Clean Room',
            status: 'completed',
            assignedTo: 'user2',
            completedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            category: { name: 'Chores', color: '#10B981', icon: '🏠' },
            points: 10,
          },
          {
            id: 'task2',
            title: 'Do Homework',
            status: 'completed',
            assignedTo: 'user3',
            completedAt: new Date().toISOString(),
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            category: { name: 'School', color: '#3B82F6', icon: '📚' },
            points: 15,
          },
          {
            id: 'task3',
            title: 'Exercise',
            status: 'pending',
            assignedTo: 'user2',
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            category: { name: 'Health', color: '#F59E0B', icon: '💪' },
            points: 20,
          },
        ],
        stats: {
          total: 3,
          completed: 2,
          pending: 1,
          overdue: 0,
          completionRate: 67,
        },
      },
    });
  });
  
  it('should render analytics dashboard for premium users', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('Analytics Dashboard')).toBeTruthy();
    expect(getByText('Member Performance')).toBeTruthy();
    expect(getByText('Tasks by Category')).toBeTruthy();
    expect(getByText('Weekly Completion Trend')).toBeTruthy();
  });
  
  it('should display member statistics', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    // Check member names are displayed
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
    
    // Check stats are displayed
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Rate')).toBeTruthy();
    expect(getByText('Avg Time')).toBeTruthy();
  });
  
  it('should display category distribution', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('Chores')).toBeTruthy();
    expect(getByText('School')).toBeTruthy();
    expect(getByText('Health')).toBeTruthy();
  });
  
  it('should display overview statistics', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('Total Tasks')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Completion')).toBeTruthy();
    expect(getByText('67%')).toBeTruthy();
  });
  
  it('should allow period selection', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    const weekButton = getByText('Week');
    const monthButton = getByText('Month');
    const yearButton = getByText('Year');
    
    expect(weekButton).toBeTruthy();
    expect(monthButton).toBeTruthy();
    expect(yearButton).toBeTruthy();
    
    // Test period selection
    fireEvent.press(monthButton);
    // Month should be selected (visual feedback tested in integration tests)
  });
  
  it('should display smart insights for premium users', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    await waitFor(() => {
      expect(getByText('Smart Insights')).toBeTruthy();
    });
  });
  
  it('should calculate member streaks', () => {
    const storeWithStreak = createMockStore({
      ...store.getState(),
      tasks: {
        ...store.getState().tasks,
        tasks: [
          // Tasks completed on consecutive days
          {
            id: 'task1',
            status: 'completed',
            assignedTo: 'user2',
            completedAt: new Date().toISOString(),
          },
          {
            id: 'task2',
            status: 'completed',
            assignedTo: 'user2',
            completedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'task3',
            status: 'completed',
            assignedTo: 'user2',
            completedAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
      },
    });
    
    const { getAllByText } = render(
      <Provider store={storeWithStreak}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    // Should show streak badge
    const streakElements = getAllByText(/\d+d/);
    expect(streakElements.length).toBeGreaterThan(0);
  });
  
  it('should show premium gate for free users', () => {
    const freeStore = createMockStore({
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
      <Provider store={freeStore}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText(/Premium Feature/)).toBeTruthy();
    expect(getByText(/Advanced Analytics/)).toBeTruthy();
  });
  
  it('should handle refresh action', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    // Find and trigger refresh
    const scrollView = getByTestId('analytics-scroll-view');
    const { refreshControl } = scrollView.props;
    
    await waitFor(() => {
      refreshControl.props.onRefresh();
    });
    
    // Check that data is reloaded
    const actions = store.getActions();
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: expect.stringContaining('fetchTaskStats'),
      })
    );
  });
  
  it('should display weekly trend chart', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <NavigationContainer>
            <AnalyticsDashboard />
          </NavigationContainer>
        </ThemeProvider>
      </Provider>
    );
    
    expect(getByText('Weekly Completion Trend')).toBeTruthy();
    
    // Check for day labels
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay();
    const todayLabel = days[(today + 6) % 7]; // Adjust for week starting on Monday
    
    // At least today's label should be visible
    expect(getByText(todayLabel.substring(0, 3))).toBeTruthy();
  });
});