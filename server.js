// server.js — UI pública + almacenamiento; busId OPCIONAL
const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '1mb' }));
app.use((req,res,next)=>{ res.setHeader('Cache-Control','no-store'); next(); });

// ======= CONFIG =======
const GEOFENCE_RADIUS_M = 60;
const DEFAULT_LINE_ID = 'troncal_c';
const DEFAULT_DIR = 'sur_norte';

// ======= HELPERS =======
const normId = v => String(v ?? '').trim().toLowerCase();
const keyFrom = (deviceId, req) => deviceId ? `dev:${normId(deviceId)}` : `ip:${req.ip}`;
const toRad = d => d*Math.PI/180;
function haversineMeters(a,b){
  const R=6371000;
  const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  const s= Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

// ======= LÍNEAS/PARADEROS =======
const LINES = {
  troncal_c: {
    norte_sur: [
      { id: 'ramon_castilla',   name: 'Ramón Castilla',   lat: -12.04345, lon: -77.04190 },
      { id: 'tacna',            name: 'Tacna',            lat: -12.04626, lon: -77.03718 },
      { id: 'jiron_union',      name: 'Jirón de la Unión',lat: -12.04822, lon: -77.03300 },
      { id: 'colmena',          name: 'Estación Colmena', lat: -12.04873, lon: -77.03287 },
      { id: 'central',          name: 'Estación Central', lat: -12.05749, lon: -77.03599 },
      { id: 'estadio_nacional', name: 'Estadio Nacional', lat: -12.06836, lon: -77.03220 },
      { id: 'mexico',           name: 'México',           lat: -12.07646, lon: -77.02893 },
      { id: 'canada',           name: 'Canadá',           lat: -12.08147, lon: -77.02660 },
      { id: 'javier_prado',     name: 'Javier Prado',     lat: -12.09031, lon: -77.02268 },
      { id: 'canaval_moreyra',  name: 'Canaval y Moreyra',lat: -12.09587, lon: -77.02510 },
      { id: 'aramburu',         name: 'Aramburú',         lat: -12.10192, lon: -77.02723 },
      { id: 'domingo_orue',     name: 'Domingo Orué',     lat: -12.10820, lon: -77.02645 },
      { id: 'angamos',          name: 'Angamos',          lat: -12.11314, lon: -77.02596 },
      { id: 'ricardo_palma',    name: 'Ricardo Palma',    lat: -12.11820, lon: -77.02582 },
      { id: 'benavides',        name: 'Benavides',        lat: -12.12453, lon: -77.02434 },
      { id: '28_de_julio',      name: '28 de Julio',      lat: -12.12887, lon: -77.02279 },
      { id: 'plaza_de_flores',  name: 'Plaza de Flores',  lat: -12.13527, lon: -77.01871 },
      { id: 'balta',            name: 'Balta',            lat: -12.13552, lon: -77.01868 },
      { id: 'bulevar',          name: 'Bulevar',          lat: -12.14799, lon: -77.02015 },
      { id: 'estadio_union',    name: 'Estadio Unión',    lat: -12.15300, lon: -77.01971 },
      { id: 'escuela_militar',  name: 'Escuela Militar',  lat: -12.15945, lon: -77.01890 },
      { id: 'teran',            name: 'Terán',            lat: -12.16845, lon: -77.01870 },
      { id: 'plaza_lima_sur',   name: 'Plaza Lima Sur',   lat: -12.17337, lon: -77.01478 },
      { id: 'matellini',        name: 'Matellini',        lat: -12.17857, lon: -77.00999 }
    ],
    sur_norte: [
      { id: 'matellini',        name: 'Matellini',        lat: -12.17857, lon: -77.00999 },
      { id: 'plaza_lima_sur',   name: 'Plaza Lima Sur',   lat: -12.17337, lon: -77.01478 },
      { id: 'teran',            name: 'Terán',            lat: -12.16845, lon: -77.01870 },
      { id: 'escuela_militar',  name: 'Escuela Militar',  lat: -12.15945, lon: -77.01890 },
      { id: 'estadio_union',    name: 'Estadio Unión',    lat: -12.15300, lon: -77.01971 },
      { id: 'bulevar',          name: 'Bulevar',          lat: -12.14799, lon: -77.02015 },
      { id: 'balta',            name: 'Balta',            lat: -12.13552, lon: -77.01868 },
      { id: 'plaza_de_flores',  name: 'Plaza de Flores',  lat: -12.13527, lon: -77.01871 },
      { id: '28_de_julio',      name: '28 de Julio',      lat: -12.12887, lon: -77.02279 },
      { id: 'angamos',          name: 'Angamos',          lat: -12.11314, lon: -77.02596 },
      { id: 'domingo_orue',     name: 'Domingo Orué',     lat: -12.10820, lon: -77.02645 },
      { id: 'aramburu',         name: 'Aramburú',         lat: -12.10192, lon: -77.02723 },
      { id: 'canaval_moreyra',  name: 'Canaval y Moreyra',lat: -12.09587, lon: -77.02510 },
      { id: 'javier_prado',     name: 'Javier Prado',     lat: -12.09031, lon: -77.02268 },
      { id: 'canada',           name: 'Canadá',           lat: -12.08147, lon: -77.02660 },
      { id: 'mexico',           name: 'México',           lat: -12.07646, lon: -77.02893 },
      { id: 'estadio_nacional', name: 'Estadio Nacional', lat: -12.06836, lon: -77.03220 },
      { id: 'central',          name: 'Estación Central', lat: -12.05749, lon: -77.03599 },
      { id: 'colmena',          name: 'Estación Colmena', lat: -12.04873, lon: -77.03287 },
      { id: 'jiron_union',      name: 'Jirón de la Unión',lat: -12.04822, lon: -77.03300 },
      { id: 'tacna',            name: 'Tacna',            lat: -12.04626, lon: -77.03718 },
      { id: 'ramon_castilla',   name: 'Ramón Castilla',   lat: -12.04345, lon: -77.04190 }
    ]
  },
  expreso_1: {
    norte_sur: [
      { id: 'central',          name: 'Estación Central', lat: -12.05749, lon: -77.03599 },
      { id: 'estadio_nacional', name: 'Estadio Nacional', lat: -12.06836, lon: -77.03220 },
      { id: 'javier_prado',     name: 'Javier Prado',     lat: -12.09031, lon: -77.02268 },
      { id: 'canaval_moreyra',  name: 'Canaval y Moreyra',lat: -12.09587, lon: -77.02510 },
      { id: 'angamos',          name: 'Angamos',          lat: -12.11314, lon: -77.02596 },
      { id: '28_de_julio',      name: '28 de Julio',      lat: -12.12887, lon: -77.02279 },
      { id: 'balta',            name: 'Balta',            lat: -12.13552, lon: -77.01868 },
      { id: 'estadio_union',    name: 'Estadio Unión',    lat: -12.15300, lon: -77.01971 },
      { id: 'teran',            name: 'Terán',            lat: -12.16845, lon: -77.01870 },
      { id: 'matellini',        name: 'Matellini',        lat: -12.17857, lon: -77.00999 }
    ],
    sur_norte: [
      { id: 'matellini',        name: 'Matellini',        lat: -12.17857, lon: -77.00999 },
      { id: 'teran',            name: 'Terán',            lat: -12.16845, lon: -77.01870 },
      { id: 'estadio_union',    name: 'Estadio Unión',    lat: -12.15300, lon: -77.01971 },
      { id: 'balta',            name: 'Balta',            lat: -12.13552, lon: -77.01868 },
      { id: '28_de_julio',      name: '28 de Julio',      lat: -12.12887, lon: -77.02279 },
      { id: 'angamos',          name: 'Angamos',          lat: -12.11314, lon: -77.02596 },
      { id: 'canaval_moreyra',  name: 'Canaval y Moreyra',lat: -12.09587, lon: -77.02510 },
      { id: 'javier_prado',     name: 'Javier Prado',     lat: -12.09031, lon: -77.02268 },
      { id: 'estadio_nacional', name: 'Estadio Nacional', lat: -12.06836, lon: -77.03220 },
      { id: 'central',          name: 'Estación Central', lat: -12.05749, lon: -77.03599 }
    ]
  }
};

const getStops = (lineId, dir) => LINES[normId(lineId)]?.[normId(dir)] || null;
const stopIndex = (stops, id) => stops.findIndex(s => normId(s.id)===normId(id));

// ======= MEMORIA =======
const deviceState = new Map();         // deviceId -> estado compacto (compat /device)
const lastByKey = new Map();           // key(dev:xxx o ip:...) -> estado último
const trackByKey = new Map();          // key -> [{ts,lat,lon}]
const prefByKey  = new Map();          // key -> { lineId, dir }
const MAX_TRACK_POINTS = 5000;
const segmentStats = new Map();        // promedios entre paraderos

const segKey = (lineId, dir, aId, bId) => `${normId(lineId)}|${normId(dir)}|${normId(aId)}->${normId(bId)}`;
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
  return best;
}

// ======= PÁGINAS =======
app.get('/',(req,res)=>{
  res.send(`
    <h2>Servidor IoT Metropolitano ✅</h2>
    <ul>
      <li><a href="/driver">/driver</a> (chofer: elegir ruta/sentido, <em>busId opcional</em>)</li>
      <li>POST <code>/set-line</code> { lineId, dir, (opcional) deviceId }</li>
      <li>POST <code>/telemetry</code> { lat, lon, (opcional) deviceId, lineId, dir }</li>
      <li>GET  <code>/stops?line=troncal_c&dir=sur_norte</code></li>
      <li>GET  <code>/device?deviceId=bus123</code></li>
      <li>GET  <code>/track?deviceId=bus123&limit=1000</code></li>
      <li>GET  <code>/state</code>, <code>/eta</code>, <code>/healthz</code></li>
    </ul>
  `);
});

app.get('/healthz', (_,res)=>res.send('ok'));

app.get(['/controlador','/conductor','/panel'], (req,res)=>res.redirect('/driver'));

app.get('/driver', (req,res)=>{
  const lineIds = Object.keys(LINES);
  const dirsByLine = Object.fromEntries(lineIds.map(id => [id, Object.keys(LINES[id])]));
  res.send(`<!doctype html><html lang="es"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Conductor — Selección + Mapa</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{box-sizing:border-box} body{margin:0;font-family:system-ui,Arial}
header{background:#0d6efd;color:#fff;padding:12px 16px}
.wrap{display:grid;grid-template-columns:360px 1fr;gap:12px;padding:12px}
.card{border:1px solid #ddd;border-radius:12px;padding:14px}
label{display:block;margin:8px 0 4px;font-weight:600}
input,select,button{width:100%;padding:10px;border-radius:8px;border:1px solid #ccc}
button{background:#0d6efd;color:#fff;border:0;cursor:pointer;margin-top:10px}
small{color:#666} #map{height:calc(100vh - 64px - 24px);border-radius:12px}
.msg{margin-top:8px;min-height:20px}.ok{color:#0a7c2f}.err{color:#b00020}
</style></head><body>
<header><strong>Metropolitano — Panel del Conductor</strong></header>
<div class="wrap">
  <div class="card">
    <label>Línea</label>
    <select id="line"></select>
    <label>Dirección</label>
    <select id="dir"></select>
    <label>Bus ID (opcional)</label>
    <input id="device" placeholder="ej: bus123 (puede quedar vacío)"/>
    <button id="save">Confirmar</button>
    <div id="msg" class="msg"></div>
    <hr/>
    <small>Si no ingresas Bus ID, la configuración se asocia a tu <em>IP</em>.</small>
  </div>
  <div class="card"><div id="map"></div></div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const dirsByLine = ${JSON.stringify(dirsByLine)};
const DEFAULT_LINE_ID = ${JSON.stringify(DEFAULT_LINE_ID)};
const DEFAULT_DIR = ${JSON.stringify(DEFAULT_DIR)};

const $line = document.getElementById('line');
const $dir  = document.getElementById('dir');
const $dev  = document.getElementById('device');
const $msg  = document.getElementById('msg');

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
  const lineId = $line.value;
  fillDirs(lineId, dirsByLine[lineId]?.[0]);
  loadStops(lineId, $dir.value);
});
$dir.addEventListener('change', ()=>{
  loadStops($line.value, $dir.value);
});

document.getElementById('save').onclick = async ()=>{
  $msg.textContent=''; $msg.className='msg';
  try{
    const body={ lineId:$line.value, dir:$dir.value };
    const dev = $dev.value.trim(); if(dev) body.deviceId = dev;
    const r = await fetch('/set-line',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error||('HTTP '+r.status));
    $msg.textContent='✅ Configurado: '+j.lineId+' / '+j.dir+(dev?(' (ID: '+dev+')'):' (por IP)');
    $msg.className='msg ok';
    loadStops($line.value,$dir.value);
  }catch(e){
    $msg.textContent='❌ '+e.message; $msg.className='msg err';
  }
};

const map=L.map('map').setView([-12.05749,-77.03599],12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);

let stopsMarkers=[]; let poly=null; let marker=null; let track=null;

async function loadStops(line,dir){
  const r = await fetch('/stops?line='+encodeURIComponent(line)+'&dir='+encodeURIComponent(dir));
  const j = await r.json();
  const stops = j.stops || [];
  // limpia anteriores
  stopsMarkers.forEach(m=>m.remove()); stopsMarkers=[];
  if(poly){ poly.remove(); poly=null; }
  const latlngs=[]; const bounds=L.latLngBounds();
  stops.forEach(s=>{
    const p=[s.lat,s.lon]; latlngs.push(p); bounds.extend(p);
    const m=L.marker(p,{title:s.name||s.id}).addTo(map); m.bindPopup((s.name||s.id));
    stopsMarkers.push(m);
  });
  if(latlngs.length>1){ poly=L.polyline(latlngs,{weight:3,opacity:.9}).addTo(map); map.fitBounds(bounds.pad(.2)); }
}
loadStops($line.value,$dir.value);

// Si el chofer puso deviceId, podemos seguir ese marker y su trazo:
setInterval(async ()=>{
  const dev = $dev.value.trim();
  if(!dev) return;
  const r = await fetch('/device?deviceId='+encodeURIComponent(dev));
  const d = await r.json();
  if(!d.found || typeof d.lastLat!=='number' || typeof d.lastLon!=='number') return;
  const pos=[d.lastLat,d.lastLon];
  if(!marker){ marker=L.circleMarker(pos,{radius:6}).addTo(map).bindTooltip('Vehículo: '+dev); }
  else{ marker.setLatLng(pos); }

  // trazo
  const rt = await fetch('/track?deviceId='+encodeURIComponent(dev)+'&limit=2000').then(r=>r.json()).catch(()=>null);
  if(rt && rt.points && rt.points.length){
    const pts = rt.points.map(p=>[p.lat,p.lon]);
    if(track){ track.setLatLngs(pts); } else { track=L.polyline(pts,{weight:4,opacity:.8}).addTo(map); }
  }
}, 3000);
</script>
</body></html>`);
});

// ======= API =======
app.get('/stops', (req, res) => {
  const lineId = req.query.line || DEFAULT_LINE_ID;
  const dir    = req.query.dir  || DEFAULT_DIR;
  const L = LINES[normId(lineId)];
  if (!L)   return res.status(400).json({error:'line inválida'});
  const S = L[normId(dir)];
  if (!S)   return res.status(400).json({error:'dir inválida'});
  res.json({ lineId: normId(lineId), dir: normId(dir), stops: S });
});

// Guarda preferencia (deviceId opcional: si no, por IP)
app.post('/set-line', (req,res)=>{
  const { deviceId, lineId=DEFAULT_LINE_ID, dir=DEFAULT_DIR } = req.body||{};
  if(!LINES[normId(lineId)] || !LINES[normId(lineId)][normId(dir)])
    return res.status(400).json({error:'línea/dir inválida'});
  const key = keyFrom(deviceId, req);
  prefByKey.set(key, { lineId: normId(lineId), dir: normId(dir) });
  return res.json({ok:true, key, lineId: normId(lineId), dir: normId(dir)});
});

// Telemetría: hereda línea/dir de pref por key (deviceId o IP)
app.post('/telemetry', (req,res)=>{
  const b = req.body || {};
  if(typeof b.lat!=='number' || typeof b.lon!=='number')
    return res.status(400).json({error:'lat/lon requeridos'});

  const key = keyFrom(b.deviceId, req);
  const pref = prefByKey.get(key) || {};
  const lineId = b.lineId ? normId(b.lineId) : (pref.lineId || DEFAULT_LINE_ID);
  const dir    = b.dir    ? normId(b.dir)    : (pref.dir    || DEFAULT_DIR);

  const st = {
    deviceId: b.deviceId || null,
    key,
    lineId, dir,
    lastSeen: Date.now(),
    lastLat: Number(b.lat),
    lastLon: Number(b.lon),
    alt: typeof b.alt==='number'? b.alt : null,
    speed_kmh: typeof b.speed_kmh==='number'? b.speed_kmh : null
  };
  lastByKey.set(key, st);

  // compat: si hay deviceId, también guarda en deviceState (para /device)
  if (b.deviceId) deviceState.set(b.deviceId, st);

  // actualizar track
  const arr = trackByKey.get(key) || [];
  arr.push({ ts: st.lastSeen, lat: st.lastLat, lon: st.lastLon });
  if(arr.length > MAX_TRACK_POINTS) arr.shift();
  trackByKey.set(key, arr);

  // detectar cruce por paradero
  const stops = getStops(lineId, dir);
  if (stops) {
    const here = { lat: st.lastLat, lon: st.lastLon };
    let best=null;
    for(const s of stops){
      const d = haversineMeters(here, s);
      if(!best || d<best.d) best = { id:s.id, d };
    }
    st.nearStop = (best && best.d<=GEOFENCE_RADIUS_M) ? best.id : null;
  }

  res.json({ ok:true });
});

// Último estado por deviceId (para el mapa en /driver)
app.get('/device', (req,res)=>{
  const id = (req.query.deviceId || '').toString().trim();
  if(!id) return res.status(400).json({error:'deviceId requerido'});
  const st = deviceState.get(id);
  if(!st) return res.json({ found:false });
  res.json({ found:true, ...st });
});

// Trazo por deviceId (si no hay, retorna vacío)
app.get('/track', (req,res)=>{
  const id = (req.query.deviceId || '').toString().trim();
  const limit = Math.max(1, Math.min(+req.query.limit||1000, MAX_TRACK_POINTS));
  if(!id) return res.json({ deviceId:id, count:0, points:[] });
  const arr = trackByKey.get(`dev:${normId(id)}`) || [];
  res.json({ deviceId:id, count: Math.min(arr.length,limit), points: arr.slice(-limit) });
});

// Estado y ETA (opcionales)
app.get('/state',(req,res)=>{
  const devices=[];
  for(const [id,st] of deviceState.entries()){
    devices.push({
      deviceId:id, lineId: st.lineId, dir: st.dir,
      lastSeen: new Date(st.lastSeen).toISOString(),
      lastLat: st.lastLat, lastLon: st.lastLon,
      nearStop: st.nearStop || null
    });
  }
  res.json({ lines: Object.keys(LINES), devices });
});

app.get('/eta',(req,res)=>{
  const lineId = req.query.line || DEFAULT_LINE_ID;
  const dir    = req.query.dir  || DEFAULT_DIR;
  const from   = req.query.from || '';
  const to     = req.query.to   || '';
  const stops = getStops(lineId, dir);
  if(!stops) return res.status(400).json({error:'línea/dir inválida'});

  const iFrom = stopIndex(stops, from);
  const iTo   = stopIndex(stops, to);
  if(iFrom===-1 || iTo===-1 || iTo<=iFrom) return res.status(400).json({error:'paraderos inválidos u orden incorrecto'});

  let total=0; const detail=[];
  for(let i=iFrom;i<iTo;i++){
    const a=stops[i].id, b=stops[i+1].id;
    const key = segKey(lineId, dir, a, b);
    const stat = segmentStats.get(key);
    if(stat?.avgSec){ total+=stat.avgSec; detail.push({a,b,sec:Math.round(stat.avgSec),source:'avg'}); }
    else{ // heurística por distancia 20 km/h
      const dist = haversineMeters(stops[i], stops[i+1]);
      const v = 20000/3600;
      const est = dist/v;
      total += est; detail.push({a,b,sec:Math.round(est),source:'heuristic'});
    }
  }
  res.json({ lineId:normId(lineId), dir:normId(dir), from:normId(from), to:normId(to), seconds:Math.round(total), detail });
});

// ======= START =======
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', ()=>{
  console.log('Servidor en puerto', PORT);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)){
    for (const net of nets[name]){
      if (net.family==='IPv4' && !net.internal){
        console.log(`→ http://${net.address}:${PORT}/driver`);
      }
    }
  }
});
