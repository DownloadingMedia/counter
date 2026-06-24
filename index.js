const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const COUNT_FILE = path.join(__dirname, 'count.json');

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

function readCount() {
  try {
    const raw = fs.readFileSync(COUNT_FILE, 'utf8');
    return JSON.parse(raw).count || 0;
  } catch {
    return 0;
  }
}

function writeCount(count) {
  fs.writeFileSync(COUNT_FILE, JSON.stringify({ count }, null, 2), 'utf8');
}

app.get('/api/downloads', (req, res) => {
  const count = readCount();
  res.json({ count });
});

app.post('/api/downloads/hit', (req, res) => {
  const count = readCount() + 1;
  writeCount(count);
  res.json({ count });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'DownloadMedia Counter API' });
});

app.listen(PORT, () => {
  console.log(`Counter API running on port ${PORT}`);
});
