import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import photoAnalysisService from '../../services/photoAnalysis';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/userSlice';
import * as Haptics from 'expo-haptics';
import * as Sentry from '@sentry/react-native';

interface Task {
  id: string;
  title: string;
  description?: string;
  photoUrl?: string;
  photoUploadedBy?: string;
  photoUploadedAt?: string;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  taskType?: string;
  assignedTo?: string;
  points?: number;
}

interface PhotoValidationProps {
  task: Task;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onClose?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const PhotoValidation: React.FC<PhotoValidationProps> = ({
  task,
  onApprove,
  onReject,
  onClose,
}) => {
  const theme = useTheme();
  const colors = theme.colors;
  const currentUser = useSelector(selectCurrentUser);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [aiLabels, setAiLabels] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  useEffect(() => {
    if (task.photoUrl) {
      analyzePhoto();
    }
  }, [task.photoUrl]);

  const analyzePhoto = async () => {
    if (!task.photoUrl) return;
    
    setIsAnalyzing(true);
    try {
      const result = await photoAnalysisService.validateTaskPhoto(
        task.photoUrl,
        task.id,
        task.taskType || 'general'
      );
      
      setAiConfidence(result.confidence);
      
      // Get suggested labels for this task type
      const labels = photoAnalysisService.getSuggestedLabels(task.taskType || 'general');
      setAiLabels(labels);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      Sentry.captureException(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Approve Task',
      'Are you sure you want to approve this task completion?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              // Update task status
              await updateDoc(doc(db, 'tasks', task.id), {
                validationStatus: 'approved',
                approvedBy: currentUser?.uid,
                approvedAt: new Date().toISOString(),
                status: 'completed',
                completedAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
              });

              // Award points if applicable
              if (task.points && task.assignedTo) {
                await awardPoints(task.assignedTo, task.points);
              }

              // Log validation event
              await logValidationEvent('approved');

              onApprove();
            } catch (error) {
              console.error('Error approving task:', error);
              Sentry.captureException(error);
              Alert.alert('Error', 'Failed to approve task. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    
    setIsProcessing(true);
    try {
      // Update task status
      await updateDoc(doc(db, 'tasks', task.id), {
        validationStatus: 'rejected',
        rejectedBy: currentUser?.uid,
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason.trim(),
        status: 'pending', // Reset to pending for retry
        lastModified: new Date().toISOString(),
      });

      // Log validation event
      await logValidationEvent('rejected', rejectionReason);

      onReject(rejectionReason);
      setShowRejectionInput(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting task:', error);
      Sentry.captureException(error);
      Alert.alert('Error', 'Failed to reject task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const awardPoints = async (userId: string, points: number) => {
    try {
      // This would typically update the user's points in Firestore
      // and potentially trigger achievements
      await addDoc(collection(db, 'pointsHistory'), {
        userId,
        taskId: task.id,
        points,
        awardedAt: new Date().toISOString(),
        awardedBy: currentUser?.uid,
        reason: `Task completed: ${task.title}`,
      });
    } catch (error) {
      console.error('Error awarding points:', error);
      Sentry.captureException(error);
    }
  };

  const logValidationEvent = async (action: string, reason?: string) => {
    try {
      await addDoc(collection(db, 'validationHistory'), {
        taskId: task.id,
        action,
        reason,
        performedBy: currentUser?.uid,
        timestamp: new Date().toISOString(),
        aiConfidence,
        photoUrl: task.photoUrl,
      });
    } catch (error) {
      console.error('Error logging validation event:', error);
    }
  };

  const renderQuickReasons = () => {
    const quickReasons = [
      'Photo is unclear',
      'Task not completed properly',
      'Wrong task shown',
      'Need better angle',
      'Please retake photo',
    ];

    return quickReasons.map((reason) => (
      <TouchableOpacity
        key={reason}
        style={[styles.quickReasonChip, { backgroundColor: colors.surface }]}
        onPress={() => setRejectionReason(reason)}
      >
        <Text style={[styles.quickReasonText, { color: colors.textPrimary }]}> 
          {reason}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.taskTitle, { color: colors.textPrimary }]}> 
            {task.title}
          </Text>
          {task.description && (
            <Text style={[styles.taskDescription, { color: colors.textSecondary }]}> 
              {task.description}
            </Text>
          )}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose}> 
            <Ionicons name="close" size={24} color={colors.textPrimary} /> 
          </TouchableOpacity>
        )}
      </View>

      {task.photoUrl && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setImageZoomed(!imageZoomed)}
        >
          <Image
            source={{ uri: task.photoUrl }}
            style={[
              styles.photo,
              imageZoomed && styles.photoZoomed,
            ]}
            resizeMode={imageZoomed ? 'contain' : 'cover'}
          />
          <View style={styles.zoomHint}>
            <Ionicons
              name={imageZoomed ? 'contract' : 'expand'}
              size={20}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>
      )}

      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color={colors.primary} /> 
          <Text style={[styles.analyzingText, { color: colors.textPrimary }]}> 
            Analyzing photo with AI...
          </Text>
        </View>
      ) : aiConfidence !== null && (
        <View style={[styles.aiCard, { backgroundColor: colors.surface }]}> 
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.aiTitle, { color: colors.textPrimary }]}> 
              AI Analysis
            </Text>
          </View>
          
          <View style={styles.confidenceContainer}>
            <Text style={[styles.confidenceLabel, { color: colors.textPrimary }]}> 
              Confidence Score:
            </Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${aiConfidence * 100}%`,
                    backgroundColor:
                      aiConfidence > 0.7
                        ? colors.success
                        : aiConfidence > 0.4
                        ? colors.warning
                        : colors.error,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.confidencePercent,
                {
                  color:
                    aiConfidence > 0.7
                      ? colors.success
                      : aiConfidence > 0.4
                      ? colors.warning
                      : colors.error,
                },
              ]}
            >
              {Math.round(aiConfidence * 100)}%
            </Text>
          </View>

          {aiLabels.length > 0 && (
            <View style={styles.labelsContainer}>
              <Text style={[styles.labelsTitle, { color: colors.textPrimary }]}> 
                Expected elements:
              </Text>
              <View style={styles.labels}>
                {aiLabels.map((label, index) => (
                  <View
                    key={index}
                    style={[styles.label, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Text style={[styles.labelText, { color: colors.primary }]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {showRejectionInput ? (
        <View style={[styles.rejectionContainer, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.rejectionTitle, { color: colors.textPrimary }]}> 
            Reason for Rejection
          </Text>
          
          <View style={styles.quickReasons}>
            {renderQuickReasons()}
          </View>

          <TextInput
            style={[
              styles.rejectionInput,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.separator,
              },
            ]}
            placeholder="Or type your own reason..."
            placeholderTextColor={colors.textSecondary}
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <View style={styles.rejectionActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                setShowRejectionInput(false);
                setRejectionReason('');
              }}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}> 
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmRejectButton,
                { 
                  backgroundColor: colors.error,
                  opacity: isProcessing || !rejectionReason.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.rejectButton,
              { 
                backgroundColor: colors.error,
                opacity: isProcessing ? 0.5 : 1,
              },
            ]}
            onPress={() => setShowRejectionInput(true)}
            disabled={isProcessing}
          >
            <Ionicons name="close-circle" size={24} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.approveButton,
              { 
                backgroundColor: colors.success,
                opacity: isProcessing ? 0.5 : 1,
              },
            ]}
            onPress={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {task.points && (
        <View style={[styles.pointsInfo, { backgroundColor: colors.surface }]}> 
          <Ionicons name="star" size={20} color={colors.warning} />
          <Text style={[styles.pointsText, { color: colors.textPrimary }]}> 
            {task.points} points will be awarded upon approval
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  photo: {
    width: screenWidth,
    height: screenWidth * 0.75,
    resizeMode: 'cover',
  },
  photoZoomed: {
    height: screenWidth * 1.2,
  },
  zoomHint: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  analyzingText: {
    marginTop: 12,
    fontSize: 16,
  },
  aiCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confidenceContainer: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidencePercent: {
    fontSize: 18,
    fontWeight: '700',
  },
  labelsContainer: {
    marginTop: 12,
  },
  labelsTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectionContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  rejectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  quickReasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  quickReasonText: {
    fontSize: 12,
  },
  rejectionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rejectionActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmRejectButton: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmRejectText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pointsText: {
    fontSize: 14,
  },
});
