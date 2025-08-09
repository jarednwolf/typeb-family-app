import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import TaskDetailModal from './TaskDetailModal';
import { TasksStackParamList } from '../../navigation/MainNavigator';

type TaskDetailScreenRouteProp = RouteProp<TasksStackParamList, 'TaskDetail'>;

const TaskDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TaskDetailScreenRouteProp>();
  const { taskId } = route.params;
  
  // Get the task from Redux store
  const task = useSelector((state: RootState) => 
    state.tasks.tasks.find(t => t.id === taskId)
  );
  
  const handleClose = () => {
    navigation.goBack();
  };

  if (!task) {
    // Task not found, go back
    navigation.goBack();
    return null;
  }

  return (
    <TaskDetailModal
      visible={true}
      onClose={handleClose}
      task={task}
    />
  );
};

export default TaskDetailScreen;