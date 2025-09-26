#!/usr/bin/env node

const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://tybeb-staging.firebaseio.com'
});

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Beta metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = {
      testers: await getBetaTesters(),
      feedback: await getRecentFeedback(),
      crashes: await getCrashReports(),
      performance: await getPerformanceMetrics(),
      activeUsers: await getActiveUsers(),
      taskCompletion: await getTaskCompletionRate()
    };
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get beta testers
async function getBetaTesters() {
  try {
    const snapshot = await db.collection('betaTesters').get();
    const testers = {
      total: snapshot.size,
      ios: 0,
      android: 0,
      active: 0
    };
    
    const now = Date.now();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.platform === 'ios') testers.ios++;
      if (data.platform === 'android') testers.android++;
      if (data.lastActive && data.lastActive.toMillis() > now - 86400000) testers.active++;
    });
    
    return testers;
  } catch (error) {
    console.error('Error getting beta testers:', error);
    return { total: 0, ios: 0, android: 0, active: 0 };
  }
}

// Get recent feedback
async function getRecentFeedback() {
  try {
    const snapshot = await db.collection('feedback')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting feedback:', error);
    return [];
  }
}

// Get crash reports
async function getCrashReports() {
  try {
    const oneDayAgo = new Date(Date.now() - 86400000);
    const snapshot = await db.collection('crashes')
      .where('timestamp', '>', oneDayAgo)
      .get();
    
    const result = {
      last24h: snapshot.size,
      critical: 0,
      byPlatform: {
        ios: 0,
        android: 0
      }
    };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.severity === 'critical') result.critical++;
      if (data.platform === 'ios') result.byPlatform.ios++;
      if (data.platform === 'android') result.byPlatform.android++;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting crash reports:', error);
    return { last24h: 0, critical: 0, byPlatform: { ios: 0, android: 0 } };
  }
}

// Get performance metrics
async function getPerformanceMetrics() {
  try {
    const snapshot = await db.collection('performance')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    const metrics = snapshot.docs.map(doc => doc.data());
    
    if (metrics.length === 0) {
      return {
        avgStartupTime: 0,
        avgScreenLoadTime: 0,
        avgPhotoUploadTime: 0,
        memoryUsage: 0
      };
    }
    
    return {
      avgStartupTime: calculateAverage(metrics.map(m => m.startupTime).filter(Boolean)),
      avgScreenLoadTime: calculateAverage(metrics.map(m => m.screenLoadTime).filter(Boolean)),
      avgPhotoUploadTime: calculateAverage(metrics.map(m => m.photoUploadTime).filter(Boolean)),
      memoryUsage: calculateAverage(metrics.map(m => m.memoryUsage).filter(Boolean))
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      avgStartupTime: 0,
      avgScreenLoadTime: 0,
      avgPhotoUploadTime: 0,
      memoryUsage: 0
    };
  }
}

// Get active users
async function getActiveUsers() {
  try {
    const oneDayAgo = new Date(Date.now() - 86400000);
    const snapshot = await db.collection('users')
      .where('lastActive', '>', oneDayAgo)
      .get();
    
    return snapshot.size;
  } catch (error) {
    console.error('Error getting active users:', error);
    return 0;
  }
}

// Get task completion rate
async function getTaskCompletionRate() {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
    const tasksSnapshot = await db.collection('tasks')
      .where('createdAt', '>', oneWeekAgo)
      .get();
    
    const total = tasksSnapshot.size;
    const completed = tasksSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
    
    return {
      total,
      completed,
      rate: total > 0 ? parseFloat((completed / total * 100).toFixed(1)) : 0
    };
  } catch (error) {
    console.error('Error getting task completion rate:', error);
    return { total: 0, completed: 0, rate: 0 };
  }
}

function calculateAverage(numbers) {
  const validNumbers = numbers.filter(n => !isNaN(n));
  if (validNumbers.length === 0) return 0;
  return parseFloat((validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length).toFixed(2));
}

// Dashboard HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Create dashboard HTML
const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeB Family - Beta Testing Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { opacity: 0.9; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 2rem 0; }
    .metric-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric-value { font-size: 2rem; font-weight: bold; color: #333; }
    .metric-label { color: #666; margin-top: 0.5rem; }
    .section { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1rem; }
    .feedback-item { padding: 1rem; border-left: 3px solid #667eea; margin-bottom: 1rem; background: #f9f9f9; }
    .feedback-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .user-name { font-weight: bold; }
    .timestamp { color: #666; font-size: 0.9rem; }
    .feedback-text { color: #333; }
    .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .status-good { background: #d4edda; color: #155724; }
    .status-warning { background: #fff3cd; color: #856404; }
    .status-error { background: #f8d7da; color: #721c24; }
    .refresh-btn { background: #667eea; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    .refresh-btn:hover { background: #5a67d8; }
    .loading { opacity: 0.5; }
    .error-message { background: #f8d7da; color: #721c24; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 TypeB Family Beta Dashboard</h1>
    <p class="subtitle">Real-time beta testing metrics and feedback</p>
  </div>
  
  <div class="container">
    <button class="refresh-btn" onclick="loadMetrics()">🔄 Refresh</button>
    
    <div class="metrics" id="metrics">
      <div class="metric-card">
        <div class="metric-value" id="total-testers">-</div>
        <div class="metric-label">Total Testers</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="active-users">-</div>
        <div class="metric-label">Active Today</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="crash-rate">-</div>
        <div class="metric-label">Crash-Free Rate</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" id="task-rate">-</div>
        <div class="metric-label">Task Completion</div>
      </div>
    </div>
    
    <div class="section">
      <h2>📊 Performance Metrics</h2>
      <div id="performance-metrics">Loading...</div>
    </div>
    
    <div class="section">
      <h2>💬 Recent Feedback</h2>
      <div id="feedback-list">Loading...</div>
    </div>
    
    <div class="section">
      <h2>⚠️ Crash Reports</h2>
      <div id="crash-reports">Loading...</div>
    </div>
  </div>
  
  <script>
    let isLoading = false;
    
    async function loadMetrics() {
      if (isLoading) return;
      isLoading = true;
      
      const button = document.querySelector('.refresh-btn');
      button.classList.add('loading');
      
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        
        const data = await response.json();
        
        // Update metrics
        document.getElementById('total-testers').textContent = data.testers.total || 0;
        document.getElementById('active-users').textContent = data.activeUsers || 0;
        
        const crashFreeRate = data.activeUsers > 0 
          ? (100 - (data.crashes.last24h / data.activeUsers * 100)).toFixed(1)
          : '100';
        document.getElementById('crash-rate').textContent = crashFreeRate + '%';
        document.getElementById('task-rate').textContent = (data.taskCompletion.rate || 0) + '%';
        
        // Update performance
        document.getElementById('performance-metrics').innerHTML = 
          '<p>Avg Startup Time: ' + (data.performance.avgStartupTime || 0) + 'ms</p>' +
          '<p>Avg Screen Load: ' + (data.performance.avgScreenLoadTime || 0) + 'ms</p>' +
          '<p>Avg Photo Upload: ' + (data.performance.avgPhotoUploadTime || 0) + 'ms</p>' +
          '<p>Memory Usage: ' + (data.performance.memoryUsage || 0) + 'MB</p>';
        
        // Update feedback
        const feedbackHTML = data.feedback && data.feedback.length > 0 
          ? data.feedback.map(f => 
              '<div class="feedback-item">' +
                '<div class="feedback-header">' +
                  '<span class="user-name">' + (f.userName || 'Anonymous') + '</span>' +
                  '<span class="timestamp">' + 
                    (f.createdAt ? new Date(f.createdAt).toLocaleString() : 'Unknown') + 
                  '</span>' +
                '</div>' +
                '<div class="feedback-text">' + (f.message || 'No message') + '</div>' +
              '</div>'
            ).join('')
          : '<p>No feedback yet</p>';
        document.getElementById('feedback-list').innerHTML = feedbackHTML;
        
        // Update crashes
        document.getElementById('crash-reports').innerHTML = 
          '<p>Last 24h: ' + (data.crashes.last24h || 0) + ' crashes</p>' +
          '<p>Critical: ' + (data.crashes.critical || 0) + '</p>' +
          '<p>iOS: ' + (data.crashes.byPlatform.ios || 0) + 
          ' | Android: ' + (data.crashes.byPlatform.android || 0) + '</p>';
          
      } catch (error) {
        console.error('Failed to load metrics:', error);
        document.getElementById('performance-metrics').innerHTML = 
          '<div class="error-message">Failed to load metrics. Please check your connection.</div>';
      } finally {
        button.classList.remove('loading');
        isLoading = false;
      }
    }
    
    // Load on startup and refresh every 30 seconds
    loadMetrics();
    setInterval(loadMetrics, 30000);
  </script>
</body>
</html>`;

// Create public directory and save dashboard
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.writeFileSync(path.join(publicDir, 'dashboard.html'), dashboardHTML);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Beta Dashboard running at http://localhost:${PORT}`);
  console.log('📊 Monitoring beta testing metrics in real-time');
});
