const express = require('express');
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const Booking = require('../models/Booking');
const UserActivity = require('../models/UserActivity');
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');

const router = express.Router();

// Get user dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user info
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    // Get user's bookings
    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        {
          model: Ambulance,
          as: 'ambulance',
          include: [
            {
              model: Hospital,
              as: 'hospital',
              attributes: ['name', 'address', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get recent activities
    const recentActivities = await UserActivity.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get booking statistics
    const bookingStats = await Booking.findAll({
      where: { userId },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Format booking stats
    const stats = {
      total: bookings.length,
      pending: 0,
      completed: 0,
      cancelled: 0
    };

    bookingStats.forEach(stat => {
      stats[stat.status] = parseInt(stat.count);
    });

    res.json({
      success: true,
      dashboard: {
        user: {
          id: user.id,
          name: user.getFullName(),
          email: user.email,
          phone: user.phone,
          healthId: user.healthId,
          bloodGroup: user.bloodGroup,
          initials: user.getInitials()
        },
        bookings,
        recentActivities,
        stats
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load dashboard', 
      error: error.message 
    });
  }
});

// Get user's booking history
router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.userId };
    if (status) {
      whereClause.status = status;
    }

    const bookings = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Ambulance,
          as: 'ambulance',
          include: [
            {
              model: Hospital,
              as: 'hospital',
              attributes: ['name', 'address', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      bookings: bookings.rows,
      pagination: {
        total: bookings.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(bookings.count / limit)
      }
    });

  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings', 
      error: error.message 
    });
  }
});

// Get specific booking details
router.get('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.userId 
      },
      include: [
        {
          model: Ambulance,
          as: 'ambulance',
          include: [
            {
              model: Hospital,
              as: 'hospital'
            }
          ]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Booking fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking', 
      error: error.message 
    });
  }
});

module.exports = router;