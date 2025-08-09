import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  
  // Authorization events
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  
  // Data access events
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  BULK_DATA_ACCESS = 'BULK_DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  
  // Security violations
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INJECTION_ATTEMPT = 'INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // System events
  SECURITY_CONFIG_CHANGE = 'SECURITY_CONFIG_CHANGE',
  SERVICE_ERROR = 'SERVICE_ERROR',
  CRITICAL_ERROR = 'CRITICAL_ERROR'
}

// Severity levels
export enum SecuritySeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Security event interface
export interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, any>;
  timestamp?: Timestamp;
  sessionId?: string;
  deviceInfo?: DeviceInfo;
}

interface DeviceInfo {
  platform?: string;
  version?: string;
  deviceId?: string;
  appVersion?: string;
}

// Anomaly detection thresholds
const ANOMALY_THRESHOLDS = {
  maxLoginAttemptsPerHour: 10,
  maxFailedLoginsPerDay: 20,
  maxDataAccessPerMinute: 50,
  maxApiCallsPerMinute: 100,
  suspiciousPatterns: [
    /(<script|javascript:|onerror|onload)/i,
    /(union.*select|select.*from|drop.*table)/i,
    /(\.\.\/|\.\.\\)/,
  ]
};

class SecurityMonitoringService {
  private sessionId: string;
  private eventQueue: SecurityEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startEventFlushing();
  }
  
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private startEventFlushing() {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000);
  }
  
  private async flushEvents() {
    if (this.eventQueue.length === 0) return;
    
    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // Batch write events to Firestore
      const batch = eventsToFlush.map(event => 
        addDoc(collection(db, 'securityEvents'), {
          ...event,
          timestamp: serverTimestamp(),
          sessionId: this.sessionId
        })
      );
      
      await Promise.all(batch);
    } catch (error) {
      console.error('Failed to flush security events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToFlush);
    }
  }
  
  // Log security event
  async logEvent(event: Omit<SecurityEvent, 'timestamp' | 'sessionId'>) {
    const enrichedEvent: SecurityEvent = {
      ...event,
      timestamp: Timestamp.now(),
      sessionId: this.sessionId,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email || undefined,
      deviceInfo: await this.getDeviceInfo()
    };
    
    // Add to queue for batch processing
    this.eventQueue.push(enrichedEvent);
    
    // Immediate flush for critical events
    if (event.severity === SecuritySeverity.CRITICAL) {
      await this.flushEvents();
    }
    
    // Check for anomalies
    await this.checkForAnomalies(enrichedEvent);
  }
  
  // Check for anomalous behavior
  private async checkForAnomalies(event: SecurityEvent) {
    switch (event.type) {
      case SecurityEventType.LOGIN_FAILED:
        await this.checkLoginAnomalies(event);
        break;
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
        await this.checkRateLimitAnomalies(event);
        break;
      case SecurityEventType.INJECTION_ATTEMPT:
      case SecurityEventType.XSS_ATTEMPT:
        await this.handleSecurityThreat(event);
        break;
    }
  }
  
  private async checkLoginAnomalies(event: SecurityEvent) {
    if (!event.userId) return;
    
    // Check recent failed login attempts
    const recentFailures = await this.getRecentEvents(
      SecurityEventType.LOGIN_FAILED,
      event.userId,
      60 // Last hour
    );
    
    if (recentFailures.length > ANOMALY_THRESHOLDS.maxLoginAttemptsPerHour) {
      await this.logEvent({
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.HIGH,
        userId: event.userId,
        details: {
          failedAttempts: recentFailures.length,
          timeWindow: '1 hour'
        }
      });
    }
  }
  
  private async checkRateLimitAnomalies(event: SecurityEvent) {
    if (!event.userId) return;
    
    // Check if user is consistently hitting rate limits
    const recentLimits = await this.getRecentEvents(
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      event.userId,
      1440 // Last 24 hours
    );
    
    if (recentLimits.length > 10) {
      await this.logEvent({
        type: SecurityEventType.SUSPICIOUS_LOGIN,
        severity: SecuritySeverity.WARNING,
        userId: event.userId,
        details: {
          rateLimitHits: recentLimits.length,
          timeWindow: '24 hours'
        }
      });
    }
  }
  
  private async handleSecurityThreat(event: SecurityEvent) {
    // Log critical security threat
    await this.logEvent({
      type: SecurityEventType.CRITICAL_ERROR,
      severity: SecuritySeverity.CRITICAL,
      userId: event.userId,
      details: {
        originalEvent: event.type,
        threat: 'Active security threat detected',
        action: 'Immediate investigation required'
      }
    });
    
    // In production, this would trigger alerts
    console.error('SECURITY THREAT DETECTED:', event);
  }
  
  // Get recent events of a specific type
  private async getRecentEvents(
    eventType: SecurityEventType,
    userId: string,
    minutesAgo: number
  ): Promise<SecurityEvent[]> {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    
    try {
      const q = query(
        collection(db, 'securityEvents'),
        where('type', '==', eventType),
        where('userId', '==', userId),
        where('timestamp', '>', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityEvent));
    } catch (error) {
      console.error('Failed to get recent events:', error);
      return [];
    }
  }
  
  // Get device information
  private async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const platform = await AsyncStorage.getItem('device_platform');
      const version = await AsyncStorage.getItem('device_version');
      const deviceId = await AsyncStorage.getItem('device_id');
      const appVersion = await AsyncStorage.getItem('app_version');
      
      return {
        platform: platform || undefined,
        version: version || undefined,
        deviceId: deviceId || undefined,
        appVersion: appVersion || undefined
      };
    } catch {
      return {};
    }
  }
  
  // Detect injection attempts
  detectInjectionAttempt(input: string): boolean {
    for (const pattern of ANOMALY_THRESHOLDS.suspiciousPatterns) {
      if (pattern.test(input)) {
        this.logEvent({
          type: SecurityEventType.INJECTION_ATTEMPT,
          severity: SecuritySeverity.CRITICAL,
          details: {
            input: input.substring(0, 100), // Truncate for safety
            pattern: pattern.toString()
          }
        });
        return true;
      }
    }
    return false;
  }
  
  // Log authentication events
  async logAuthEvent(
    type: SecurityEventType,
    success: boolean,
    details?: Record<string, any>
  ) {
    await this.logEvent({
      type,
      severity: success ? SecuritySeverity.INFO : SecuritySeverity.WARNING,
      details: {
        success,
        ...details
      }
    });
  }
  
  // Log data access
  async logDataAccess(
    resource: string,
    action: string,
    sensitive: boolean = false
  ) {
    await this.logEvent({
      type: sensitive ? 
        SecurityEventType.SENSITIVE_DATA_ACCESS : 
        SecurityEventType.BULK_DATA_ACCESS,
      severity: sensitive ? SecuritySeverity.WARNING : SecuritySeverity.INFO,
      resource,
      action,
      details: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Log permission denial
  async logPermissionDenied(
    resource: string,
    action: string,
    reason: string
  ) {
    await this.logEvent({
      type: SecurityEventType.PERMISSION_DENIED,
      severity: SecuritySeverity.WARNING,
      resource,
      action,
      details: { reason }
    });
  }
  
  // Get security dashboard data
  async getSecurityDashboard(timeRangeMinutes: number = 1440) {
    const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    
    try {
      const q = query(
        collection(db, 'securityEvents'),
        where('timestamp', '>', cutoffTime),
        orderBy('timestamp', 'desc'),
        limit(1000)
      );
      
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SecurityEvent));
      
      // Aggregate data for dashboard
      const dashboard = {
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === SecuritySeverity.CRITICAL).length,
        highEvents: events.filter(e => e.severity === SecuritySeverity.HIGH).length,
        warningEvents: events.filter(e => e.severity === SecuritySeverity.WARNING).length,
        infoEvents: events.filter(e => e.severity === SecuritySeverity.INFO).length,
        
        eventsByType: this.groupEventsByType(events),
        eventsByUser: this.groupEventsByUser(events),
        recentCriticalEvents: events
          .filter(e => e.severity === SecuritySeverity.CRITICAL)
          .slice(0, 10),
        
        topThreats: this.identifyTopThreats(events),
        anomalies: this.identifyAnomalies(events)
      };
      
      return dashboard;
    } catch (error) {
      console.error('Failed to get security dashboard:', error);
      throw error;
    }
  }
  
  private groupEventsByType(events: SecurityEvent[]) {
    const grouped: Record<string, number> = {};
    events.forEach(event => {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    });
    return grouped;
  }
  
  private groupEventsByUser(events: SecurityEvent[]) {
    const grouped: Record<string, number> = {};
    events.forEach(event => {
      if (event.userId) {
        grouped[event.userId] = (grouped[event.userId] || 0) + 1;
      }
    });
    return grouped;
  }
  
  private identifyTopThreats(events: SecurityEvent[]) {
    const threats = events.filter(e => 
      e.severity === SecuritySeverity.CRITICAL || 
      e.severity === SecuritySeverity.HIGH
    );
    
    // Group by threat type
    const threatMap = new Map<string, number>();
    threats.forEach(threat => {
      const key = `${threat.type}_${threat.resource || 'unknown'}`;
      threatMap.set(key, (threatMap.get(key) || 0) + 1);
    });
    
    // Sort by frequency
    return Array.from(threatMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ threat: key, count }));
  }
  
  private identifyAnomalies(events: SecurityEvent[]) {
    const anomalies: string[] = [];
    
    // Check for unusual patterns
    const userEventCounts = this.groupEventsByUser(events);
    Object.entries(userEventCounts).forEach(([userId, count]) => {
      if (count > 100) {
        anomalies.push(`User ${userId} has unusually high activity: ${count} events`);
      }
    });
    
    // Check for critical event clusters
    const criticalEvents = events.filter(e => e.severity === SecuritySeverity.CRITICAL);
    if (criticalEvents.length > 5) {
      anomalies.push(`High number of critical events: ${criticalEvents.length}`);
    }
    
    return anomalies;
  }
  
  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
  }
}

// Export singleton instance
export const securityMonitoring = new SecurityMonitoringService();

// Helper function for easy logging
export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp' | 'sessionId'>) => {
  return securityMonitoring.logEvent(event);
};