const router = require('express').Router();
const Patient = require('../models/Patient');

// POST /api/patient/healthid
router.post('/healthid', async (req, res) => {
  try {
    const { healthId, name, dateOfBirth, bloodGroup, allergies, currentMedications, 
            chronicConditions, emergencyContacts, preferredHospital } = req.body;
    
    // Simple validation
    if (!name || !bloodGroup) {
      return res.status(400).json({ message: 'Name and blood group are required' });
    }
    
    let patient;
    if (healthId) {
      // Update existing
      const existing = await Patient.findOne({ where: { healthId } });
      if (existing) {
        await existing.update({
          name, dateOfBirth, bloodGroup, allergies, currentMedications, 
          chronicConditions, emergencyContacts, preferredHospital
        });
        patient = existing;
      }
    } else {
      // Generate new health ID
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const newHealthId = `PNE-HID-${randomNum}`;
      
      patient = await Patient.create({
        healthId: newHealthId,
        name,
        dateOfBirth,
        bloodGroup,
        allergies: allergies || [],
        currentMedications: currentMedications || [],
        chronicConditions: chronicConditions || [],
        emergencyContacts: emergencyContacts || [],
        preferredHospital
      });
    }
    
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
