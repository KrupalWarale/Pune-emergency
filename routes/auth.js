const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserActivity = require('../models/UserActivity');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

// Middleware to log user activity
const logActivity = async (userId, activityType, description, metadata = {}, req) => {
  try {
    await UserActivity.create({
      userId,
      activityType,
      description,
      metadata,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      emergencyContact,
      bloodGroup
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Generate health ID
    const healthId = `PNE-HID-${Date.now().toString().slice(-5)}`;

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      address,
      emergencyContact,
      bloodGroup,
      healthId
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log registration activity
    await logActivity(
      user.id,
      'profile_update',
      'User registered successfully',
      { registrationMethod: 'email' },
      req
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        healthId: user.healthId,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        medications: user.medications,
        medicalConditions: user.medicalConditions,
        emergencyContact: user.emergencyContact,
        dateOfBirth: user.dateOfBirth
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed', 
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Log login activity
    await logActivity(
      user.id,
      'login',
      'User logged in successfully',
      { loginMethod: 'email' },
      req
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        healthId: user.healthId,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        medications: user.medications,
        medicalConditions: user.medicalConditions,
        emergencyContact: user.emergencyContact,
        dateOfBirth: user.dateOfBirth,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: error.message 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile', 
      error: error.message 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const updatedUser = await user.update(req.body);

    // Log profile update activity
    await logActivity(
      user.id,
      'profile_update',
      'User profile updated',
      { updatedFields: Object.keys(req.body) },
      req
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        healthId: updatedUser.healthId,
        bloodGroup: updatedUser.bloodGroup,
        allergies: updatedUser.allergies,
        medications: updatedUser.medications,
        medicalConditions: updatedUser.medicalConditions,
        emergencyContact: updatedUser.emergencyContact,
        dateOfBirth: updatedUser.dateOfBirth
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
});

// Get user activity history
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const activities = await UserActivity.findAndCountAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      activities: activities.rows,
      pagination: {
        total: activities.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(activities.count / limit)
      }
    });

  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity', 
      error: error.message 
    });
  }
});

module.exports = { router, authenticateToken, logActivity };
