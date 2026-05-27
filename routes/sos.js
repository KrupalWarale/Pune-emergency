const router = require('express').Router();
const { dispatchEmergency, normalizeEmergencyType } = require('../utils/dispatch');

// POST /api/sos
router.post('/', async (req, res) => {
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
      priority: 'critical',
      userId: req.body.userId || null
    });

    if (!dispatch.booking || !dispatch.ambulance) {
      return res.status(503).json({
        message: 'No ambulance is currently available. Nearby hospitals have been notified.',
        alertId: Date.now().toString(),
        notifiedHospitals: dispatch.attemptedHospitals.slice(0, 3).map(hospital => ({
          name: hospital.name,
          distance: Number(hospital.distance.toFixed(2)),
          trafficLevel: hospital.trafficLevel,
          availableAmbulances: hospital.availableAmbulances.length
        })),
        selectedHospital: dispatch.hospital ? {
          id: dispatch.hospital.id,
          name: dispatch.hospital.name,
          address: dispatch.hospital.address,
          contactNumber: dispatch.hospital.contactNumber,
          latitude: dispatch.hospital.latitude,
          longitude: dispatch.hospital.longitude,
          distance: dispatch.hospital.distance,
          trafficLevel: dispatch.hospital.trafficLevel,
          routeMinutes: dispatch.hospital.routeMinutes
        } : null,
        fallbackUsed: dispatch.fallbackUsed,
        cascadeLog: dispatch.cascadeLog || [],
        emergencyMessage: dispatch.emergencyMessage
      });
    }

    res.json({
      alertId: Date.now().toString(),
      notifiedHospitals: dispatch.attemptedHospitals.slice(0, 3).map(hospital => ({
        name: hospital.name,
        distance: Number(hospital.distance.toFixed(2)),
        trafficLevel: hospital.trafficLevel,
        availableAmbulances: hospital.availableAmbulances.length
      })),
      assignedAmbulance: dispatch.booking ? {
        bookingId: dispatch.booking.id,
        hospitalId: dispatch.hospital.id,
        eta: `${dispatch.hospital.routeMinutes} minutes`,
        vehicleId: dispatch.ambulance.vehicleId,
        hospital: dispatch.hospital.name
      } : null,
      selectedHospital: dispatch.hospital ? {
        id: dispatch.hospital.id,
        name: dispatch.hospital.name,
        address: dispatch.hospital.address,
        contactNumber: dispatch.hospital.contactNumber,
        latitude: dispatch.hospital.latitude,
        longitude: dispatch.hospital.longitude,
        distance: dispatch.hospital.distance,
        trafficLevel: dispatch.hospital.trafficLevel,
        routeMinutes: dispatch.hospital.routeMinutes
      } : null,
      fallbackUsed: dispatch.fallbackUsed,
      cascadeLog: dispatch.cascadeLog || [],
      emergencyMessage: dispatch.emergencyMessage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
