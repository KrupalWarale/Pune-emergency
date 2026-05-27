const express = require('express');
const router = express.Router();
const AppReview = require('../models/AppReview');

// POST a new review
router.post('/', async (req, res) => {
  try {
    const { name, rating, review } = req.body;
    
    if (!name || !rating || !review) {
      return res.status(400).json({ success: false, message: 'Please provide name, rating, and review' });
    }
    
    const newReview = await AppReview.create({
      name,
      rating,
      review
    });
    
    res.status(201).json({ success: true, data: newReview });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await AppReview.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
