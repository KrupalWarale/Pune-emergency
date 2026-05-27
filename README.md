# Pune Emergency Medical Services

A comprehensive emergency medical services platform for Pune district, featuring real-time hospital finder with Google Maps integration, ambulance booking, blood bank search, and volunteer network.

## ✅ What's Included

- **Express REST API** with 8 endpoints
- **Supabase PostgreSQL Database** (cloud-hosted, scalable)
- **6 Data Models**: Hospitals, Ambulances, Bookings, Volunteers, Blood Bank, Patients
- **Automatic Seeding**: 170+ Pune hospitals, 37 ambulances, 96 blood bank records automatically populated on first run
- **Distance Calculation**: Haversine formula for finding nearest hospitals
- **CORS Enabled**: Works with frontend on any port
- **Google Maps Integration**: Real-time hospital search and mapping

## 🚀 Quick Start

### 1. Configure Environment

Edit the `.env` file and add your Google Maps API Key:

```
PORT=5000
JWT_SECRET=your_secret_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
SUPABASE_DB_URL=your_supabase_database_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Start the Application

Everything (including database setup and seeding) happens with a single command:

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open `http://localhost:5000` in your browser.

## 📡 API Endpoints

### Hospitals

- `GET /api/hospitals?lat=18.5&lng=73.8` - Get all hospitals with distance
- `GET /api/hospitals/:id` - Get single hospital

### Ambulance Booking

- `POST /api/ambulance/book` - Book nearest ambulance
- `GET /api/ambulance/status/:bookingId` - Track booking

### Blood Bank

- `GET /api/blood/:bloodGroup` - Find blood availability

### SOS Alert

- `POST /api/sos` - Trigger emergency alert

## 📁 Project Structure

```
├── models/           # Sequelize models (PostgreSQL)
├── routes/           # API route handlers
├── utils/            # Helper functions & auto-seeding logic
├── public/           # Frontend assets (HTML, CSS, JS)
├── docs/             # Documentation
├── server.js         # Main Express server (Entry point)
└── package.json      # Dependencies & start scripts
```

## 🗄️ Database

Uses **Supabase PostgreSQL**. The database tables are created automatically using Sequelize migrations. Data is migrated from SQLite to Supabase for production scalability.
