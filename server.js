const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = 3000;
const port = process.env.PORT || 3000;

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 1000, // 1 Sekunde
  max: 4, // Maximal 4 Anfragen pro Sekunde
  handler: (req, res) => {
    res.status(429).json({ error: 'Zu viele Anfragen, bitte warten Sie 5 Sekunden.' });
  },
  onLimitReached: (req, res, options) => {
    // Warte 5 Sekunden, bevor weitere Anfragen bearbeitet werden
    setTimeout(() => {}, 5000);
  }
});

app.use(cors());
app.use(express.json()); // JSON Body Parser für POST-Anfragen
app.use(limiter); // Rate Limiting auf alle Routen anwenden

// Root Route für Keep-Alive
app.get('/', (req, res) => {
  res.send('OK');
});

// Proxy Route für GET API-Anfragen
app.get('/p/*', async (req, res) => {
  const targetUrl = req.url.replace('/p/', '');
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Proxy Route für POST API-Anfragen
app.post('/p/*', async (req, res) => {
  const targetUrl = req.url.replace('/p/', '');
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...req.headers, // Weitergabe der ursprünglichen Headers
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direkte Weiterleitung für Bilder
app.get('/img/*', async (req, res) => {
  const targetUrl = `https://fireani.me${req.url}`;
  try {
    const response = await fetch(targetUrl);
    const buffer = await response.arrayBuffer();
    res.type(response.headers.get('content-type'));
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);

  // Keep-Alive-Mechanismus
  const keepAlive = () => {
    const url = `http://localhost:${port}/`;
    fetch(url)
      .then(res => console.log(`Keep-Alive request sent, status: ${res.status}`))
      .catch(err => console.error('Error sending keep-alive:', err));
  };

  // Sofortige Ausführung und alle 5 Minuten wiederholen
  keepAlive();
  setInterval(keepAlive, 7 * 60 * 1000);
});
