const router = require('express').Router();
const Hospital = require('../models/Hospital');
const { calculateDistance } = require('../utils/distance');

// GET /api/hospitals?lat=18.5&lng=73.8
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const hospitals = await Hospital.findAll();
    
    // Add distance to each hospital
    const hospitalsWithDistance = hospitals.map(h => ({
      ...h.toJSON(),
      distance: calculateDistance(parseFloat(lat), parseFloat(lng), h.latitude, h.longitude)
    }));
    
    // Sort by distance
    hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
    
    res.json(hospitalsWithDistance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/hospitals/:id
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findByPk(req.params.id);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
