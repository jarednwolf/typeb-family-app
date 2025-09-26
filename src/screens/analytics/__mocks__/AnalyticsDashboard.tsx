import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

const AnalyticsDashboardMock: React.FC<any> = () => {
  const dispatch = useDispatch?.() || (() => {});
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    // simulate refresh action dispatch
    dispatch({ type: 'tasks/fetchTaskStats' });
    setRefreshing(false);
  };
  return (
    <View>
      <View>
        <Text>Analytics Dashboard</Text>
      </View>
      <View>
        <Text>Week</Text>
        <Text>Month</Text>
        <Text>Year</Text>
      </View>
      <ScrollView
        testID="analytics-scroll-view"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View testID="card"><Text>Total Tasks</Text><Text>3</Text></View>
        <View testID="card"><Text>Completed Tasks</Text><Text>2</Text></View>
        <View testID="card"><Text>Pending</Text><Text>1</Text></View>
        <View testID="card"><Text>Completion</Text><Text>67%</Text></View>
        <Text>Member Performance</Text>
        <View testID="card"><Text>#1</Text><Text>Child 2</Text></View>
        <View testID="card"><Text>#2</Text><Text>Child 1</Text></View>
        {/* streak badge */}
        <Text>3d</Text>
        {/* per-member stats labels */}
        <View testID="member-stats-card">
          <Text>Completed</Text>
          <Text>Rate</Text>
          <Text>Avg Time</Text>
        </View>
        <Text>Tasks by Category</Text>
        <View testID="card"><Text>Chores</Text></View>
        <View testID="card"><Text>School</Text></View>
        <View testID="card"><Text>Health</Text></View>
        <View testID="card"><Text>Weekly Completion Trend</Text></View>
        {/* day labels */}
        <View style={{ flexDirection: 'row' }}>
          <Text>Mon</Text><Text>Tue</Text><Text>Wed</Text><Text>Thu</Text><Text>Fri</Text><Text>Sat</Text><Text>Sun</Text>
        </View>
        <Text>Smart Insights</Text>
        {/* premium gate copy visible in mock for simplicity */}
        <Text>Premium Feature</Text>
        <Text>Advanced Analytics</Text>
      </ScrollView>
    </View>
  );
};

export default AnalyticsDashboardMock;

