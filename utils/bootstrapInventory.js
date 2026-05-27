const Hospital = require('../models/Hospital');
const Ambulance = require('../models/Ambulance');
const BloodBank = require('../models/BloodBank');
const hospitalData = require('./hospitalData');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function createDriverContact(hospitalId, ambulanceIndex) {
  return `98200${String(hospitalId).padStart(2, '0')}${ambulanceIndex}00`;
}

function createVehicleId(hospitalId, ambulanceIndex) {
  return `PUN-AMB-${String(hospitalId).padStart(2, '0')}${ambulanceIndex}`;
}

async function ensureEmergencyInventory() {
  try {
    // 1. Ensure Hospitals exist
    const hospitalCount = await Hospital.count();
    if (hospitalCount === 0) {
      console.log('🏥 Seeding initial hospital data...');
      await Hospital.bulkCreate(hospitalData);
      console.log(`✅ Seeded ${hospitalData.length} hospitals.`);
    }

    const hospitals = await Hospital.findAll({ order: [['id', 'ASC']] });
    if (!hospitals.length) return;

    // 2. Ensure Ambulances exist
    const ambulanceCount = await Ambulance.count();
    if (ambulanceCount === 0) {
      console.log('🚑 Restoring ambulance records...');
      const ambulances = [];
      hospitals.forEach(hospital => {
        const total = Math.max(Number(hospital.ambulanceCount) || 0, 1);
        for (let i = 0; i < total; i += 1) {
          ambulances.push({
            vehicleId: createVehicleId(hospital.id, i),
            status: i < 2 ? 'available' : 'busy',
            driverName: `Driver ${hospital.name.split(' ')[0]}-${i + 1}`,
            driverContact: createDriverContact(hospital.id, i),
            hospitalId: hospital.id,
            latitude: hospital.latitude,
            longitude: hospital.longitude
          });
        }
      });
      await Ambulance.bulkCreate(ambulances);
      console.log(`✅ Restored ${ambulances.length} ambulance records.`);
    }

    // 3. Ensure Blood Bank records exist
    const bloodBankCount = await BloodBank.count();
    if (bloodBankCount === 0) {
      console.log('🩸 Restoring blood bank records...');
      const bloodBankData = [];
      hospitals.forEach(hospital => {
        BLOOD_GROUPS.forEach((bloodGroup, index) => {
          bloodBankData.push({
            hospitalId: hospital.id,
            bloodGroup,
            availableUnits: 8 + ((hospital.id * 7 + index * 5) % 36)
          });
        });
      });
      await BloodBank.bulkCreate(bloodBankData);
      console.log(`✅ Restored ${bloodBankData.length} blood bank records.`);
    }
  } catch (error) {
    console.error('❌ Error during inventory bootstrap:', error);
  }
}

module.exports = { ensureEmergencyInventory };
