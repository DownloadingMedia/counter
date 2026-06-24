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

// Initializing the counter document if it doesn't exist
async function initCounter() {
  try {
    const doc = await Counter.findOne({ name: 'downloads' });
    if (!doc) {
      await Counter.create({ name: 'downloads', count: 0 });
    }
  } catch (err) {
    console.error('Error initializing counter:', err);
  }
}
mongoose.connection.once('open', initCounter);

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.get('/api/downloads', async (req, res) => {
  try {
    const doc = await Counter.findOne({ name: 'downloads' });
    res.json({ count: doc ? doc.count : 0 });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/downloads/hit', async (req, res) => {
  try {
    const doc = await Counter.findOneAndUpdate(
      { name: 'downloads' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    res.json({ count: doc.count });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'DownloadMedia Counter API' });
});

app.listen(PORT, () => {
  console.log(`Counter API running on port ${PORT}`);
});
