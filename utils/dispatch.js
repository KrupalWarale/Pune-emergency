const Booking = require('../models/Booking');
const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');
const { calculateDistance } = require('./distance');

function normalizeEmergencyType(emergencyType) {
  return String(emergencyType || 'SOS Emergency').trim() || 'SOS Emergency';
}

function getTrafficLevel(hour) {
  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) return 'high';
  if ((hour >= 12 && hour <= 16) || hour === 22) return 'moderate';
  return 'low';
}

function estimateTrafficDelay(distanceKm, hospital, now = new Date()) {
  const hour = now.getHours();
  const trafficLevel = getTrafficLevel(hour);
  const urbanFactor = calculateDistance(hospital.latitude, hospital.longitude, 18.5204, 73.8567) < 6 ? 1.2 : 0.8;
  const baseDelay = trafficLevel === 'high' ? 8 : trafficLevel === 'moderate' ? 4 : 1;
  const variableDelay = Math.round(distanceKm * urbanFactor);

  return {
    trafficLevel,
    delayMinutes: baseDelay + variableDelay
  };
}

function estimateRouteMinutes(distanceKm, trafficDelayMinutes) {
  return Math.max(5, Math.round((distanceKm / 38) * 60) + trafficDelayMinutes);
}

function buildEmergencyMessage({ emergencyType, hospital, addressText, patientName, patientPhone, routeMinutes }) {
  const callerName = patientName || 'Unknown caller';
  const callerPhone = patientPhone || 'No callback number';

  return [
    `SOS DISPATCH: ${normalizeEmergencyType(emergencyType)}`,
    `Destination hospital: ${hospital.name}`,
    `Patient/caller: ${callerName}`,
    `Contact: ${callerPhone}`,
    `Pickup location: ${addressText || 'GPS coordinates received'}`,
    `Estimated route time: ${routeMinutes} minutes`
  ].join(' | ');
}

async function rankHospitalsForDispatch({ latitude, longitude, emergencyType }) {
  const hospitals = await Hospital.findAll({
    include: [{ model: Ambulance, as: 'ambulances' }]
  });

  return hospitals
    .map(hospitalInstance => {
      const hospital = hospitalInstance.toJSON();
      const distance = calculateDistance(latitude, longitude, hospital.latitude, hospital.longitude);
      const { trafficLevel, delayMinutes } = estimateTrafficDelay(distance, hospital);
      const routeMinutes = estimateRouteMinutes(distance, delayMinutes);
      const specialties = Array.isArray(hospital.specialties) ? hospital.specialties : [];
      const emergencyText = normalizeEmergencyType(emergencyType).toLowerCase();
      const specialtyMatch = specialties.some(item => emergencyText.includes(String(item).toLowerCase()));
      const ambulances = Array.isArray(hospital.ambulances) ? hospital.ambulances : [];
      const availableAmbulances = ambulances.filter(ambulance => ambulance.status === 'available');
      const score =
        routeMinutes +
        (hospital.availableBeds > 0 ? 0 : 15) + // Bed penalty reduced
        (availableAmbulances.length > 0 ? 0 : 50) - // No-Ambulance penalty increased
        Math.min(hospital.availableBeds || 0, 20) * 0.1 - // Bed bonus reduced
        (specialtyMatch ? 4 : 0); // Specialty bonus reduced

      return {
        ...hospital,
        distance,
        trafficLevel,
        trafficDelayMinutes: delayMinutes,
        routeMinutes,
        specialtyMatch,
        availableAmbulances,
        score
      };
    })
    .sort((a, b) => a.score - b.score || a.distance - b.distance);
}

async function dispatchEmergency({
  latitude,
  longitude,
  addressText,
  emergencyType,
  patientName,
  patientPhone,
  patientCount = 1,
  incidentDescription = '',
  preparationNeeded = '',
  priority = 'critical',
  userId = null
}) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid pickup coordinates are required');
  }

  const rankedHospitals = await rankHospitalsForDispatch({ latitude, longitude, emergencyType });
  if (!rankedHospitals.length) {
    throw new Error('No hospitals available in the network');
  }

  // --- Cascade through hospitals in ranked order until one with an available ambulance is found ---
  const cascadeLog = [];          // record every hospital checked and why it was skipped
  let selectedHospital = null;

  for (const hospital of rankedHospitals) {
    if (hospital.availableAmbulances.length === 0) {
      cascadeLog.push({
        name: hospital.name,
        distance: Number(hospital.distance.toFixed(2)),
        trafficLevel: hospital.trafficLevel,
        skipReason: 'no_ambulance_available',
        availableAmbulances: 0
      });
      continue; // try next nearest hospital
    }

    // Found a hospital with at least one ready ambulance — use it
    selectedHospital = hospital;
    cascadeLog.push({
      name: hospital.name,
      distance: Number(hospital.distance.toFixed(2)),
      trafficLevel: hospital.trafficLevel,
      skipReason: null,           // null = selected (not skipped)
      availableAmbulances: hospital.availableAmbulances.length
    });
    break;
  }

  const fallbackUsed = Boolean(selectedHospital && rankedHospitals[0].id !== selectedHospital.id);

  // No hospital in the entire network has a free ambulance
  if (!selectedHospital) {
    return {
      booking: null,
      ambulance: null,
      hospital: rankedHospitals[0],          // nearest hospital for directions
      fallbackUsed: true,
      cascadeLog,
      emergencyMessage: buildEmergencyMessage({
        emergencyType,
        hospital: rankedHospitals[0],
        addressText,
        patientName,
        patientPhone,
        routeMinutes: rankedHospitals[0].routeMinutes
      }),
      attemptedHospitals: rankedHospitals.slice(0, 5)
    };
  }

  // Pick the closest available ambulance within the chosen hospital
  const ambulanceChoice = selectedHospital.availableAmbulances
    .map(ambulance => ({
      ...ambulance,
      distanceToPickup: calculateDistance(latitude, longitude, ambulance.latitude, ambulance.longitude)
    }))
    .sort((a, b) => a.distanceToPickup - b.distanceToPickup)[0];

  const emergencyMessage = buildEmergencyMessage({
    emergencyType,
    hospital: selectedHospital,
    addressText,
    patientName,
    patientPhone,
    routeMinutes: selectedHospital.routeMinutes
  });

  const booking = await Booking.create({
    userId,
    patientName: patientName || 'SOS Caller',
    patientPhone: patientPhone || 'Not provided',
    emergencyType: normalizeEmergencyType(emergencyType),
    location: addressText || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
    latitude,
    longitude,
    ambulanceId: ambulanceChoice.id,
    status: 'assigned',
    priority,
    notes: emergencyMessage,
    patientCount: parseInt(patientCount) || 1,
    incidentDescription,
    preparationNeeded,
    estimatedArrival: new Date(Date.now() + selectedHospital.routeMinutes * 60000)
  });

  await Ambulance.update({ status: 'busy' }, { where: { id: ambulanceChoice.id } });

  return {
    booking,
    ambulance: ambulanceChoice,
    hospital: selectedHospital,
    fallbackUsed,
    cascadeLog,
    emergencyMessage,
    attemptedHospitals: rankedHospitals.slice(0, 5)
  };
}

module.exports = {
  dispatchEmergency,
  rankHospitalsForDispatch,
  normalizeEmergencyType
};
