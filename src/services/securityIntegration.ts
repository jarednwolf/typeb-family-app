/**
 * Security Integration Module
 * 
 * This module integrates security monitoring into all services
 * ensuring comprehensive security event logging and threat detection
 */

import { 
  securityMonitoring, 
  SecurityEventType, 
  SecuritySeverity,
  logSecurityEvent 
} from './securityMonitoring';

// Import services to enhance
import * as authService from './auth';
import * as taskService from './tasks';
import * as familyService from './family';
import * as notificationService from './notifications';

/**
 * Enhance authentication service with security monitoring
 */
export const enhanceAuthService = () => {
  // Wrap signUp
  const originalSignUp = authService.signUp;
  authService.signUp = async (email: string, password: string, displayName: string, role: 'parent' | 'child') => {
    try {
      // Check for injection attempts
      if (securityMonitoring.detectInjectionAttempt(email) || 
          securityMonitoring.detectInjectionAttempt(displayName)) {
        await logSecurityEvent({
          type: SecurityEventType.INJECTION_ATTEMPT,
          severity: SecuritySeverity.CRITICAL,
          details: { 
            action: 'signUp',
            email: email.substring(0, 50) 
          }
        });
        throw new Error('Invalid input detected');
      }

      const result = await originalSignUp(email, password, displayName, role);
      
      // Log successful signup
      await logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        severity: SecuritySeverity.INFO,
        details: { 
          action: 'signUp',
          role,
          newUser: true 
        }
      });
      
      return result;
    } catch (error: any) {
      // Log failed signup
      await logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILED,
        severity: SecuritySeverity.WARNING,
        details: { 
          action: 'signUp',
          error: error.message,
          email: email.substring(0, 50)
        }
      });
      throw error;
    }
  };

  // Wrap signIn
  const originalSignIn = authService.signIn;
  authService.signIn = async (email: string, password: string) => {
    try {
      const result = await originalSignIn(email, password);
      
      // Log successful login
      await logSecurityEvent({
        type: SecurityEventType.LOGIN_SUCCESS,
        severity: SecuritySeverity.INFO,
        details: { 
          action: 'signIn',
          email: email.substring(0, 50)
        }
      });
      
      return result;
    } catch (error: any) {
      // Check if account is locked
      if (error.message.includes('locked')) {
        await logSecurityEvent({
          type: SecurityEventType.ACCOUNT_LOCKED,
          severity: SecuritySeverity.HIGH,
          details: { 
            action: 'signIn',
            email: email.substring(0, 50)
          }
        });
      } else {
        await logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          severity: SecuritySeverity.WARNING,
          details: { 
            action: 'signIn',
            error: error.message,
            email: email.substring(0, 50)
          }
        });
      }
      throw error;
    }
  };

  // Wrap signOut
  const originalSignOut = authService.signOut;
  authService.signOut = async () => {
    const userId = authService.auth.currentUser?.uid;
    await originalSignOut();
    
    await logSecurityEvent({
      type: SecurityEventType.LOGOUT,
      severity: SecuritySeverity.INFO,
      userId,
      details: { action: 'signOut' }
    });
  };

  // Wrap resetPassword
  const originalResetPassword = authService.resetPassword;
  authService.resetPassword = async (email: string) => {
    try {
      await originalResetPassword(email);
      
      await logSecurityEvent({
        type: SecurityEventType.PASSWORD_RESET,
        severity: SecuritySeverity.INFO,
        details: { 
          action: 'resetPassword',
          email: email.substring(0, 50)
        }
      });
    } catch (error: any) {
      await logSecurityEvent({
        type: SecurityEventType.LOGIN_FAILED,
        severity: SecuritySeverity.WARNING,
        details: { 
          action: 'resetPassword',
          error: error.message
        }
      });
      throw error;
    }
  };
};

/**
 * Enhance task service with security monitoring
 */
export const enhanceTaskService = () => {
  // Wrap createTask
  const originalCreateTask = taskService.createTask;
  taskService.createTask = async (taskData: any, userId: string) => {
    try {
      // Check for injection in task data
      if (securityMonitoring.detectInjectionAttempt(taskData.title) ||
          securityMonitoring.detectInjectionAttempt(taskData.description || '')) {
        await logSecurityEvent({
          type: SecurityEventType.INJECTION_ATTEMPT,
          severity: SecuritySeverity.CRITICAL,
          userId,
          resource: 'tasks',
          action: 'create',
          details: { taskData }
        });
        throw new Error('Invalid input detected');
      }

      const result = await originalCreateTask(taskData, userId);
      
      // Log data access
      await securityMonitoring.logDataAccess('tasks', 'create', false);
      
      return result;
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        await logSecurityEvent({
          type: SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: SecuritySeverity.HIGH,
          userId,
          resource: 'tasks',
          action: 'create',
          details: { error: error.message }
        });
      }
      throw error;
    }
  };

  // Wrap updateTask
  const originalUpdateTask = taskService.updateTask;
  taskService.updateTask = async (taskId: string, updates: any, userId: string) => {
    try {
      const result = await originalUpdateTask(taskId, updates, userId);
      
      // Log sensitive data access if updating completion with photo
      if (updates.completedAt && updates.validationPhoto) {
        await securityMonitoring.logDataAccess('tasks', 'update_with_photo', true);
      }
      
      return result;
    } catch (error: any) {
      if (error.message.includes('permission')) {
        await securityMonitoring.logPermissionDenied('tasks', 'update', error.message);
      }
      throw error;
    }
  };

  // Wrap deleteTask
  const originalDeleteTask = taskService.deleteTask;
  taskService.deleteTask = async (taskId: string, userId: string) => {
    try {
      const result = await originalDeleteTask(taskId, userId);
      
      // Log sensitive operation
      await logSecurityEvent({
        type: SecurityEventType.SENSITIVE_DATA_ACCESS,
        severity: SecuritySeverity.WARNING,
        userId,
        resource: 'tasks',
        action: 'delete',
        details: { taskId }
      });
      
      return result;
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        await securityMonitoring.logPermissionDenied('tasks', 'delete', error.message);
      }
      throw error;
    }
  };
};

/**
 * Enhance family service with security monitoring
 */
export const enhanceFamilyService = () => {
  // Wrap createFamily
  const originalCreateFamily = familyService.createFamily;
  familyService.createFamily = async (name: string, userId: string) => {
    try {
      if (securityMonitoring.detectInjectionAttempt(name)) {
        await logSecurityEvent({
          type: SecurityEventType.INJECTION_ATTEMPT,
          severity: SecuritySeverity.CRITICAL,
          userId,
          resource: 'families',
          action: 'create',
          details: { name }
        });
        throw new Error('Invalid input detected');
      }

      const result = await originalCreateFamily(name, userId);
      
      await securityMonitoring.logDataAccess('families', 'create', false);
      
      return result;
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        await logSecurityEvent({
          type: SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: SecuritySeverity.HIGH,
          userId,
          resource: 'families',
          action: 'create'
        });
      }
      throw error;
    }
  };

  // Wrap inviteMember
  const originalInviteMember = familyService.inviteMember;
  familyService.inviteMember = async (familyId: string, email: string, role: string, invitedBy: string) => {
    try {
      const result = await originalInviteMember(familyId, email, role, invitedBy);
      
      // Log sensitive operation
      await logSecurityEvent({
        type: SecurityEventType.SENSITIVE_DATA_ACCESS,
        severity: SecuritySeverity.INFO,
        userId: invitedBy,
        resource: 'families',
        action: 'invite',
        details: { 
          familyId,
          invitedEmail: email.substring(0, 50),
          role 
        }
      });
      
      return result;
    } catch (error: any) {
      if (error.message.includes('Rate limit')) {
        await logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: SecuritySeverity.WARNING,
          userId: invitedBy,
          resource: 'families',
          action: 'invite'
        });
      }
      throw error;
    }
  };

  // Wrap removeMember
  const originalRemoveMember = familyService.removeMember;
  familyService.removeMember = async (familyId: string, memberId: string, removedBy: string) => {
    try {
      const result = await originalRemoveMember(familyId, memberId, removedBy);
      
      // Log critical operation
      await logSecurityEvent({
        type: SecurityEventType.SENSITIVE_DATA_ACCESS,
        severity: SecuritySeverity.HIGH,
        userId: removedBy,
        resource: 'families',
        action: 'remove_member',
        details: { 
          familyId,
          removedMemberId: memberId 
        }
      });
      
      return result;
    } catch (error: any) {
      if (error.message.includes('permission')) {
        await logSecurityEvent({
          type: SecurityEventType.PRIVILEGE_ESCALATION,
          severity: SecuritySeverity.CRITICAL,
          userId: removedBy,
          resource: 'families',
          action: 'remove_member',
          details: { 
            error: error.message,
            attemptedTarget: memberId 
          }
        });
      }
      throw error;
    }
  };
};

/**
 * Enhance notification service with security monitoring
 */
export const enhanceNotificationService = () => {
  // Wrap scheduleTaskReminder
  const originalScheduleReminder = notificationService.scheduleTaskReminder;
  notificationService.scheduleTaskReminder = async (task: any, user: any) => {
    try {
      const result = await originalScheduleReminder(task, user);
      
      await securityMonitoring.logDataAccess('notifications', 'schedule', false);
      
      return result;
    } catch (error: any) {
      if (error.message.includes('Rate limit')) {
        await logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: SecuritySeverity.WARNING,
          userId: user.id,
          resource: 'notifications',
          action: 'schedule'
        });
      } else if (error.message.includes('Unauthorized')) {
        await logSecurityEvent({
          type: SecurityEventType.UNAUTHORIZED_ACCESS,
          severity: SecuritySeverity.HIGH,
          userId: user.id,
          resource: 'notifications',
          action: 'schedule',
          details: { taskId: task.id }
        });
      }
      throw error;
    }
  };

  // Wrap sendTestNotification
  const originalSendTest = notificationService.sendTestNotification;
  notificationService.sendTestNotification = async () => {
    try {
      const result = await originalSendTest();
      
      await securityMonitoring.logDataAccess('notifications', 'test', false);
      
      return result;
    } catch (error: any) {
      if (error.message.includes('limit')) {
        await logSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          severity: SecuritySeverity.INFO,
          resource: 'notifications',
          action: 'test'
        });
      }
      throw error;
    }
  };
};

/**
 * Initialize all security integrations
 */
export const initializeSecurityIntegrations = () => {
  console.log('Initializing security monitoring integrations...');
  
  try {
    enhanceAuthService();
    enhanceTaskService();
    enhanceFamilyService();
    enhanceNotificationService();
    
    // Set up global error handler
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', async (event) => {
        await logSecurityEvent({
          type: SecurityEventType.SERVICE_ERROR,
          severity: SecuritySeverity.HIGH,
          details: {
            error: event.reason?.message || 'Unknown error',
            stack: event.reason?.stack
          }
        });
      });
    }
    
    // Set up periodic security health check
    setInterval(async () => {
      try {
        const dashboard = await securityMonitoring.getSecurityDashboard(60); // Last hour
        
        if (dashboard.criticalEvents > 0) {
          console.error('CRITICAL SECURITY EVENTS DETECTED:', dashboard.criticalEvents);
        }
        
        if (dashboard.anomalies.length > 0) {
          console.warn('Security anomalies detected:', dashboard.anomalies);
        }
      } catch (error) {
        console.error('Security health check failed:', error);
      }
    }, 300000); // Every 5 minutes
    
    console.log('Security monitoring integrations initialized successfully');
  } catch (error) {
    console.error('Failed to initialize security integrations:', error);
    throw error;
  }
};

// Auto-initialize on import
initializeSecurityIntegrations();