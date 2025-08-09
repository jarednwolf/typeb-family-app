import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import CreateTaskModal from './CreateTaskModal';

type TasksStackParamList = {
  TasksList: undefined;
  CreateTask: undefined;
  TaskDetail: { taskId: string };
};

type CreateTaskScreenNavigationProp = StackNavigationProp<
  TasksStackParamList,
  'CreateTask'
>;

const CreateTaskScreen: React.FC = () => {
  const navigation = useNavigation<CreateTaskScreenNavigationProp>();
  
  const handleClose = () => {
    // Navigate to TasksList instead of going back
    // This prevents the "GO_BACK" error when coming from Dashboard
    navigation.navigate('TasksList');
  };

  return (
    <CreateTaskModal
      visible={true}
      onClose={handleClose}
    />
  );
};

export default CreateTaskScreen;