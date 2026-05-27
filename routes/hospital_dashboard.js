const router = require('express').Router();
const Booking = require('../models/Booking');
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');

// GET /api/hospital-dashboard/:hospitalId/requests
router.get('/:hospitalId/requests', async (req, res) => {
  try {
    const hospitalId = req.params.hospitalId;
    
    // Find all ambulances belonging to this hospital
    const ambulances = await Ambulance.findAll({
      where: { hospitalId },
      attributes: ['id']
    });
    
    const ambulanceIds = ambulances.map(a => a.id);
    
    // Find all bookings assigned to these ambulances that are ACTIVE
    const bookings = await Booking.findAll({
      where: {
        ambulanceId: ambulanceIds,
        status: ['assigned', 'acknowledged', 'in-progress']
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Ambulance,
          as: 'ambulance',
          attributes: ['vehicleId', 'driverName', 'driverContact']
        }
      ]
    });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/hospital-dashboard/:hospitalId/check-active
router.get('/:hospitalId/check-active', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const ambulances = await Ambulance.findAll({ where: { hospitalId }, attributes: ['id'] });
    const ambulanceIds = ambulances.map(a => a.id);
    const activeBooking = await Booking.findOne({
      where: {
        ambulanceId: ambulanceIds,
        status: ['assigned', 'acknowledged', 'in-progress']
      }
    });
    res.json({ hasActive: !!activeBooking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/hospital-dashboard/:hospitalId/requests-history
router.get('/:hospitalId/requests-history', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const ambulances = await Ambulance.findAll({ where: { hospitalId }, attributes: ['id'] });
    const ambulanceIds = ambulances.map(a => a.id);
    const bookings = await Booking.findAll({
      where: {
        ambulanceId: ambulanceIds,
        status: ['completed', 'cancelled']
      },
      order: [['updatedAt', 'DESC']],
      limit: 20,
      include: [{ model: Ambulance, as: 'ambulance', attributes: ['vehicleId'] }]
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/hospital-dashboard/driver/:vehicleId/active-booking
router.get('/driver/:vehicleId/active-booking', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const ambulance = await Ambulance.findOne({ where: { vehicleId } });
    if (!ambulance) return res.status(404).json({ message: 'Ambulance not found' });

    const booking = await Booking.findOne({
      where: {
        ambulanceId: ambulance.id,
        status: ['assigned', 'in-progress', 'acknowledged']
      },
      order: [['createdAt', 'DESC']]
    });

    if (!booking) return res.status(404).json({ message: 'No active booking assigned' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/hospital-dashboard/booking/:id/details
router.patch('/booking/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const { patientCount, incidentDescription, preparationNeeded } = req.body;

    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    console.log(`[Dashboard] Updating booking ${id}:`, { patientCount, incidentDescription, preparationNeeded });
    
    await booking.update({
      patientCount: patientCount !== undefined ? patientCount : booking.patientCount,
      incidentDescription: incidentDescription !== undefined ? incidentDescription : booking.incidentDescription,
      preparationNeeded: preparationNeeded !== undefined ? preparationNeeded : booking.preparationNeeded,
      status: req.body.status || booking.status
    });

    const updatedBooking = await Booking.findByPk(id, {
      include: [{ model: Ambulance, as: 'ambulance', attributes: ['vehicleId'] }]
    });

    console.log(`[Dashboard] Booking ${id} updated successfully`);
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/hospital-dashboard/booking/:id/acknowledge
router.post('/booking/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    await booking.update({ status: 'acknowledged' });
    res.json({ message: 'Booking acknowledged', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/hospital-dashboard/booking/:id/complete
router.post('/booking/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Mark booking as completed
    await booking.update({ status: 'completed' });

    // Mark assigned ambulance as available
    if (booking.ambulanceId) {
      await Ambulance.update(
        { status: 'available' },
        { where: { id: booking.ambulanceId } }
      );
    }

    res.json({ message: 'Booking completed and archived' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
