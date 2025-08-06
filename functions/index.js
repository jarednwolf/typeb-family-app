const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Helper function to format time
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

// Helper function to check if time is within quiet hours
const isInQuietHours = (date, quietHours) => {
  if (!quietHours || !quietHours.enabled) return false;
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentMinutes = hours * 60 + minutes;
  
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  // Handle overnight quiet hours
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Scheduled function to check for tasks needing reminders
exports.checkTaskReminders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('Checking for task reminders...');
    
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in5Minutes = new Date(now.getTime() + 5 * 60 * 1000);
    
    try {
      // Get all pending tasks due in the next 30 minutes
      const tasksSnapshot = await db.collection('tasks')
        .where('status', '==', 'pending')
        .where('dueDate', '>=', now)
        .where('dueDate', '<=', in30Minutes)
        .get();
      
      const reminderPromises = [];
      
      for (const taskDoc of tasksSnapshot.docs) {
        const task = { id: taskDoc.id, ...taskDoc.data() };
        const dueDate = task.dueDate.toDate();
        const minutesUntilDue = Math.floor((dueDate - now) / (1000 * 60));
        
        // Determine which reminder to send
        let reminderType = null;
        if (minutesUntilDue <= 5 && minutesUntilDue > 0) {
          reminderType = 'urgent';
        } else if (minutesUntilDue <= 15 && minutesUntilDue > 5) {
          reminderType = 'escalation';
        } else if (minutesUntilDue <= 30 && minutesUntilDue > 15) {
          reminderType = 'initial';
        }
        
        if (reminderType && !task[`${reminderType}ReminderSent`]) {
          reminderPromises.push(sendTaskReminder(task, reminderType));
        }
      }
      
      await Promise.all(reminderPromises);
      console.log(`Processed ${reminderPromises.length} reminders`);
      
    } catch (error) {
      console.error('Error checking task reminders:', error);
    }
    
    return null;
  });

// Function to send a task reminder
async function sendTaskReminder(task, reminderType) {
  try {
    // Get the assigned user
    const userDoc = await db.collection('users').doc(task.assignedTo).get();
    if (!userDoc.exists) {
      console.error(`User ${task.assignedTo} not found`);
      return;
    }
    
    const user = userDoc.data();
    
    // Check quiet hours
    const userSettings = user.notificationSettings || {};
    if (isInQuietHours(new Date(), userSettings.quietHours)) {
      console.log(`Skipping reminder for user ${user.displayName} - quiet hours`);
      return;
    }
    
    // Get user's FCM token
    if (!user.fcmToken) {
      console.log(`No FCM token for user ${user.displayName}`);
      return;
    }
    
    // Prepare notification content
    let title, body;
    const minutesUntilDue = Math.floor((task.dueDate.toDate() - new Date()) / (1000 * 60));
    
    switch (reminderType) {
      case 'urgent':
        title = '🚨 Urgent: Task Due Soon!';
        body = `"${task.title}" is due in ${minutesUntilDue} minutes!`;
        break;
      case 'escalation':
        title = '⚠️ Task Reminder';
        body = `"${task.title}" is due in ${minutesUntilDue} minutes`;
        break;
      case 'initial':
        title = '⏰ Task Reminder';
        body = `"${task.title}" is due at ${formatTime(task.dueDate.toDate())}`;
        break;
    }
    
    // Send push notification
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        type: 'task_reminder',
        taskId: task.id,
        reminderType,
        dueDate: task.dueDate.toDate().toISOString(),
      },
      token: user.fcmToken,
      android: {
        priority: reminderType === 'urgent' ? 'high' : 'normal',
        notification: {
          sound: 'default',
          priority: reminderType === 'urgent' ? 'high' : 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };
    
    await messaging.send(message);
    
    // Mark reminder as sent
    await db.collection('tasks').doc(task.id).update({
      [`${reminderType}ReminderSent`]: true,
      [`${reminderType}ReminderSentAt`]: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Sent ${reminderType} reminder for task ${task.title} to ${user.displayName}`);
    
  } catch (error) {
    console.error(`Error sending reminder for task ${task.id}:`, error);
  }
}

// Function to handle overdue tasks and notify managers
exports.checkOverdueTasks = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    console.log('Checking for overdue tasks...');
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    try {
      // Get tasks that became overdue in the last 5 minutes
      const overdueTasksSnapshot = await db.collection('tasks')
        .where('status', '==', 'pending')
        .where('dueDate', '<=', fiveMinutesAgo)
        .where('managerNotified', '==', false)
        .get();
      
      const notificationPromises = [];
      
      for (const taskDoc of overdueTasksSnapshot.docs) {
        const task = { id: taskDoc.id, ...taskDoc.data() };
        notificationPromises.push(notifyManagerAboutOverdueTask(task));
      }
      
      await Promise.all(notificationPromises);
      console.log(`Processed ${notificationPromises.length} overdue notifications`);
      
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
    
    return null;
  });

// Function to notify manager about overdue task
async function notifyManagerAboutOverdueTask(task) {
  try {
    // Get the assigned user
    const userDoc = await db.collection('users').doc(task.assignedTo).get();
    if (!userDoc.exists) return;
    
    const assignedUser = userDoc.data();
    
    // Only notify if user is a child
    if (assignedUser.role !== 'child') return;
    
    // Get the family
    const familyDoc = await db.collection('families').doc(task.familyId).get();
    if (!familyDoc.exists) return;
    
    const family = familyDoc.data();
    
    // Get all parent/manager users in the family
    const managersSnapshot = await db.collection('users')
      .where('familyId', '==', task.familyId)
      .where('role', '==', 'parent')
      .get();
    
    const notificationPromises = [];
    
    for (const managerDoc of managersSnapshot.docs) {
      const manager = managerDoc.data();
      
      if (!manager.fcmToken) continue;
      
      const message = {
        notification: {
          title: '👨‍👩‍👧 Task Overdue Alert',
          body: `${assignedUser.displayName}'s task "${task.title}" is overdue`,
        },
        data: {
          type: 'task_overdue',
          taskId: task.id,
          assignedUserId: task.assignedTo,
          assignedUserName: assignedUser.displayName,
        },
        token: manager.fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };
      
      notificationPromises.push(messaging.send(message));
    }
    
    await Promise.all(notificationPromises);
    
    // Mark task as manager notified
    await db.collection('tasks').doc(task.id).update({
      managerNotified: true,
      managerNotifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Notified ${notificationPromises.length} managers about overdue task ${task.title}`);
    
  } catch (error) {
    console.error(`Error notifying manager about task ${task.id}:`, error);
  }
}

// Trigger when a new task is created
exports.onTaskCreated = functions.firestore
  .document('tasks/{taskId}')
  .onCreate(async (snap, context) => {
    const task = snap.data();
    const taskId = context.params.taskId;
    
    console.log(`New task created: ${task.title}`);
    
    // Initialize reminder flags
    await snap.ref.update({
      initialReminderSent: false,
      escalationReminderSent: false,
      urgentReminderSent: false,
      managerNotified: false,
    });
    
    // If assigned to someone other than creator, notify them
    if (task.assignedTo !== task.createdBy) {
      await notifyUserAboutAssignedTask(task, taskId);
    }
    
    return null;
  });

// Function to notify user about newly assigned task
async function notifyUserAboutAssignedTask(task, taskId) {
  try {
    const userDoc = await db.collection('users').doc(task.assignedTo).get();
    if (!userDoc.exists || !userDoc.data().fcmToken) return;
    
    const user = userDoc.data();
    const creatorDoc = await db.collection('users').doc(task.createdBy).get();
    const creatorName = creatorDoc.exists ? creatorDoc.data().displayName : 'Someone';
    
    const message = {
      notification: {
        title: '📋 New Task Assigned',
        body: `${creatorName} assigned you: "${task.title}"`,
      },
      data: {
        type: 'task_assigned',
        taskId: taskId,
        createdBy: task.createdBy,
      },
      token: user.fcmToken,
    };
    
    await messaging.send(message);
    console.log(`Notified ${user.displayName} about new task assignment`);
    
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
  }
}

// Trigger when a task is completed
exports.onTaskCompleted = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if task was just completed
    if (before.status !== 'completed' && after.status === 'completed') {
      console.log(`Task completed: ${after.title}`);
      
      // Notify family members about completion
      await notifyFamilyAboutTaskCompletion(after, context.params.taskId);
    }
    
    return null;
  });

// Function to notify family about task completion
async function notifyFamilyAboutTaskCompletion(task, taskId) {
  try {
    // Get the user who completed the task
    const userDoc = await db.collection('users').doc(task.assignedTo).get();
    if (!userDoc.exists) return;
    
    const completedByUser = userDoc.data();
    
    // Send to family topic
    const message = {
      notification: {
        title: '✅ Task Completed!',
        body: `${completedByUser.displayName} completed "${task.title}"`,
      },
      data: {
        type: 'task_completed',
        taskId: taskId,
        completedBy: task.assignedTo,
        completedByName: completedByUser.displayName,
      },
      topic: `family_${task.familyId}`,
    };
    
    await messaging.send(message);
    console.log(`Notified family ${task.familyId} about task completion`);
    
  } catch (error) {
    console.error('Error sending task completion notification:', error);
  }
}

// Clean up old completed tasks (runs daily)
exports.cleanupCompletedTasks = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Cleaning up old completed tasks...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      const oldTasksSnapshot = await db.collection('tasks')
        .where('status', '==', 'completed')
        .where('completedAt', '<=', thirtyDaysAgo)
        .limit(100) // Process in batches
        .get();
      
      const batch = db.batch();
      
      oldTasksSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${oldTasksSnapshot.size} old completed tasks`);
      
    } catch (error) {
      console.error('Error cleaning up tasks:', error);
    }
    
    return null;
  });

// Export functions for testing
exports.sendTaskReminder = sendTaskReminder;
exports.notifyManagerAboutOverdueTask = notifyManagerAboutOverdueTask;