const router = require('express').Router();
const BloodBank = require('../models/BloodBank');
const Hospital = require('../models/Hospital');
const { Op } = require('sequelize');

// GET /api/blood/:bloodGroup
router.get('/:bloodGroup', async (req, res) => {
  try {
    const bloodGroup = req.params.bloodGroup.toUpperCase();
    const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    if (!validGroups.includes(bloodGroup)) {
      return res.status(400).json({ message: 'Invalid blood group' });
    }
    
    const results = await BloodBank.findAll({
      where: { 
        bloodGroup,
        availableUnits: { [Op.gt]: 0 }
      },
      include: [{ model: Hospital, as: 'hospital' }],
      order: [['availableUnits', 'DESC']]
    });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
