const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();

const PORT = process.env.PORT || 3000;

// Rate Limiting: 4 requests per second per IP
const limiter = rateLimit({
  windowMs: 1000, 
  max: 4, 
  standardHeaders: true, 
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Zu viele Anfragen. Bitte warten Sie.' });
  }
});

// Enable CORS for ALL origins (since this is a public tool for you)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(limiter);

// Health Check
app.get('/', (req, res) => {
  res.send('Proxy is running');
});

// Universal Proxy Route (Handles both GET and POST)
app.all('/p/*', async (req, res) => {
  // Reconstruct the target URL (e.g., https://discord.com/api/...)
  const targetUrl = `https://${req.params[0]}`;
  
  try {
    // Filter headers: Only forward essential ones to avoid "Hop-by-hop" errors
    const forwardedHeaders = {
      'Content-Type': 'application/json',
      'Authorization': req.headers.authorization, // Explicitly forward the token
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Mimic a browser
    };

    const fetchOptions = {
      method: req.method,
      headers: forwardedHeaders,
    };

    // Attach body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // Forward the JSON response from Discord
    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch from target', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});Copied!   
