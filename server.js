// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors()); // útil si sirves la UI desde otro origen

// ======= CONFIG =======
const GEOFENCE_RADIUS_M = 60;          // radio para considerar “en paradero”
const DEFAULT_LINE_ID = 'troncal_c';   // línea por defecto si no envían nada
const DEFAULT_DIR = 'sur_norte';       // 'norte_sur' | 'sur_norte'

// ======= HELPERS DE NORMALIZACIÓN =======
const normId = (v) => String(v ?? '').trim().toLowerCase();

// ======= RUTAS POR LÍNEA Y DIRECCIÓN =======
// IDs en snake/minúsculas para consistencia
const LINES = {
  troncal_c: {
    norte_sur: [
      { id: 'ramon_castilla',   name: 'Ramón Castilla',             lat: -12.04345, lon: -77.04190, alt: 139 },
      { id: 'tacna',            name: 'Tacna',                      lat: -12.04626, lon: -77.03718, alt: 152 },
      { id: 'jiron_union',      name: 'Jirón de la Unión',          lat: -12.04822, lon: -77.03300 },
      { id: 'colmena',          name: 'Estación Colmena',           lat: -12.04873, lon: -77.03287 },
      { id: 'central',          name: 'Estación Central',           lat: -12.05749, lon: -77.03599 },
      { id: 'estadio_nacional', name: 'Estación Estadio Nacional',  lat: -12.06836, lon: -77.03220 },
      { id: 'mexico',           name: 'Estación México',            lat: -12.07646, lon: -77.02893 },
      { id: 'canada',           name: 'Estación Canadá',            lat: -12.08147, lon: -77.02660 },
      { id: 'javier_prado',     name: 'Estación Javier Prado',      lat: -12.09031, lon: -77.02268 },
      { id: 'canaval_moreyra',  name: 'Estación Canaval y Moreyra', lat: -12.09587, lon: -77.02510 },
      { id: 'aramburu',         name: 'Estación Aramburú',          lat: -12.10192, lon: -77.02723 },
      { id: 'domingo_orue',     name: 'Estación Domingo Orué',      lat: -12.10820, lon: -77.02645 },
      { id: 'angamos',          name: 'Estación Angamos',           lat: -12.11314, lon: -77.02596 },
      { id: 'ricardo_palma',    name: 'Estación Ricardo Palma',     lat: -12.11820, lon: -77.02582 },
      { id: 'benavides',        name: 'Estación Benavides',         lat: -12.12453, lon: -77.02434 },
      { id: '28_de_julio',      name: 'Estación 28 de Julio',       lat: -12.12887, lon: -77.02279 },
      { id: 'plaza_de_flores',  name: 'Estación Plaza de Flores',   lat: -12.13527, lon: -77.01871 },
      { id: 'balta',            name: 'Estación Balta',             lat: -12.13552, lon: -77.01868 },
      { id: 'bulevar',          name: 'Estación Bulevar',           lat: -12.14799, lon: -77.02015 },
      { id: 'estadio_union',    name: 'Estación Estadio Unión',     lat: -12.15300, lon: -77.01971 },
      { id: 'escuela_militar',  name: 'Estación Escuela Militar',   lat: -12.15945, lon: -77.01890 },
      { id: 'teran',            name: 'Estación Terán',             lat: -12.16845, lon: -77.01870 },
      { id: 'plaza_lima_sur',   name: 'Estación Plaza Lima Sur',    lat: -12.17337, lon: -77.01478 },
      { id: 'matellini',        name: 'Estación Matellini',         lat: -12.17857, lon: -77.00999 }
    ],
    sur_norte: [
      { id: 'matellini',        name: 'Estación Matellini',         lat: -12.17857, lon: -77.00999 },
      { id: 'plaza_lima_sur',   name: 'Estación Plaza Lima Sur',    lat: -12.17337, lon: -77.01478 },
      { id: 'teran',            name: 'Estación Terán',             lat: -12.16845, lon: -77.01870 },
      { id: 'escuela_militar',  name: 'Estación Escuela Militar',   lat: -12.15945, lon: -77.01890 },
      { id: 'estadio_union',    name: 'Estación Estadio Unión',     lat: -12.15300, lon: -77.01971 },
      { id: 'bulevar',          name: 'Estación Bulevar',           lat: -12.14799, lon: -77.02015 },
      { id: 'balta',            name: 'Estación Balta',             lat: -12.13552, lon: -77.01868 },
      { id: 'plaza_de_flores',  name: 'Estación Plaza de Flores',   lat: -12.13527, lon: -77.01871 },
      { id: '28_de_julio',      name: 'Estación 28 de Julio',       lat: -12.12887, lon: -77.02279 },
      { id: 'benavides',        name: 'Estación Benavides',         lat: -12.12453, lon: -77.02434 },
      { id: 'ricardo_palma',    name: 'Estación Ricardo Palma',     lat: -12.11820, lon: -77.02582 },
      { id: 'angamos',          name: 'Estación Angamos',           lat: -12.11314, lon: -77.02596 },
      { id: 'domingo_orue',     name: 'Estación Domingo Orué',      lat: -12.10820, lon: -77.02645 },
      { id: 'aramburu',         name: 'Estación Aramburú',          lat: -12.10192, lon: -77.02723 },
      { id: 'canaval_moreyra',  name: 'Estación Canaval y Moreyra', lat: -12.09587, lon: -77.02510 },
      { id: 'javier_prado',     name: 'Estación Javier Prado',      lat: -12.09031, lon: -77.02268 },
      { id: 'canada',           name: 'Estación Canadá',            lat: -12.08147, lon: -77.02660 },
      { id: 'mexico',           name: 'Estación México',            lat: -12.07646, lon: -77.02893 },
      { id: 'estadio_nacional', name: 'Estación Estadio Nacional',  lat: -12.06836, lon: -77.03220 },
      { id: 'central',          name: 'Estación Central',           lat: -12.05749, lon: -77.03599 },
      { id: 'colmena',          name: 'Estación Colmena',           lat: -12.04873, lon: -77.03287 },
      { id: 'jiron_union',      name: 'Jirón de la Unión',          lat: -12.04822, lon: -77.03300 },
      { id: 'tacna',            name: 'Tacna',                      lat: -12.04626, lon: -77.03718, alt: 152 },
      { id: 'ramon_castilla',   name: 'Ramón Castilla',             lat: -12.04345, lon: -77.04190, alt: 139 }
    ]
  },

  // Expreso 1: Central ↔ Matellini
  expreso_1: {
    norte_sur: [
      { id: 'central',          name: 'Estación Central',           lat: -12.05749, lon: -77.03599 },
      { id: 'estadio_nacional', name: 'Estación Estadio Nacional',  lat: -12.06836, lon: -77.03220 },
      { id: 'javier_prado',     name: 'Estación Javier Prado',      lat: -12.09031, lon: -77.02268 },
      { id: 'canaval_moreyra',  name: 'Estación Canaval y Moreyra', lat: -12.09587, lon: -77.02510 },
      { id: 'angamos',          name: 'Estación Angamos',           lat: -12.11314, lon: -77.02596 },
      { id: '28_de_julio',      name: 'Estación 28 de Julio',       lat: -12.12887, lon: -77.02279 },
      { id: 'balta',            name: 'Estación Balta',             lat: -12.13552, lon: -77.01868 },
      { id: 'estadio_union',    name: 'Estación Estadio Unión',     lat: -12.15300, lon: -77.01971 },
      { id: 'teran',            name: 'Estación Terán',             lat: -12.16845, lon: -77.01870 },
      { id: 'matellini',        name: 'Estación Matellini',         lat: -12.17857, lon: -77.00999 }
    ],
    sur_norte: [
      { id: 'matellini',        name: 'Estación Matellini',         lat: -12.17857, lon: -77.00999 },
      { id: 'teran',            name: 'Estación Terán',             lat: -12.16845, lon: -77.01870 },
      { id: 'estadio_union',    name: 'Estación Estadio Unión',     lat: -12.15300, lon: -77.01971 },
      { id: 'balta',            name: 'Estación Balta',             lat: -12.13552, lon: -77.01868 },
      { id: '28_de_julio',      name: 'Estación 28 de Julio',       lat: -12.12887, lon: -77.02279 },
      { id: 'angamos',          name: 'Estación Angamos',           lat: -12.11314, lon: -77.02596 },
      { id: 'canaval_moreyra',  name: 'Estación Canaval y Moreyra', lat: -12.09587, lon: -77.02510 },
      { id: 'javier_prado',     name: 'Estación Javier Prado',      lat: -12.09031, lon: -77.02268 },
      { id: 'estadio_nacional', name: 'Estación Estadio Nacional',  lat: -12.06836, lon: -77.03220 },
      { id: 'central',          name: 'Estación Central',           lat: -12.05749, lon: -77.03599 }
    ]
  }
};

// ======= ESTADO EN MEMORIA =======
const deviceState = new Map();  // deviceId -> estado
const segmentStats = new Map(); // `${line}|${dir}|${a}->${b}` -> { count, avgSec }

// ======= UTILIDADES =======
function toRad(d){ return d*Math.PI/180; }
function haversineMeters(a,b){
  const R=6371000;
  const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  const s= Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function getStops(lineId, dir){
  const L = LINES[normId(lineId)];
  if(!L) return null;
  return L[normId(dir)] || null;
}
function stopIndex(stops, id){
  const nid = normId(id);
  return stops.findIndex(s => normId(s.id) === nid);
}
function segKey(lineId, dir, aId, bId){
  return `${normId(lineId)}|${normId(dir)}|${normId(aId)}->${normId(bId)}`;
}
function updateSegmentAvg(lineId, dir, aId, bId, seconds){
  const key = segKey(lineId,dir,aId,bId);
  const row = segmentStats.get(key) || { count:0, avgSec:0 };
  row.avgSec = (row.avgSec*row.count + seconds)/(row.count+1);
  row.count += 1;
  segmentStats.set(key,row);
}
function nearestStopInLine(lineId, dir, lat, lon){
  const stops = getStops(lineId, dir);
  if(!stops) return null;
  const here = {lat,lon};
  let best=null;
  for(const s of stops){
    const d = haversineMeters(here,s);
    if(!best || d<best.distance) best = {...s, distance:d};
  }
  return best; // {id,name,lat,lon,distance}
}
function estimateETA(lineId, dir, fromId, toId){
  const stops = getStops(lineId, dir);
  if(!stops) return null;
  const iFrom = stopIndex(stops, fromId);
  const iTo   = stopIndex(stops, toId);
  if(iFrom===-1 || iTo===-1 || iTo<=iFrom) return null;

  let total=0; const detail=[];
  for(let i=iFrom;i<iTo;i++){
    const a=stops[i].id, b=stops[i+1].id;
    const key = segKey(lineId, dir, a, b);
    const stat = segmentStats.get(key);

    if(stat?.avgSec){
      total += stat.avgSec;
      detail.push({a,b,sec:Math.round(stat.avgSec),source:'avg'});
    }else{
      const dist = haversineMeters(stops[i], stops[i+1]); // m
      const v = 20000/3600; // 20 km/h en m/s
      const est = dist/v;
      total += est;
      detail.push({a,b,sec:Math.round(est),source:'heuristic'});
    }
  }
  return { seconds: Math.round(total), detail };
}

// ======= ENDPOINTS =======

// Home
app.get('/',(req,res)=>{
  res.send(`
    <h2>Servidor IoT Metropolitano ✅</h2>
    <p>Líneas: ${Object.keys(LINES).join(', ')}</p>
    <ul>
      <li><code>GET /driver</code> UI para el conductor (Leaflet)</li>
      <li><code>POST /set-line</code> { deviceId, lineId, dir }</li>
      <li><code>POST /telemetry</code> { deviceId, lat, lon, (opcional lineId, dir) }</li>
      <li><code>GET /stops?line=troncal_c&dir=norte_sur</code></li>
      <li><code>GET /device?deviceId=bus123</code></li>
      <li><code>GET /state</code> estado dispositivos y promedios</li>
      <li><code>GET /eta?line=expreso_1&dir=norte_sur&from=central&to=matellini</code></li>
    </ul>
  `);
});

// UI + MAPA (Leaflet sin API key)
app.get('/driver', (req, res) => {
  const q = req.query || {};
  const preDevice = (q.deviceId || '').toString();

  const lineIds = Object.keys(LINES);
  const dirsByLine = Object.fromEntries(lineIds.map(id => [id, Object.keys(LINES[id])]));

  res.send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Conductor | Selección + Mapa (Leaflet)</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <style>
    *{box-sizing:border-box}
    body { font-family: system-ui, Arial, sans-serif; margin: 0; }
    header { padding: 12px 16px; background: #0d6efd; color: #fff; }
    .wrap { display: grid; grid-template-columns: 360px 1fr; gap: 12px; padding: 12px; }
    .card { border: 1px solid #ddd; border-radius: 12px; padding: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.04); }
    label { display:block; margin: 10px 0 6px; font-weight: 600; }
    input, select { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
    button { margin-top: 12px; width: 100%; padding: 12px; border-radius: 10px; border: 0; background:#0d6efd; color:#fff; font-weight:700; cursor:pointer; }
    button:disabled{ opacity:.6; }
    #msg { margin-top:10px; min-height: 22px; }
    .ok { color: #0a7c2f; }
    .err { color: #b00020; }
    #map { width: 100%; height: calc(100vh - 64px - 24px); border-radius: 12px; }
    small { color:#666; }
  </style>
</head>
<body>
  <header><strong>Metropolitano — Panel del Conductor</strong></header>
  <div class="wrap">
    <div class="card">
      <h3>Seleccionar ruta y dirección</h3>
      <p><small>El bus reportará telemetría con estos parámetros hasta que se cambien.</small></p>

      <label for="device">ID del vehículo (deviceId)</label>
      <input id="device" placeholder="ej: bus123" value="${preDevice}" />

      <label for="line">Línea</label>
      <select id="line"></select>

      <label for="dir">Dirección</label>
      <select id="dir"></select>

      <button id="save">Confirmar selección</button>
      <div id="msg"></div>

      <hr/>
      <h4>Opciones del mapa</h4>
      <label><input type="checkbox" id="autofocus" checked /> Seguir al vehículo en vivo</label>
      <label><input type="checkbox" id="showpoly" checked /> Mostrar trazo de la línea</label>
    </div>

    <div class="card">
      <div id="map"></div>
    </div>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script>
    const dirsByLine = ${JSON.stringify(dirsByLine)};
    const DEFAULT_LINE_ID = ${JSON.stringify(DEFAULT_LINE_ID)};
    const DEFAULT_DIR = ${JSON.stringify(DEFAULT_DIR)};

    const $line = document.getElementById('line');
    const $dir  = document.getElementById('dir');
    const $dev  = document.getElementById('device');
    const $btn  = document.getElementById('save');
    const $msg  = document.getElementById('msg');
    const $autofocus = document.getElementById('autofocus');
    const $showpoly  = document.getElementById('showpoly');

    function fillLines(selected){
      $line.innerHTML = '';
      Object.keys(dirsByLine).forEach(id=>{
        const opt=document.createElement('option');
        opt.value=id; opt.textContent=id;
        if(id===selected) opt.selected=true;
        $line.appendChild(opt);
      });
    }
    function fillDirs(lineId, selected){
      const dirs = dirsByLine[lineId] || [];
      $dir.innerHTML='';
      dirs.forEach(d=>{
        const opt=document.createElement('option');
        opt.value=d; opt.textContent=d;
        if(d===selected) opt.selected=true;
        $dir.appendChild(opt);
      });
    }

    const initialLine = Object.keys(dirsByLine).includes(DEFAULT_LINE_ID) ? DEFAULT_LINE_ID : Object.keys(dirsByLine)[0];
    fillLines(initialLine);
    fillDirs(initialLine, (dirsByLine[initialLine]||[]).includes(DEFAULT_DIR) ? DEFAULT_DIR : (dirsByLine[initialLine]||[])[0]);

    $line.addEventListener('change', ()=>{
      const lineId=$line.value;
      fillDirs(lineId, dirsByLine[lineId]?.[0]);
      loadStopsAndDraw(lineId, $dir.value);
    });
    $dir.addEventListener('change', ()=>{
      loadStopsAndDraw($line.value, $dir.value);
    });

    $btn.addEventListener('click', async ()=>{
      $btn.disabled = true; $msg.textContent=''; $msg.className='';
      const deviceId = $dev.value.trim();
      const lineId   = $line.value;
      const dir      = $dir.value;
      if(!deviceId){ $msg.textContent='Ingrese un deviceId'; $msg.className='err'; $btn.disabled=false; return; }
      try{
        const r = await fetch('/set-line', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ deviceId, lineId, dir })
        });
        const body = await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(body.error || ('HTTP '+r.status));
        $msg.textContent = '✅ Configurado para ' + deviceId + ' ('+body.lineId+' / '+body.dir+')';
        $msg.className='ok';
        loadStopsAndDraw(lineId, dir);
      }catch(e){
        $msg.textContent = '❌ ' + e.message;
        $msg.className='err';
      }finally{
        $btn.disabled=false;
      }
    });

    // ====== LEAFLET MAP ======
    let map = L.map('map').setView([-12.05749, -77.03599], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let stopsMarkers = [];
    let polyLine = null;
    let deviceMarker = null;

    async function loadStopsAndDraw(lineId, dir){
      try{
        const r = await fetch('/stops?line='+encodeURIComponent(lineId)+'&dir='+encodeURIComponent(dir));
        const data = await r.json();
        if(!r.ok) throw new Error(data.error||('HTTP '+r.status));
        drawStops(data.stops);
      }catch(e){
        console.error(e);
      }
    }

    function drawStops(stops){
      // limpia anteriores
      stopsMarkers.forEach(m=>m.remove());
      stopsMarkers = [];
      if(polyLine){ polyLine.remove(); polyLine=null; }

      const latlngs = [];
      const bounds = L.latLngBounds();

      stops.forEach((s, idx)=>{
        const pos = [s.lat, s.lon];
        latlngs.push(pos);
        bounds.extend(pos);
        const m = L.marker(pos, { title: s.name || s.id }).addTo(map);
        m.bindPopup('<strong>'+ (s.name||s.id) +'</strong><br/><small>'+s.lat.toFixed(6)+', '+s.lon.toFixed(6)+'</small>');
        stopsMarkers.push(m);
      });

      if($showpoly.checked && latlngs.length>1){
        polyLine = L.polyline(latlngs, { weight: 4, opacity: 0.9 }).addTo(map);
      }

      if (latlngs.length) map.fitBounds(bounds.pad(0.2));
    }

    async function pollDevice(){
      const id = $dev.value.trim();
      if(!id) return;
      try{
        const r = await fetch('/device?deviceId='+encodeURIComponent(id));
        const data = await r.json();
        if(!data.found) return;
        if(typeof data.lastLat!=='number' || typeof data.lastLon!=='number') return;

        const pos = [data.lastLat, data.lastLon];
        if(!deviceMarker){
          deviceMarker = L.circleMarker(pos, { radius: 6 }).addTo(map).bindTooltip('Vehículo: '+id);
        } else {
          deviceMarker.setLatLng(pos);
        }
        if($autofocus.checked){
          map.panTo(pos);
        }
      }catch(e){
        // silencioso
      }
    }

    // inicial
    loadStopsAndDraw($line.value, $dir.value);
    setInterval(pollDevice, 2500);
  </script>
</body>
</html>`);
});

// Alias: /controlador, /conductor, /panel  -> redirigen a /driver
app.get(['/controlador', '/conductor', '/panel'], (req, res) => {
  res.redirect('/driver');
});

// Paraderos de una línea/dirección
app.get('/stops', (req, res) => {
  const lineId = req.query.line || DEFAULT_LINE_ID;
  const dir    = req.query.dir  || DEFAULT_DIR;
  const L = LINES[normId(lineId)];
  if (!L) return res.status(400).json({error:'line inválida'});
  const stops = L[normId(dir)];
  if (!stops) return res.status(400).json({error:'dir inválida'});
  res.json({ lineId: normId(lineId), dir: normId(dir), stops });
});

// Ubicación de un device (para el punto en el mapa)
app.get('/device', (req,res)=>{
  const id = (req.query.deviceId || '').toString();
  if(!id) return res.status(400).json({error:'deviceId requerido'});
  const st = deviceState.get(id);
  if(!st) return res.json({found:false});
  res.json({
    found:true,
    deviceId:id,
    lineId: st.lineId, dir: st.dir,
    lastSeen: st.lastSeen ? new Date(st.lastSeen).toISOString() : null,
    lastLat: st.lastLat, lastLon: st.lastLon,
    lastStopId: st.lastStopId, lastStopName: st.lastStopName
  });
});

// Asignar línea/dirección a un bus
// body: { deviceId, lineId, dir }
app.post('/set-line', (req,res)=>{
  const { deviceId, lineId=DEFAULT_LINE_ID, dir=DEFAULT_DIR } = req.body||{};
  if(!deviceId) return res.status(400).json({error:'deviceId requerido'});
  if(!LINES[normId(lineId)]) return res.status(400).json({error:'lineId inválido'});
  if(!LINES[normId(lineId)][normId(dir)]) return res.status(400).json({error:'dir inválida'});

  const st = deviceState.get(deviceId) || {};
  st.lineId = normId(lineId);
  st.dir = normId(dir);
  deviceState.set(deviceId, st);
  return res.json({ok:true, deviceId, lineId: st.lineId, dir: st.dir});
});

// Telemetría del bus (ESP32)
// body: { deviceId, lat, lon, ... opcional: lineId, dir }
app.post('/telemetry', (req,res)=>{
  const { deviceId='unknown', lat=null, lon=null, lineId, dir } = req.body||{};
  if(lat==null || lon==null) return res.sendStatus(400);

  const st = deviceState.get(deviceId) || { lineId: DEFAULT_LINE_ID, dir: DEFAULT_DIR };
  if(lineId && LINES[normId(lineId)]) st.lineId = normId(lineId);
  if(dir && LINES[st.lineId]?.[normId(dir)]) st.dir = normId(dir);

  st.lastLat = Number(lat);
  st.lastLon = Number(lon);
  st.lastSeen = Date.now();
  deviceState.set(deviceId, st);

  const near = nearestStopInLine(st.lineId, st.dir, st.lastLat, st.lastLon);
  if(near && near.distance <= GEOFENCE_RADIUS_M){
    if(st.lastStopId && normId(st.lastStopId) !== normId(near.id) && st.lastStopTime){
      const dtSec = Math.max(1, Math.round((Date.now()-st.lastStopTime)/1000));
      updateSegmentAvg(st.lineId, st.dir, st.lastStopId, near.id, dtSec);
      console.log(`⏱️  [${st.lineId}/${st.dir}] ${st.lastStopId} -> ${near.id}: ${dtSec}s (device=${deviceId})`);
    }
    st.lastStopId = near.id;
    st.lastStopName = near.name;
    st.lastStopTime = Date.now();
  }
  deviceState.set(deviceId, st);

  // Log compacto
  console.log('📡 RX', {
    deviceId, line: st.lineId, dir: st.dir,
    lat: st.lastLat, lon: st.lastLon,
    snapped: near && near.distance<=GEOFENCE_RADIUS_M ? near.id : null,
    distM: near ? Math.round(near.distance) : null
  });

  res.sendStatus(200);
});

// Estado rápido
app.get('/state',(req,res)=>{
  const devices=[];
  for(const [id,st] of deviceState.entries()){
    devices.push({
      deviceId:id, lineId: st.lineId, dir: st.dir,
      lastSeen: st.lastSeen ? new Date(st.lastSeen).toISOString() : null,
      lastLat: st.lastLat, lastLon: st.lastLon,
      lastStopId: st.lastStopId, lastStopName: st.lastStopName
    });
  }
  const segments=[];
  for(const [key,row] of segmentStats.entries()){
    const [lineId,dir,seg] = key.split('|');
    segments.push({ lineId, dir, segment: seg, samples: row.count, avgSec: Math.round(row.avgSec) });
  }
  res.json({ lines: Object.keys(LINES), devices, segments });
});

// ETA por línea/dirección (suma tramos)
// /eta?line=troncal_c&dir=norte_sur&from=central&to=matellini
app.get('/eta',(req,res)=>{
  const lineId = req.query.line || DEFAULT_LINE_ID;
  const dir    = req.query.dir  || DEFAULT_DIR;
  const from   = req.query.from || '';
  const to     = req.query.to   || '';

  if(!LINES[normId(lineId)]) return res.status(400).json({error:'line inválida'});
  if(!LINES[normId(lineId)][normId(dir)]) return res.status(400).json({error:'dir inválida'});

  const r = estimateETA(lineId, dir, from, to);
  if(!r) return res.status(400).json({error:'paraderos inválidos u orden incorrecto'});

  res.json({ lineId: normId(lineId), dir: normId(dir), from: normId(from), to: normId(to), ...r });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Servidor en puerto', PORT));
