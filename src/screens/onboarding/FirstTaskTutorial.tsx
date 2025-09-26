import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import TaskCard from '../../components/cards/TaskCard';
import { useTheme } from '../../contexts/ThemeContext';
import { AppDispatch } from '../../store/store';
import { Task } from '../../types/models';

const FirstTaskTutorial: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { theme, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [taskCompleted, setTaskCompleted] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Sample task for tutorial
  const sampleTask: Task = {
    id: 'tutorial-task',
    title: 'Complete Your First Task',
    description: 'Tap the complete button to finish this task',
    category: { id: '1', name: 'Tutorial', color: '#10B981', icon: 'book', order: 1 },
    assignedTo: 'current-user',
    assignedBy: 'system',
    createdBy: 'system',
    status: taskCompleted ? 'completed' : 'pending',
    requiresPhoto: false,
    isRecurring: false,
    reminderEnabled: false,
    escalationLevel: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    priority: 'medium',
    points: 10,
    familyId: 'tutorial',
  };

  const tutorialSteps = [
    {
      title: 'Welcome to Tasks!',
      description: 'This is where you\'ll see all your family tasks. Let\'s learn how to use them.',
      icon: 'clipboard',
    },
    {
      title: 'Task Cards',
      description: 'Each task shows important details like who it\'s assigned to, when it\'s due, and how many points it\'s worth.',
      icon: 'credit-card',
    },
    {
      title: 'Complete a Task',
      description: 'Try completing the task below by tapping the complete button!',
      icon: 'check-circle',
    },
    {
      title: 'Great Job!',
      description: 'You\'ve completed your first task! You earned 10 points. Keep completing tasks to earn more rewards!',
      icon: 'award',
    },
  ];

  const handleNext = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      if (currentStep === 2 && !taskCompleted) {
        // Don't proceed until task is completed
        return;
      }
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  }, [currentStep, taskCompleted]);

  const handleTaskComplete = useCallback(() => {
    setTaskCompleted(true);
    setTimeout(() => {
      setCurrentStep(3); // Move to final step
    }, 500);
  }, []);

  const handleFinish = useCallback(() => {
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' as never }],
    });
  }, [navigation]);

  const currentStepData = tutorialSteps[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progress}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentStep && styles.progressDotActive,
                index < currentStep && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
        {currentStep < tutorialSteps.length - 1 && (
          <TouchableOpacity
            onPress={handleFinish}
            style={styles.skipButton}
            testID="skip-tutorial"
          >
            <Text style={styles.skipText}>Skip Tutorial</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContent}>
          <View style={[
            styles.iconContainer,
            currentStep === 3 && styles.successIconContainer,
          ]}>
            <Feather
              name={currentStepData.icon as any}
              size={64}
              color={currentStep === 3 ? theme.colors.success : (isDarkMode ? theme.colors.info : theme.colors.primary)}
            />
          </View>
          
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Show task card on step 2 */}
          {currentStep === 2 && (
            <View style={styles.taskDemo}>
              <TaskCard
                task={sampleTask}
                onPress={() => {}}
                onComplete={handleTaskComplete}
              />
              {!taskCompleted && (
                <View style={styles.hint}>
                  <Feather name="arrow-up" size={24} color={theme.colors.info} />
                  <Text style={styles.hintText}>
                    Tap the checkmark to complete the task
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Show completion message on final step */}
          {currentStep === 3 && (
            <Card style={styles.completionCard}>
              <View style={styles.pointsEarned}>
                <Feather name="star" size={32} color={theme.colors.warning} />
                <Text style={styles.pointsText}>+10 Points</Text>
              </View>
              <Text style={styles.completionText}>
                You're all set! Start earning more points by completing real tasks.
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={currentStep === tutorialSteps.length - 1 ? 'Start Using TypeB' : 'Next'}
          onPress={handleNext}
          disabled={currentStep === 2 && !taskCompleted}
          style={styles.nextButton}
          testID="next-button"
        />
      </View>
    </View>
  );
};

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.L,
    paddingTop: 60,
    paddingBottom: theme.spacing.M,
  },
  progress: {
    flexDirection: 'row',
    gap: theme.spacing.S,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textTertiary,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: isDarkMode ? theme.colors.info : theme.colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: theme.colors.success,
  },
  skipButton: {
    padding: theme.spacing.S,
  },
  skipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.L,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: isDarkMode ? theme.colors.backgroundTexture : theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.XL,
  },
  successIconContainer: {
    backgroundColor: theme.colors.success + '10',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.M,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.L,
    marginBottom: theme.spacing.XL,
  },
  taskDemo: {
    width: '100%',
    marginTop: theme.spacing.L,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.L,
    gap: theme.spacing.S,
  },
  hintText: {
    fontSize: 14,
    color: theme.colors.info,
    fontStyle: 'italic',
  },
  completionCard: {
    alignItems: 'center',
    padding: theme.spacing.XL,
    marginTop: theme.spacing.L,
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.S,
    marginBottom: theme.spacing.M,
  },
  pointsText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  completionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: theme.spacing.L,
    paddingBottom: theme.spacing.XXL,
  },
  nextButton: {
    width: '100%',
  },
});

export default FirstTaskTutorial;