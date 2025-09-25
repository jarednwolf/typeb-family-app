/**
 * Performance Debug Screen
 * 
 * Developer-only screen for monitoring app performance metrics
 * Only visible in development mode
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { performanceMonitor, PERFORMANCE_THRESHOLDS } from '../../utils/performance';
// Dev-only generator imported dynamically to avoid app type dependencies
let testDataGenerator: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  testDataGenerator = require('../../../scripts/performance-test-data').testDataGenerator;
} catch {}
import { useTheme } from '../../contexts/ThemeContext';

interface MetricSummary {
  name: string;
  average: number;
  max: number;
  min: number;
  count: number;
  unit: string;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

const PerformanceDebugScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const loadMetrics = useCallback(() => {
    const summary = performanceMonitor.getSummary();
    const report = performanceMonitor.generateReport();
    
    setSessionId(report.sessionId);
    
    // Convert summary to metric array with status
    const metricsList: MetricSummary[] = [];
    
    Object.entries(summary).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'average' in value) {
        const metric = value as any;
        let unit = 'ms';
        let threshold = 1000;
        let status: MetricSummary['status'] = 'good';
        
        // Determine unit and threshold based on metric name
        if (key.includes('memory')) {
          unit = 'MB';
          threshold = PERFORMANCE_THRESHOLDS.MEMORY_NORMAL;
          if (metric.average > PERFORMANCE_THRESHOLDS.MEMORY_HIGH) {
            status = 'critical';
          } else if (metric.average > PERFORMANCE_THRESHOLDS.MEMORY_NORMAL) {
            status = 'warning';
          }
        } else if (key.includes('fps')) {
          unit = 'FPS';
          threshold = PERFORMANCE_THRESHOLDS.SCROLL_FPS_SMOOTH;
          if (metric.average < PERFORMANCE_THRESHOLDS.SCROLL_FPS_POOR) {
            status = 'critical';
          } else if (metric.average < PERFORMANCE_THRESHOLDS.SCROLL_FPS_ACCEPTABLE) {
            status = 'warning';
          }
        } else if (key.includes('render')) {
          threshold = PERFORMANCE_THRESHOLDS.RENDER_NORMAL;
          if (metric.average > PERFORMANCE_THRESHOLDS.RENDER_SLOW) {
            status = 'critical';
          } else if (metric.average > PERFORMANCE_THRESHOLDS.RENDER_NORMAL) {
            status = 'warning';
          }
        } else if (key.includes('api')) {
          threshold = PERFORMANCE_THRESHOLDS.API_NORMAL;
          if (metric.average > PERFORMANCE_THRESHOLDS.API_SLOW) {
            status = 'critical';
          } else if (metric.average > PERFORMANCE_THRESHOLDS.API_NORMAL) {
            status = 'warning';
          }
        } else if (key.includes('screen') || key.includes('navigation')) {
          threshold = PERFORMANCE_THRESHOLDS.SCREEN_LOAD;
          if (metric.average > threshold * 2) {
            status = 'critical';
          } else if (metric.average > threshold) {
            status = 'warning';
          }
        }
        
        metricsList.push({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          average: Math.round(metric.average),
          max: metric.max,
          min: metric.min,
          count: metric.count,
          unit,
          threshold,
          status
        });
      }
    });
    
    setMetrics(metricsList);
  }, []);

  useEffect(() => {
    loadMetrics();
    
    // Refresh metrics every 5 seconds
    const interval = setInterval(loadMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [loadMetrics]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMetrics();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [loadMetrics]);

  const generateTestData = async (numMembers: number, numTasks: number) => {
    setIsGenerating(true);
    
    try {
      Alert.alert(
        'Generate Test Data',
        `This will create ${numMembers} test users and ${numTasks} test tasks. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            style: 'destructive',
            onPress: async () => {
              try {
                if (!testDataGenerator) throw new Error('Generator unavailable in this build');
                await testDataGenerator.generateTestData({
                  numMembers,
                  numTasks,
                  numCompletedTasks: Math.floor(numTasks * 0.3),
                  includeRecurring: true,
                  includePhotos: true,
                  includeOverdue: true
                });
                
                Alert.alert('Success', 'Test data generated successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to generate test data');
                console.error(error);
              } finally {
                setIsGenerating(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      setIsGenerating(false);
    }
  };

  const clearMetrics = () => {
    Alert.alert(
      'Clear Metrics',
      'This will clear all performance metrics. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            performanceMonitor.clear();
            loadMetrics();
            Alert.alert('Success', 'Metrics cleared');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: MetricSummary['status']) => {
    switch (status) {
      case 'good':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'critical':
        return '#FF3B30';
    }
  };

  const getStatusIcon = (status: MetricSummary['status']) => {
    switch (status) {
      case 'good':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'critical':
        return 'alert-circle';
    }
  };

  if (!__DEV__) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Performance Debug</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.notAvailable}>
          <Feather name="lock" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.notAvailableText, { color: theme.colors.textSecondary }]}>
            Performance debugging is only available in development mode
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Performance Debug</Text>
        <TouchableOpacity onPress={clearMetrics}>
          <Feather name="trash-2" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Session Info */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Session Info</Text>
          <Text style={[styles.sessionId, { color: theme.colors.textSecondary }]}>
            ID: {sessionId.substring(0, 8)}...
          </Text>
          <Text style={[styles.metricCount, { color: theme.colors.textSecondary }]}>
            Total Metrics: {metrics.reduce((sum, m) => sum + m.count, 0)}
          </Text>
        </View>

        {/* Test Data Generation */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Test Data Generator</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => generateTestData(10, 100)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Feather name="users" size={16} color="white" />
                  <Text style={styles.testButtonText}>10 Users, 100 Tasks</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => generateTestData(15, 200)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Feather name="users" size={16} color="white" />
                  <Text style={styles.testButtonText}>15 Users, 200 Tasks</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Performance Metrics</Text>
          
          {metrics.length === 0 ? (
            <Text style={[styles.noMetrics, { color: theme.colors.textSecondary }]}>
              No metrics collected yet. Navigate through the app to collect performance data.
            </Text>
          ) : (
            metrics.map((metric, index) => (
              <View key={index} style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Feather 
                    name={getStatusIcon(metric.status) as any} 
                    size={16} 
                    color={getStatusColor(metric.status)} 
                  />
                  <Text style={[styles.metricName, { color: theme.colors.textPrimary }]}>
                    {metric.name}
                  </Text>
                </View>
                
                <View style={styles.metricValues}>
                  <View style={styles.metricValue}>
                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                      Avg
                    </Text>
                    <Text 
                      style={[
                        styles.metricNumber, 
                        { color: getStatusColor(metric.status) }
                      ]}
                    >
                      {metric.average}{metric.unit}
                    </Text>
                  </View>
                  
                  <View style={styles.metricValue}>
                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                      Min
                    </Text>
                    <Text style={[styles.metricNumber, { color: theme.colors.textPrimary }]}>
                      {metric.min}{metric.unit}
                    </Text>
                  </View>
                  
                  <View style={styles.metricValue}>
                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                      Max
                    </Text>
                    <Text style={[styles.metricNumber, { color: theme.colors.textPrimary }]}>
                      {metric.max}{metric.unit}
                    </Text>
                  </View>
                  
                  <View style={styles.metricValue}>
                    <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                      Count
                    </Text>
                    <Text style={[styles.metricNumber, { color: theme.colors.textPrimary }]}>
                      {metric.count}
                    </Text>
                  </View>
                </View>
                
                {metric.threshold && (
                  <Text style={[styles.threshold, { color: theme.colors.textSecondary }]}>
                    Threshold: {metric.threshold}{metric.unit}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Performance Tips */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Performance Tips</Text>
          <View style={styles.tip}>
            <Feather name="info" size={16} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Keep render times under 50ms for smooth 60 FPS performance
            </Text>
          </View>
          <View style={styles.tip}>
            <Feather name="info" size={16} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              API calls should complete within 1 second for good UX
            </Text>
          </View>
          <View style={styles.tip}>
            <Feather name="info" size={16} color={theme.colors.primary} />
            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
              Memory usage should stay below 200MB on mobile devices
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionId: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricCount: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  metricRow: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5E0',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricName: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricValue: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  metricNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  threshold: {
    fontSize: 11,
    marginTop: 4,
  },
  noMetrics: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  notAvailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  notAvailableText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default PerformanceDebugScreen;