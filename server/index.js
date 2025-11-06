const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const payments = [
  {
    id: '1',
    studentName: 'Rohan Sharma',
    amount: 2500,
    due_date: '2024-01-15',
    status: 'pending'
  },
  {
    id: '2',
    studentName: 'Priya Patel',
    amount: 3000,
    due_date: '2024-01-20',
    status: 'paid'
  },
  {
    id: '3',
    studentName: 'Arjun Singh',
    amount: 2000,
    due_date: '2024-01-25',
    status: 'pending'
  },
  {
    id: '4',
    studentName: 'Sneha Gupta',
    amount: 3500,
    due_date: '2024-01-30',
    status: 'pending'
  },
  {
    id: '5',
    studentName: 'Vikram Kumar',
    amount: 2800,
    due_date: '2024-02-05',
    status: 'paid'
  },
  {
    id: '6',
    studentName: 'Ananya Reddy',
    amount: 2200,
    due_date: '2024-02-10',
    status: 'pending'
  }
];

const events = [
  {
    id: '1',
    title: 'Parent-Teacher Meeting',
    starts_at: '2024-01-20T10:00:00Z',
    ends_at: '2024-01-20T12:00:00Z',
    audience: 'Parents'
  },
  {
    id: '2',
    title: 'Science Fair',
    starts_at: '2024-01-25T09:00:00Z',
    ends_at: '2024-01-25T15:00:00Z',
    audience: 'All Students'
  },
  {
    id: '3',
    title: 'Sports Day',
    starts_at: '2024-02-01T08:00:00Z',
    ends_at: '2024-02-01T16:00:00Z',
    audience: 'All Students'
  },
  {
    id: '4',
    title: 'Annual Day Celebration',
    starts_at: '2024-02-15T18:00:00Z',
    ends_at: '2024-02-15T21:00:00Z',
    audience: 'All Students and Parents'
  },
  {
    id: '5',
    title: 'Exam Period',
    starts_at: '2024-03-01T09:00:00Z',
    ends_at: '2024-03-15T17:00:00Z',
    audience: 'All Students'
  },
  {
    id: '6',
    title: 'Summer Vacation Begins',
    starts_at: '2024-04-01T00:00:00Z',
    ends_at: '2024-04-01T23:59:59Z',
    audience: 'All Students'
  }
];

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Padmai Mock Server is running' });
});

// Auth endpoint
app.post('/auth/login', (req, res) => {
  const { role, name } = req.body;
  
  if (!role || !name) {
    return res.status(400).json({ 
      error: 'Role and name are required' 
    });
  }

  if (!['parent', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ 
      error: 'Invalid role. Must be parent, teacher, or admin' 
    });
  }

  // Mock successful login
  const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    token,
    role,
    name,
    message: 'Login successful'
  });
});

// Payments endpoint
app.get('/payments', (req, res) => {
  // Simulate network delay
  setTimeout(() => {
    res.json(payments);
  }, 500);
});

// Events endpoint
app.get('/events', (req, res) => {
  // Simulate network delay
  setTimeout(() => {
    res.json(events);
  }, 300);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Padmai Mock Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   POST /auth/login - Login with role and name`);
  console.log(`   GET  /payments   - Get all payments`);
  console.log(`   GET  /events     - Get all events`);
  console.log(`   GET  /health     - Health check`);
  console.log(`\n💡 Make sure to start this server before running the React Native app`);
});

module.exports = app;
