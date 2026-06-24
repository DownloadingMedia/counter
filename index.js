require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const counterSchema = new mongoose.Schema({
  name: { type: String, default: 'downloads', unique: true },
  count: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// ─── Caching & Batching Logic ────────────────────────────────────────────────
let localCount = 0;
let pendingHits = 0;
let isLoaded = false;
let isSyncing = false;

// Initializing the counter document if it doesn't exist
async function initCounter() {
  try {
    const doc = await Counter.findOne({ name: 'downloads' });
    if (!doc) {
      await Counter.create({ name: 'downloads', count: 0 });
      localCount = 0;
    } else {
      localCount = doc.count;
    }
    isLoaded = true;
    console.log(`Initial count loaded: ${localCount}`);
  } catch (err) {
    console.error('Error initializing counter:', err);
  }
}
mongoose.connection.once('open', initCounter);

// Background task to flush hits to DB every 5 seconds
setInterval(async () => {
  if (pendingHits > 0 && !isSyncing && isLoaded) {
    isSyncing = true;
    const hitsToSync = pendingHits;
    pendingHits = 0; // Reset immediately to capture new hits during DB await

    try {
      const doc = await Counter.findOneAndUpdate(
        { name: 'downloads' },
        { $inc: { count: hitsToSync } },
        { new: true, upsert: true }
      );
      if (doc) {
        // True up the local count with DB (in case of multiple server instances)
        // plus any hits that accumulated while we were awaiting the DB
        localCount = doc.count + pendingHits; 
      }
    } catch (err) {
      console.error('Error syncing counter to DB:', err);
      // Restore hits so they aren't lost
      pendingHits += hitsToSync;
    } finally {
      isSyncing = false;
    }
  }
}, 5000);

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.get('/api/downloads', async (req, res) => {
  // Return immediately from memory (ultra-fast, no DB cost)
  if (isLoaded) {
    return res.json({ count: localCount + pendingHits });
  }
  
  // Fallback if requested before init finishes
  try {
    const doc = await Counter.findOne({ name: 'downloads' });
    if (doc) {
      localCount = doc.count;
      isLoaded = true;
    }
    res.json({ count: localCount + pendingHits });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/downloads/hit', (req, res) => {
  // Just increment in memory, the setInterval will batch it to DB
  localCount++;
  pendingHits++;
  res.json({ count: localCount });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'DownloadMedia Counter API' });
});

app.listen(PORT, () => {
  console.log(`Counter API running on port ${PORT}`);
});
