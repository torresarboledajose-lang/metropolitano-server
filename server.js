// server.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/telemetry', (req, res) => {
  console.log('📡 Datos recibidos del ESP32:', req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Servidor IoT del Metropolitano activo ✅'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor en puerto', PORT));
