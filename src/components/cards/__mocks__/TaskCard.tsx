import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const TaskCardMock: React.FC<any> = ({ task, onPress, onComplete, showAssignee = true }) => {
  return (
    <View testID="task-card">
      <TouchableOpacity onPress={onPress} testID="task-card-pressable">
        <Text>{task.title}</Text>
      </TouchableOpacity>
      <View>
        <Text>{`Icon: ${task.category.icon || 'grid'}`}</Text>
        <Text>{task.category.name}</Text>
      </View>
      {showAssignee && task.assignedTo ? (
        <Text>{task.assignedTo}</Text>
      ) : null}
      {task.dueDate ? (
        <View>
          <Text>Icon: calendar</Text>
          <Text>{typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString()}</Text>
        </View>
      ) : null}
      {task.isRecurring ? <Text>Icon: repeat</Text> : null}
      {task.requiresPhoto && task.status === 'completed' ? (
        <Text>
          {`Icon: ${task.validationStatus === 'approved' ? 'check-circle' : task.validationStatus === 'rejected' ? 'x-circle' : 'clock'}`}
        </Text>
      ) : null}
      {task.requiresPhoto && task.status !== 'completed' ? <Text>Icon: camera</Text> : null}
      <TouchableOpacity onPress={onComplete} testID="complete-button">
        <Text>Icon: check</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TaskCardMock;

