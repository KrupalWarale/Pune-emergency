# 📊 Database Guide - Pune Emergency Medical Services

## 📁 Database Files

Your project has **2 database files**:

### 1. **database.sqlite** (Main Database)
- **Type:** SQLite binary file
- **Purpose:** Actual database used by the backend
- **Location:** `C:\Users\user\Desktop\SE Pune Emergency\database.sqlite`
- **Size:** Small (few KB)
- **Can't read directly:** Need SQLite viewer tool

### 2. **database-view.json** (Readable View) ✨ NEW!
- **Type:** JSON text file
- **Purpose:** Human-readable view of all database data
- **Location:** `C:\Users\user\Desktop\SE Pune Emergency\database-view.json`
- **Can open with:** Any text editor (Notepad, VS Code, etc.)
- **Updates:** Run `npm run view-db` to refresh

---

## 🎯 How to View Your Data

### **Option 1: View JSON File (Easiest!)**

1. Open `database-view.json` in any text editor
2. See all your data in readable format:
   - 🏥 Hospitals
   - 🚑 Ambulances
   - 📋 Bookings
   - 🙋 Volunteers
   - 🩸 Blood Bank
   - 🪪 Patients

### **Option 2: Update the View**

Whenever you add new data (bookings, volunteers, etc.), refresh the view:

```bash
npm run view-db
```

This will update `database-view.json` with latest data!

---

## 📊 What's Inside database-view.json

```json
{
  "📊 DATABASE OVERVIEW": {
    "Last Updated": "22/4/2026, 5:42:34 pm",
    "Total Records": {
      "Hospitals": 12,
      "Ambulances": 37,
      "Bookings": 2,
      "Volunteers": 0,
      "Blood Bank Records": 96,
      "Patients": 1
    }
  },
  "🏥 HOSPITALS": [...],
  "🚑 AMBULANCES": [...],
  "📋 BOOKINGS": [...],
  "🙋 VOLUNTEERS": [...],
  "🩸 BLOOD BANK": [...],
  "🪪 PATIENTS": [...]
}
```

---

## 🔄 Common Commands

| Command | What it does |
|---------|-------------|
| `npm run view-db` | Export database to readable JSON |
| `npm run seed` | Reset database with fresh hospital data |
| `npm start` | Start the backend server |

---

## 📝 How to Add/Edit Data

### **Method 1: Use the Website (Recommended)**
- Book ambulances → Creates bookings
- Register volunteers → Adds volunteers
- Create health IDs → Adds patients
- Then run `npm run view-db` to see changes

### **Method 2: Edit JSON (Not Recommended)**
⚠️ **Warning:** Editing `database-view.json` won't change the actual database!
- This file is just a VIEW of the data
- Changes here won't be saved to `database.sqlite`
- Use the website or seed script to modify data

### **Method 3: Use DB Browser for SQLite**
1. Download: https://sqlitebrowser.org/dl/
2. Open `database.sqlite`
3. Edit data directly
4. Run `npm run view-db` to update the JSON view

---

## 💾 Backup Your Data

**To backup everything:**
```bash
copy database.sqlite database-backup.sqlite
```

**To restore:**
```bash
copy database-backup.sqlite database.sqlite
```

---

## 🎯 Quick Example

**After booking an ambulance on the website:**

1. Run:
   ```bash
   npm run view-db
   ```

2. Open `database-view.json`

3. Look at the "📋 BOOKINGS" section

4. You'll see your new booking with:
   - Patient name
   - Phone number
   - Emergency type
   - Ambulance assigned
   - Status
   - Timestamp

---

## 📊 Current Database Stats

Run `npm run view-db` anytime to see:
- Total hospitals: 12
- Total ambulances: 37
- Total bookings: Updates in real-time
- Total volunteers: Updates in real-time
- Blood bank records: 96
- Patient records: Updates in real-time

---

## 🆘 Troubleshooting

**Q: database-view.json is empty or missing?**
A: Run `npm run view-db` to create/update it

**Q: Changes not showing in JSON?**
A: Run `npm run view-db` after making changes

**Q: Want to reset everything?**
A: Run `npm run seed` (⚠️ deletes all data!)

---

## ✅ Summary

- ✅ **database.sqlite** = Actual database (binary)
- ✅ **database-view.json** = Readable view (text)
- ✅ Run `npm run view-db` to update the view
- ✅ Open JSON file in any text editor to see data
- ✅ Use website to add data, then refresh view

Enjoy easy database viewing! 🎉
