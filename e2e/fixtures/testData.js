// Test data for E2E tests
const testUsers = {
  parent: {
    email: 'test.parent@example.com',
    password: 'TestParent123!',
    displayName: 'Test Parent',
    role: 'parent'
  },
  child: {
    email: 'test.child@example.com', 
    password: 'TestChild123!',
    displayName: 'Test Child',
    role: 'child'
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'Existing123!',
    displayName: 'Existing User',
    role: 'parent'
  }
};

const testFamily = {
  name: 'Test Family',
  inviteCode: 'TEST01',
  maxMembers: 10
};

const testTasks = [
  {
    title: 'Complete homework',
    description: 'Finish math and science assignments',
    category: 'Homework',
    priority: 'high',
    status: 'pending'
  },
  {
    title: 'Clean room',
    description: 'Make bed and organize desk',
    category: 'Chores',
    priority: 'medium',
    status: 'pending',
    requiresPhoto: true
  },
  {
    title: 'Daily exercise',
    description: '30 minutes of physical activity',
    category: 'Exercise',
    priority: 'low',
    status: 'pending',
    isRecurring: true
  }
];

module.exports = {
  testUsers,
  testFamily,
  testTasks
};