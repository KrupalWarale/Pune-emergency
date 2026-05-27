const router = require('express').Router();
const Booking = require('../models/Booking');
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const { calculateDistance } = require('../utils/distance');
const { dispatchEmergency, normalizeEmergencyType } = require('../utils/dispatch');

// GET /api/ambulance/nearby?lat=18.5&lng=73.8&limit=5
router.get('/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 5, 20));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ message: 'Valid lat and lng query params are required' });
    }

    const ambulances = await Ambulance.findAll({
      include: [{ model: Hospital, as: 'hospital' }]
    });

    const nearbyAmbulances = ambulances
      .map(ambulance => {
        const data = ambulance.toJSON();
        const distance = calculateDistance(lat, lng, data.latitude, data.longitude);
        const hospitalDistance = data.hospital
          ? calculateDistance(data.latitude, data.longitude, data.hospital.latitude, data.hospital.longitude)
          : null;

        // ETA heuristic: available units can dispatch faster than busy ones.
        const etaMinutes = data.status === 'available'
          ? Math.max(4, Math.round((distance / 40) * 60))
          : Math.max(10, Math.round((distance / 30) * 60) + 8);

        return {
          ...data,
          distance,
          hospitalDistance,
          etaMinutes
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    res.json(nearbyAmbulances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/ambulance/:ambulanceId/hospital-distance
router.get('/:ambulanceId/hospital-distance', async (req, res) => {
  try {
    const ambulance = await Ambulance.findByPk(req.params.ambulanceId, {
      include: [{ model: Hospital, as: 'hospital' }]
    });

    if (!ambulance) {
      return res.status(404).json({ message: 'Ambulance not found' });
    }

    const data = ambulance.toJSON();
    if (!data.hospital) {
      return res.status(404).json({ message: 'Hospital not assigned to this ambulance' });
    }

    if (
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude) ||
      !Number.isFinite(data.hospital.latitude) ||
      !Number.isFinite(data.hospital.longitude)
    ) {
      return res.status(400).json({ message: 'Ambulance or hospital coordinates are missing' });
    }

    const distanceKm = calculateDistance(
      data.latitude,
      data.longitude,
      data.hospital.latitude,
      data.hospital.longitude
    );

    res.json({
      ambulance: {
        id: data.id,
        vehicleId: data.vehicleId,
        status: data.status,
        latitude: data.latitude,
        longitude: data.longitude
      },
      hospital: {
        id: data.hospital.id,
        name: data.hospital.name,
        address: data.hospital.address,
        latitude: data.hospital.latitude,
        longitude: data.hospital.longitude
      },
      distanceKm: Number(distanceKm.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/ambulance/book
router.post('/book', async (req, res) => {
  try {
    const latitude = Number(req.body.latitude ?? req.body.location?.latitude);
    const longitude = Number(req.body.longitude ?? req.body.location?.longitude);
    const emergencyType = normalizeEmergencyType(req.body.emergencyType);

    const dispatch = await dispatchEmergency({
      latitude,
      longitude,
      addressText: req.body.locationText || req.body.location,
      emergencyType,
      patientName: req.body.patientName,
      patientPhone: req.body.patientPhone,
      patientCount: req.body.patientCount,
      incidentDescription: req.body.incidentDescription,
      preparationNeeded: req.body.preparationNeeded,
      priority: req.body.priority || 'critical',
      userId: req.body.userId || null
    });

    if (!dispatch.booking || !dispatch.ambulance) {
      return res.status(503).json({
        message: 'No ambulance is currently available. Nearby hospitals have been notified.',
        selectedHospital: dispatch.hospital ? {
          id: dispatch.hospital.id,
          name: dispatch.hospital.name,
          address: dispatch.hospital.address,
          contactNumber: dispatch.hospital.contactNumber,
          latitude: dispatch.hospital.latitude,
          longitude: dispatch.hospital.longitude,
          distance: dispatch.hospital.distance,
          routeMinutes: dispatch.hospital.routeMinutes,
          trafficLevel: dispatch.hospital.trafficLevel
        } : null,
        attemptedHospitals: dispatch.attemptedHospitals.map(hospital => ({
          name: hospital.name,
          distance: hospital.distance,
          trafficLevel: hospital.trafficLevel,
          availableAmbulances: hospital.availableAmbulances.length
        }))
      });
    }

    res.json({
      bookingId: dispatch.booking.id,
      ambulance: {
        vehicleId: dispatch.ambulance.vehicleId,
        driverName: dispatch.ambulance.driverName,
        driverContact: dispatch.ambulance.driverContact
      },
      selectedHospital: {
        id: dispatch.hospital.id,
        name: dispatch.hospital.name,
        address: dispatch.hospital.address,
        contactNumber: dispatch.hospital.contactNumber,
        latitude: dispatch.hospital.latitude,
        longitude: dispatch.hospital.longitude,
        distance: dispatch.hospital.distance,
        routeMinutes: dispatch.hospital.routeMinutes,
        trafficLevel: dispatch.hospital.trafficLevel
      },
      eta: `${dispatch.hospital.routeMinutes} minutes`,
      fallbackUsed: dispatch.fallbackUsed,
      emergencyMessage: dispatch.emergencyMessage,
      attemptedHospitals: dispatch.attemptedHospitals.map(hospital => ({
        name: hospital.name,
        distance: Number(hospital.distance.toFixed(2)),
        trafficLevel: hospital.trafficLevel,
        availableAmbulances: hospital.availableAmbulances.length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/ambulance/status/:bookingId
router.get('/status/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.bookingId, {
      include: [{ model: Ambulance, as: 'ambulance' }]
    });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
