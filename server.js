// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// ======= CONFIG =======
const GEOFENCE_RADIUS_M = 60;
const DEFAULT_LINE_ID = 'troncal_c';
const DEFAULT_DIR = 'sur_norte';

// ======= HELPERS =======
const normId = (v) => String(v ?? '').trim().toLowerCase();
function toRad(d){ return d*Math.PI/180; }
function haversineMeters(a,b){
  const R=6371000;
  const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon);
  const s= Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

// ======= RUTAS =======
const LINES = {
  troncal_c: {
    norte_sur: [
      { id:'ramon_castilla',   name:'Ramón Castilla',            lat:-12.04345, lon:-77.04190, alt:139 },
      { id:'tacna',            name:'Tacna',                     lat:-12.04626, lon:-77.03718, alt:152 },
      { id:'jiron_union',      name:'Jirón de la Unión',         lat:-12.04822, lon:-77.03300 },
      { id:'colmena',          name:'Estación Colmena',          lat:-12.04873, lon:-77.03287 },
      { id:'central',          name:'Estación Central',          lat:-12.05749, lon:-77.03599 },
      { id:'estadio_nacional', name:'Estación Estadio Nacional', lat:-12.06836, lon:-77.03220 },
      { id:'mexico',           name:'Estación México',           lat:-12.07646, lon:-77.02893 },
      { id:'canada',           name:'Estación Canadá',           lat:-12.08147, lon:-77.02660 },
      { id:'javier_prado',     name:'Estación Javier Prado',     lat:-12.09031, lon:-77.02268 },
      { id:'canaval_moreyra',  name:'Estación Canaval y Moreyra',lat:-12.09587, lon:-77.02510 },
      { id:'aramburu',         name:'Estación Aramburú',         lat:-12.10192, lon:-77.02723 },
      { id:'domingo_orue',     name:'Estación Domingo Orué',     lat:-12.10820, lon:-77.02645 },
      { id:'angamos',          name:'Estación Angamos',          lat:-12.11314, lon:-77.02596 },
      { id:'ricardo_palma',    name:'Estación Ricardo Palma',    lat:-12.11820, lon:-77.02582 },
      { id:'benavides',        name:'Estación Benavides',        lat:-12.12453, lon:-77.02434 },
      { id:'28_de_julio',      name:'Estación 28 de Julio',      lat:-12.12887, lon:-77.02279 },
      { id:'plaza_de_flores',  name:'Estación Plaza de Flores',  lat:-12.13527, lon:-77.01871 },
      { id:'balta',            name:'Estación Balta',            lat:-12.13552, lon:-77.01868 },
      { id:'bulevar',          name:'Estación Bulevar',          lat:-12.14799, lon:-77.02015 },
      { id:'estadio_union',    name:'Estación Estadio Unión',    lat:-12.15300, lon:-77.01971 },
      { id:'escuela_militar',  name:'Estación Escuela Militar',  lat:-12.15945, lon:-77.01890 },
      { id:'teran',            name:'Estación Terán',            lat:-12.16845, lon:-77.01870 },
      { id:'plaza_lima_sur',   name:'Estación Plaza Lima Sur',   lat:-12.17337, lon:-77.01478 },
      { id:'matellini',        name:'Estación Matellini',        lat:-12.17857, lon:-77.00999 }
    ],
    sur_norte: [
      { id:'matellini',        name:'Estación Matellini',        lat:-12.17857, lon:-77.00999 },
      { id:'plaza_lima_sur',   name:'Estación Plaza Lima Sur',   lat:-12.17337, lon:-77.01478 },
      { id:'teran',            name:'Estación Terán',            lat:-12.16845, lon:-77.01870 },
      { id:'escuela_militar',  name:'Estación Escuela Militar',  lat:-12.15945, lon:-77.01890 },
      { id:'estadio_union',    name:'Estación Estadio Unión',    lat:-12.15300, lon:-77.01971 },
      { id:'bulevar',          name:'Estación Bulevar',          lat:-12.14799, lon:-77.02015 },
      { id:'balta',            name:'Estación Balta',            lat:-12.13552, lon:-77.01868 },
      { id:'plaza_de_flores',  name:'Estación Plaza de Flores',  lat:-12.13527, lon:-77.01871 },
      { id:'28_de_julio',      name:'Estación 28 de Julio',      lat:-12.12887, lon:-77.02279 },
      { id:'angamos',          name:'Estación Angamos',          lat:-12.11314, lon:-77.02596 },
      { id:'domingo_orue',     name:'Estación Domingo Orué',     lat:-12.10820, lon:-77.02645 },
      { id:'aramburu',         name:'Estación Aramburú',         lat:-12.10192, lon:-77.02723 },
      { id:'canaval_moreyra',  name:'Estación Canaval y Moreyra',lat:-12.09587, lon:-77.02510 },
      { id:'javier_prado',     name:'Estación Javier Prado',     lat:-12.09031, lon:-77.02268 },
      { id:'canada',           name:'Estación Canadá',           lat:-12.08147, lon:-77.02660 },
      { id:'mexico',           name:'Estación México',           lat:-12.07646, lon:-77.02893 },
      { id:'estadio_nacional', name:'Estación Estadio Nacional', lat:-12.06836, lon:-77.03220 },
      { id:'central',          name:'Estación Central',          lat:-12.05749, lon:-77.03599 },
      { id:'colmena',          name:'Estación Colmena',          lat:-12.04873, lon:-77.03287 },
      { id:'jiron_union',      name:'Jirón de la Unión',         lat:-12.04822, lon:-77.03300 },
      { id:'tacna',            name:'Tacna',                     lat:-12.04626, lon:-77.03718, alt:152 },
      { id:'ramon_castilla',   name:'Ramón Castilla',            lat:-12.04345, lon:-77.04190, alt:139 }
    ]
  },
  expreso_1: {
    norte_sur: [
      { id:'central',          name:'Estación Central',          lat:-12.05749, lon:-77.03599 },
      { id:'estadio_nacional', name:'Estación Estadio Nacional', lat:-12.06836, lon:-77.03220 },
      { id:'javier_prado',     name:'Estación Javier Prado',     lat:-12.09031, lon:-77.02268 },
      { id:'canaval_moreyra',  name:'Estación Canaval y Moreyra',lat:-12.09587, lon:-77.02510 },
      { id:'angamos',          name:'Estación Angamos',          lat:-12.11314, lon:-77.02596 },
      { id:'28_de_julio',      name:'Estación 28 de Julio',      lat:-12.12887, lon:-77.02279 },
      { id:'balta',            name:'Estación Balta',            lat:-12.13552, lon:-77.01868 },
      { id:'estadio_union',    name:'Estación Estadio Unión',    lat:-12.15300, lon:-77.01971 },
      { id:'teran',            name:'Estación Terán',            lat:-12.16845, lon:-77.01870 },
      { id:'matellini',        name:'Estación Matellini',        lat:-12.17857, lon:-77.00999 }
    ],
    sur_norte: [
      { id:'matellini',        name:'Estación Matellini',        lat:-12.17857, lon:-77.00999 },
      { id:'teran',            name:'Estación Terán',            lat:-12.16845, lon:-77.01870 },
      { id:'estadio_union',    name:'Estación Estadio Unión',    lat:-12.15300, lon:-77.01971 },
      { id:'balta',            name:'Estación Balta',            lat:-12.13552, lon:-77.01868 },
      { id:'28_de_julio',      name:'Estación 28 de Julio',      lat:-12.12887, lon:-77.02279 },
      { id:'angamos',          name:'Estación Angamos',          lat:-12.11314, lon:-77.02596 },
      { id:'canaval_moreyra',  name:'Estación Canaval y Moreyra',lat:-12.09587, lon:-77.02510 },
      { id:'javier_prado',     name:'Estación Javier Prado',     lat:-12.09031, lon:-77.02268 },
      { id:'estadio_nacional', name:'Estación Estadio Nacional', lat:-12.06836, lon:-77.03220 },
      { id:'central',          name:'Estación Central',          lat:-12.05749, lon:-77.03599 }
    ]
  }
};

// ======= ESTADO =======
const deviceState = new Map();  // deviceId -> { lineId, dir, lastLat, lastLon, lastSeen, sats, hdop, speedKmh, alt, lastStop... }
const segmentStats = new Map(); // `${line}|${dir}|${a}->${b}` -> { count, avgSec }

// Historial de recorrido (en memoria)
const tracks = new Map();       // deviceId -> [{lat, lon, t}]
const TRACK_MAX_POINTS = 2000;  // últimos N puntos
const TRACK_TTL_MS     = 2 * 60 * 60 * 1000; // 2h

// ======= UTIL =======
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
  return best;
}
function pushTrack(deviceId, lat, lon){
  const now = Date.now();
  let arr = tracks.get(deviceId);
  if(!arr){ arr = []; tracks.set(deviceId, arr); }
  arr.push({ lat: Number(lat), lon: Number(lon), t: now });
  if(arr.length > TRACK_MAX_POINTS) arr.splice(0, arr.length - TRACK_MAX_POINTS);
  const limit = now - TRACK_TTL_MS;
  while(arr.length && arr[0].t < limit) arr.shift();
}

// ======= ENDPOINTS =======
app.get('/',(req,res)=>{
  res.send(`
    <h2>Servidor IoT Metropolitano ✅</h2>
    <ul>
      <li><a href="/driver">/driver</a> – Panel del conductor (ID, línea, dirección, mapa y estado en vivo)</li>
      <li><a href="/state">/state</a> – Estado general</li>
    </ul>
  `);
});

// UI del conductor con panel de estado + recorrido
app.get('/driver', (req, res) => {
  const lineIds = Object.keys(LINES);
  const dirsByLine = Object.fromEntries(lineIds.map(id => [id, Object.keys(LINES[id])]));

  res.send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Panel del Conductor</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,Arial;margin:0;background:#f7f8fb}
  header{background:#0d6efd;color:#fff;padding:12px 16px;font-weight:700}
  .wrap{display:grid;grid-template-columns:360px 1fr;gap:12px;padding:12px}
  .card{background:#fff;border:1px solid #e6e7eb;border-radius:12px;padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.04)}
  label{display:block;margin:10px 0 6px;font-weight:600}
  input,select,button{width:100%;padding:10px;border-radius:8px;border:1px solid #cfd2d8}
  button{background:#0d6efd;color:#fff;border:0;font-weight:700;cursor:pointer;margin-top:12px}
  #map{width:100%;height:calc(100vh - 64px - 24px);border-radius:12px}
  .kpi{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
  .kpi div{background:#f2f4f8;border:1px solid #e6e7eb;border-radius:10px;padding:8px}
  .muted{color:#6b7280}
  .ok{color:#0a7c2f}
  .err{color:#b00020}
</style>
</head>
<body>
<header>Metropolitano — Panel del Conductor</header>
<div class="wrap">
  <div class="card">
    <h3>Configurar</h3>
    <label for="device">ID del vehículo (opcional, pero recomendado)</label>
    <input id="device" placeholder="ej: bus123"/>

    <label for="line">Línea</label>
    <select id="line"></select>

    <label for="dir">Dirección</label>
    <select id="dir"></select>

    <button id="save">Confirmar selección</button>
    <div id="msg" class="muted"></div>

    <hr/>
    <h3>Opciones del mapa</h3>
    <label><input type="checkbox" id="showtrack" checked/> Mostrar recorrido</label>

    <hr/>
    <h3>Estado en vivo</h3>
    <div class="kpi">
      <div><strong>Device:</strong> <span id="kDevice" class="muted">—</span></div>
      <div><strong>Línea/Dir:</strong> <span id="kLineDir" class="muted">—</span></div>
      <div><strong>Lat/Lon:</strong> <span id="kLatLon" class="muted">—</span></div>
      <div><strong>Último fix:</strong> <span id="kAgo" class="muted">—</span></div>
      <div><strong>Paradero cercano:</strong> <span id="kStop" class="muted">—</span></div>
    </div>
  </div>

  <div class="card"><div id="map"></div></div>
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

  const $kDevice = document.getElementById('kDevice');
  const $kLineDir= document.getElementById('kLineDir');
  const $kLatLon = document.getElementById('kLatLon');
  const $kAgo    = document.getElementById('kAgo');
  const $kStop   = document.getElementById('kStop');
  const $showtrack = document.getElementById('showtrack');

  function fillLines(selected){
    $line.innerHTML='';
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
    const id=$line.value;
    fillDirs(id, dirsByLine[id]?.[0]);
    loadStopsAndDraw(id, $dir.value);
  });
  $dir.addEventListener('change', ()=>{
    loadStopsAndDraw($line.value, $dir.value);
  });

  $btn.addEventListener('click', async ()=>{
    const deviceId = $dev.value.trim() || 'unknown';
    const lineId   = $line.value;
    const dir      = $dir.value;
    $btn.disabled=true; $msg.textContent=''; $msg.className='muted';
    try{
      const r = await fetch('/set-line', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ deviceId, lineId, dir })
      });
      const data = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error||('HTTP '+r.status));
      $msg.textContent='✅ Configurado'; $msg.className='ok';
      $kDevice.textContent = deviceId;
      $kLineDir.textContent = lineId+' / '+dir;
      loadStopsAndDraw(lineId, dir);
    }catch(e){
      $msg.textContent='❌ '+e.message; $msg.className='err';
    }finally{$btn.disabled=false;}
  });

  // ====== MAPA ======
  let map = L.map('map').setView([-12.05749, -77.03599], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let stopsMarkers=[]; let polyLine=null; let deviceMarker=null; let trackLine=null;

  async function loadStopsAndDraw(lineId, dir){
    try{
      const r = await fetch('/stops?line='+encodeURIComponent(lineId)+'&dir='+encodeURIComponent(dir));
      const data = await r.json();
      if(!r.ok) throw new Error(data.error||('HTTP '+r.status));
      drawStops(data.stops);
    }catch(e){ console.error(e); }
  }
  function drawStops(stops){
    stopsMarkers.forEach(m=>m.remove()); stopsMarkers=[];
    if(polyLine){ polyLine.remove(); polyLine=null; }
    const latlngs=[]; const bounds=L.latLngBounds();
    stops.forEach(s=>{
      const pos=[s.lat,s.lon]; latlngs.push(pos); bounds.extend(pos);
      const m=L.marker(pos,{title:s.name||s.id}).addTo(map);
      m.bindPopup('<strong>'+(s.name||s.id)+'</strong><br/><small>'+s.lat.toFixed(6)+', '+s.lon.toFixed(6)+'</small>');
      stopsMarkers.push(m);
    });
    if(latlngs.length>1){ polyLine = L.polyline(latlngs,{weight:4,opacity:.9}).addTo(map); }
    if(latlngs.length){ map.fitBounds(bounds.pad(0.2)); }
  }

  function prettyAgo(ts){
    if(!ts) return '—';
    const s = Math.max(0, Math.round((Date.now()-ts)/1000));
    return s+' s';
  }

  function drawTrack(points){
    if(trackLine){ trackLine.remove(); trackLine=null; }
    if(!$showtrack.checked || !points || points.length<2) return;
    const latlngs = points.map(p => [p.lat, p.lon]);
    trackLine = L.polyline(latlngs, { weight:3, opacity:0.7 }).addTo(map);
  }

  async function pollDevice(){
    const id = ($dev.value.trim() || 'unknown');
    try{
      const r = await fetch('/device?deviceId='+encodeURIComponent(id));
      const d = await r.json();
      if(!d.found) return;

      $kDevice.textContent = id;
      $kLineDir.textContent = (d.lineId||'—')+' / '+(d.dir||'—');
      if(typeof d.lastLat==='number' && typeof d.lastLon==='number'){
        $kLatLon.textContent = d.lastLat.toFixed(6)+', '+d.lastLon.toFixed(6);
        const pos=[d.lastLat,d.lastLon];
        if(!deviceMarker){
          deviceMarker=L.circleMarker(pos,{radius:6}).addTo(map).bindTooltip('Vehículo: '+id);
        }else{
          deviceMarker.setLatLng(pos);
        }
      }else{
        $kLatLon.textContent='—';
      }
      $kAgo.textContent  = prettyAgo(d.lastSeenTs || (d.lastSeen? Date.parse(d.lastSeen): null));
      $kStop.textContent = d.snappedStopName || d.snappedStopId || '—';
    }catch(e){}
  }

  async function pollTrack(){
    const id = ($dev.value.trim() || 'unknown');
    try{
      const r = await fetch('/track?deviceId='+encodeURIComponent(id)+'&minutes=60');
      const data = await r.json();
      drawTrack(data);
    }catch(e){}
  }

  // Inicial
  loadStopsAndDraw($line.value, $dir.value);
  setInterval(pollDevice, 2000);
  setInterval(pollTrack, 5000);
</script>
</body></html>`);
});

// Aliases
app.get(['/controlador','/conductor','/panel'], (req,res)=>res.redirect('/driver'));

// Stops
app.get('/stops', (req,res)=>{
  const lineId=req.query.line||DEFAULT_LINE_ID;
  const dir=req.query.dir||DEFAULT_DIR;
  const L=LINES[normId(lineId)];
  if(!L) return res.status(400).json({error:'line inválida'});
  const stops=L[normId(dir)];
  if(!stops) return res.status(400).json({error:'dir inválida'});
  res.json({ lineId:normId(lineId), dir:normId(dir), stops });
});

// Track (recorrido reciente)
app.get('/track', (req,res)=>{
  const id = (req.query.deviceId || '').toString();
  if(!id) return res.status(400).json({error:'deviceId requerido'});
  const arr = tracks.get(id) || [];
  const minutes = Number(req.query.minutes || 0);
  if(minutes>0){
    const cutoff = Date.now() - minutes*60*1000;
    return res.json(arr.filter(p => p.t >= cutoff));
  }
  res.json(arr);
});

// Device quick state
app.get('/device', (req,res)=>{
  const id=(req.query.deviceId||'').toString();
  if(!id) return res.status(400).json({error:'deviceId requerido'});
  const st=deviceState.get(id);
  if(!st) return res.json({found:false});
  res.json({
    found:true,
    deviceId:id,
    lineId:st.lineId, dir:st.dir,
    lastSeen: st.lastSeen ? new Date(st.lastSeen).toISOString() : null,
    lastSeenTs: st.lastSeen || null,
    lastLat: st.lastLat, lastLon: st.lastLon,
    snappedStopId: st.lastStopId || null,
    snappedStopName: st.lastStopName || null,
    sats: st.sats ?? null, hdop: st.hdop ?? null, speedKmh: st.speedKmh ?? null, alt: st.alt ?? null
  });
});

// Asignar línea/dirección
app.post('/set-line',(req,res)=>{
  const { deviceId='unknown', lineId=DEFAULT_LINE_ID, dir=DEFAULT_DIR } = req.body||{};
  if(!LINES[normId(lineId)]) return res.status(400).json({error:'lineId inválido'});
  if(!LINES[normId(lineId)][normId(dir)]) return res.status(400).json({error:'dir inválida'});
  const st=deviceState.get(deviceId)||{};
  st.lineId=normId(lineId); st.dir=normId(dir);
  deviceState.set(deviceId,st);
  res.json({ok:true, deviceId, lineId:st.lineId, dir:st.dir});
});

// Telemetría del bus
// body: { deviceId, lat, lon, (opt) alt, sats, hdop, speedKmh, lineId, dir }
app.post('/telemetry',(req,res)=>{
  const { deviceId='unknown', lat, lon, alt, sats, hdop, speedKmh, lineId, dir } = req.body||{};
  if(lat==null || lon==null) return res.sendStatus(400);

  const st=deviceState.get(deviceId)||{ lineId:DEFAULT_LINE_ID, dir:DEFAULT_DIR };
  if(lineId && LINES[normId(lineId)]) st.lineId=normId(lineId);
  if(dir && LINES[st.lineId]?.[normId(dir)]) st.dir=normId(dir);

  st.lastLat=Number(lat); st.lastLon=Number(lon);
  if(alt!==undefined) st.alt=Number(alt);
  if(sats!==undefined) st.sats=Number(sats);
  if(hdop!==undefined) st.hdop=Number(hdop);
  if(speedKmh!==undefined) st.speedKmh=Number(speedKmh);
  st.lastSeen=Date.now();

  // Geofencing y promedios
  const near=nearestStopInLine(st.lineId, st.dir, st.lastLat, st.lastLon);
  if(near && near.distance<=GEOFENCE_RADIUS_M){
    if(st.lastStopId && normId(st.lastStopId)!==normId(near.id) && st.lastStopTime){
      const dtSec=Math.max(1, Math.round((Date.now()-st.lastStopTime)/1000));
      updateSegmentAvg(st.lineId, st.dir, st.lastStopId, near.id, dtSec);
    }
    st.lastStopId=near.id; st.lastStopName=near.name; st.lastStopTime=Date.now();
  }

  // Guardar punto en track
  pushTrack(deviceId, st.lastLat, st.lastLon);

  deviceState.set(deviceId,st);
  res.sendStatus(200);
});

// Estado general
app.get('/state',(req,res)=>{
  const devices=[];
  for(const [id,st] of deviceState.entries()){
    devices.push({
      deviceId:id, lineId:st.lineId, dir:st.dir,
      lastSeen: st.lastSeen ? new Date(st.lastSeen).toISOString() : null,
      lastLat: st.lastLat, lastLon: st.lastLon,
      sats: st.sats ?? null, hdop: st.hdop ?? null, speedKmh: st.speedKmh ?? null,
      lastStopId: st.lastStopId, lastStopName: st.lastStopName
    });
  }
  res.json({ lines:Object.keys(LINES), devices });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Servidor en puerto', PORT));
