/* =========================================================
   MO7LEY TRAVEL — 3D destination globe + synced side list
   Built on globe.gl (Three.js). Continent > Country > Region
   list in the sidebar mirrors the dots on the globe — clicking
   either one opens the same destination panel.
   ========================================================= */

const CONTINENT_ORDER = ["North America","Europe","Asia","Oceania"];
const visibleDestinations = DESTINATIONS.filter(d=>!d.hideCard);

/* ---------- build continent > country > region tree ---------- */
function buildTree(){
  const tree = {};
  CONTINENT_ORDER.forEach(c=>tree[c]={});
  DESTINATIONS.forEach(d=>{
    if(d.kind === "country"){
      tree[d.continent][d.id] = tree[d.continent][d.id] || {info:d, children:[]};
      tree[d.continent][d.id].info = d;
    }
  });
  DESTINATIONS.forEach(d=>{
    if(d.kind !== "country" && d.parent){
      const parentDest = DESTINATIONS.find(p=>p.id===d.parent);
      const key = d.parent;
      tree[d.continent][key] = tree[d.continent][key] || {info:parentDest, children:[]};
      tree[d.continent][key].children.push(d);
    }
  });
  // countries with no explicit "country" entry but only regions (e.g. Maldives has no sub-regions -> already a country node)
  return tree;
}

const CHEVRON_SVG = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;
const PIN_SVG = `<svg class="pin" viewBox="0 0 24 24"><path d="M12 2C8.4 2 5.4 4.9 5.4 8.7c0 5.1 6.6 12.7 6.6 12.7s6.6-7.6 6.6-12.7C18.6 4.9 15.6 2 12 2z"/><circle class="pin-dot" cx="12" cy="8.8" r="2.3"/></svg>`;

function renderDestList(){
  const tree = buildTree();
  const root = document.getElementById("dest-list");
  let html = "";
  CONTINENT_ORDER.forEach(continent=>{
    const countries = tree[continent];
    const countryIds = Object.keys(countries);
    if(!countryIds.length) return;
    html += `<div class="continent-block"><div class="continent-title"><span class="ct-dash"></span>${continent}</div>`;
    countryIds.forEach(cid=>{
      const node = countries[cid];
      const hasChildren = node.children.length > 0;
      html += `<div class="country-block">`;
      if(hasChildren){
        html += `<div class="country-title" data-toggle="${cid}">${CHEVRON_SVG}<span class="ct-name">${node.info.name}</span><span class="ct-count">${node.children.length}</span></div>`;
        html += `<div class="region-list" id="regions-${cid}">`;
        node.children.forEach(child=>{
          html += `<a class="region-item" data-dest="${child.id}">${child.name.replace(node.info.name+" — ","")}</a>`;
        });
        html += `</div>`;
      } else {
        html += `<div class="country-title single" data-dest="${node.info.id}">${PIN_SVG}<span class="ct-name">${node.info.name}</span></div>`;
      }
      html += `</div>`;
    });
    html += `</div>`;
  });
  root.innerHTML = html;

  root.querySelectorAll("[data-toggle]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.dataset.toggle;
      const list = document.getElementById("regions-"+id);
      const open = list.classList.contains("open");
      list.classList.toggle("open", !open);
      el.classList.toggle("open", !open);
    });
  });
  root.querySelectorAll("[data-dest]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const id = el.dataset.dest;
      selectDestination(id, true);
      root.querySelectorAll(".region-item, .country-title.single").forEach(r=>r.classList.remove("active"));
      el.classList.add("active");
    });
  });
}
renderDestList();

/* ---------- globe ---------- */
/* Destination markers are custom 3D pins (not flat dots) — much easier
   to see and click, and closer to the "luxury map" feel we're after.
   Names only render for whichever single destination is hovered or
   selected, plus (when zoomed in) real country/state boundary names —
   that combination is what keeps dense clusters (Europe!) from turning
   into a wall of overlapping text at low zoom. */
let world;
let hoveredDest = null;
let selectedDest = null;
let currentPov = {lat:15, lng:20, altitude:2.6};
let countryLabelPool = [];
let stateLabelPool = [];

function angDist(lat1,lng1,lat2,lng2){
  const dLat = lat1-lat2, dLng = (lng1-lng2)*Math.cos(lat1*Math.PI/180);
  return Math.sqrt(dLat*dLat + dLng*dLng);
}
function visibleGeoLabels(pov){
  if(!pov || pov.altitude > 1.3 || !countryLabelPool.length) return [];
  const radius = Math.min(52, pov.altitude*45 + 8);
  let out = countryLabelPool.filter(c => angDist(pov.lat,pov.lng,c.lat,c.lng) < radius);
  if(pov.altitude < 0.55 && stateLabelPool.length){
    const nearUS = angDist(pov.lat,pov.lng,39,-98) < 34;
    if(nearUS){
      const sRadius = Math.min(30, pov.altitude*45 + 6);
      out = out.concat(stateLabelPool.filter(s => angDist(pov.lat,pov.lng,s.lat,s.lng) < sRadius));
    }
  }
  return out;
}
function labelArray(){
  const arr = visibleGeoLabels(currentPov);
  if(hoveredDest) arr.push(hoveredDest);
  if(selectedDest && selectedDest !== hoveredDest) arr.push(selectedDest);
  return arr;
}
function refreshGlobeLabels(){ if(world) world.labelsData(labelArray()); }

/* rough polygon centroid — good enough for label placement, not for anything precise */
function featureCentroid(feature){
  let sx=0, sy=0, n=0;
  function walk(coords){
    if(typeof coords[0] === "number"){ sx += coords[0]; sy += coords[1]; n++; return; }
    coords.forEach(walk);
  }
  walk(feature.geometry.coordinates);
  return n ? {lng:sx/n, lat:sy/n} : null;
}

/* Convert a Polygon/MultiPolygon feature into a flat list of ring paths
   (as [lat,lng] point arrays) — used with the lightweight "paths" line
   layer instead of filled/triangulated polygons, which is dramatically
   cheaper to render for hundreds of coastline-heavy country shapes. */
function featureToPaths(feature, kind, name){
  const geom = feature.geometry;
  if(!geom) return [];
  const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  const paths = [];
  polys.forEach(poly=>{
    poly.forEach(ring=>{
      paths.push({ kind, name, points: ring.map(pt=>[pt[1], pt[0]]) });
    });
  });
  return paths;
}

function loadGeoBoundaries(){
  Promise.all([
    Promise.resolve(window.MO7_GEO_COUNTRIES),
    Promise.resolve(window.MO7_GEO_STATES)
  ]).then(([countries, states])=>{
    countryLabelPool = countries.features.map(f=>{
      const c = featureCentroid(f);
      const name = (f.properties && f.properties.name) || "";
      return c ? {name, lat:c.lat, lng:c.lng, __type:"geo-country"} : null;
    }).filter(Boolean);
    stateLabelPool = states.features.map(f=>{
      const c = featureCentroid(f);
      const name = (f.properties && f.properties.name) || "";
      return c ? {name, lat:c.lat, lng:c.lng, __type:"geo-state"} : null;
    }).filter(Boolean);

    const countryPaths = countries.features.flatMap(f=>featureToPaths(f, "country", (f.properties||{}).name));
    const statePaths = states.features.flatMap(f=>featureToPaths(f, "state", (f.properties||{}).name));
    const allPaths = countryPaths.concat(statePaths);

    if(world){
      world.pathsData(allPaths)
        .pathPoints(d=>d.points)
        .pathPointLat(p=>p[0])
        .pathPointLng(p=>p[1])
        .pathColor(d => d.kind === "state" ? "rgba(195,161,90,0.38)" : "rgba(246,241,230,0.5)")
        .pathStroke(d => d.kind === "state" ? 0.35 : 0.55)
        .pathTransitionDuration(0);
      refreshGlobeLabels();
    }
  }).catch(err=>{ console.warn("Globe boundary data failed to load:", err); });
}

/* ---------- luxury pin markers (custom three.js objects, not flat dots) ---------- */
const PIN_GEO = {
  ring: new THREE.RingGeometry(1.0, 1.7, 28),
  cone: (()=>{ const g = new THREE.ConeGeometry(0.55, 2.3, 12); g.rotateX(Math.PI); g.translate(0, 1.15, 0); return g; })(),
  gem: (()=>{ const g = new THREE.SphereGeometry(0.85, 16, 16); g.translate(0, 2.95, 0); return g; })()
};
const PIN_MAT = {
  ring: new THREE.MeshBasicMaterial({color:0xc3a15a, transparent:true, opacity:0.38, side:THREE.DoubleSide, depthWrite:false}),
  cone: new THREE.MeshStandardMaterial({color:0xa8502e, emissive:0xa8502e, emissiveIntensity:0.22, metalness:0.35, roughness:0.5}),
  gem: new THREE.MeshStandardMaterial({color:0xc3a15a, emissive:0xc3a15a, emissiveIntensity:0.4, metalness:0.65, roughness:0.22})
};
function buildPin(){
  const group = new THREE.Group();
  const ring = new THREE.Mesh(PIN_GEO.ring, PIN_MAT.ring);
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.05;
  ring.raycast = function(){}; // decorative only — keep it out of hover/click hit-testing
  const cone = new THREE.Mesh(PIN_GEO.cone, PIN_MAT.cone);
  const gem = new THREE.Mesh(PIN_GEO.gem, PIN_MAT.gem);
  group.add(ring, cone, gem);
  return group;
}

function initGlobe(){
  const container = document.getElementById("globe-container");
  world = Globe()(container)
    .backgroundColor("rgba(0,0,0,0)")
    .globeImageUrl(window.MO7_IMG.blue)
    .bumpImageUrl(window.MO7_IMG.bump)
    .atmosphereColor("#c3a15a")
    .atmosphereAltitude(0.2)
    .objectsData(visibleDestinations)
    .objectLat(d=>d.lat)
    .objectLng(d=>d.lng)
    .objectAltitude(0.001)
    .objectFacesSurface(true)
    .objectThreeObject(buildPin)
    .onObjectClick(d=>selectDestination(d.id, true))
    .onObjectHover(d=>{
      container.style.cursor = d ? "pointer" : "grab";
      hoveredDest = d;
      refreshGlobeLabels();
    })
    .labelsData([])
    .labelLat(d=>d.lat)
    .labelLng(d=>d.lng)
    .labelText(d=>d.name)
    .labelSize(d => d.__type === "geo-country" ? 0.52 : d.__type === "geo-state" ? 0.4 : 1.15)
    .labelDotRadius(0)
    .labelColor(d => d.__type === "geo-country" ? "rgba(255,255,255,0.68)" : d.__type === "geo-state" ? "rgba(195,161,90,0.85)" : "#ffffff")
    .labelResolution(3)
    .labelAltitude(d => d.__type ? 0.006 : 0.014)
    .onLabelClick(d=>{ if(!d.__type) selectDestination(d.id, true); });

  const startPov = {lat:15,lng:20,altitude:2.6};
  world.pointOfView(startPov);
  currentPov = startPov;

  const controls = world.controls();
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;
  controls.enableZoom = true;
  controls.minDistance = 160;
  controls.maxDistance = 500;

  container.addEventListener("pointerdown", ()=>{ controls.autoRotate = false; });

  let zoomThrottle = null;
  world.onZoom(pov=>{
    currentPov = pov;
    if(zoomThrottle) return;
    zoomThrottle = setTimeout(()=>{ zoomThrottle = null; refreshGlobeLabels(); }, 180);
  });

  loadGeoBoundaries();

  function resize(){
    const rect = document.getElementById("globe-stage").getBoundingClientRect();
    world.width(rect.width).height(rect.height);
  }
  resize();
  window.addEventListener("resize", resize);
}

if(typeof Globe !== "undefined"){
  initGlobe();
} else {
  document.getElementById("globe-container").innerHTML =
    '<div style="color:#fff;opacity:.7;display:flex;align-items:center;justify-content:center;height:100%;padding:30px;text-align:center;">3D globe library failed to load — check your connection and refresh.</div>';
}

document.getElementById("globe-reset").addEventListener("click", ()=>{
  if(!world) return;
  world.controls().autoRotate = true;
  const resetPov = {lat:15,lng:20,altitude:2.6};
  world.pointOfView(resetPov, 900);
  currentPov = resetPov;
  refreshGlobeLabels();
  closeDestPanel();
});

/* ---------- destination panel ---------- */
const panel = document.getElementById("dest-panel");
function selectDestination(id, fly){
  const d = DESTINATIONS.find(x=>x.id===id);
  if(!d) return;
  document.getElementById("dp-loc").textContent = [d.country, d.kind!=="country" ? d.name : null].filter(Boolean).join(" · ") || d.continent;
  document.getElementById("dp-name").textContent = d.name;
  document.getElementById("dp-tag").textContent = d.tagline || "";
  document.getElementById("dp-blurb").textContent = d.blurb || "";
  document.getElementById("dp-activities").innerHTML = (d.activities||[]).map(aid=>{
    const a = ACTIVITIES.find(x=>x.id===aid);
    return a ? `<span>${a.icon} ${a.name}</span>` : "";
  }).join("");
  const fearEl = document.getElementById("dp-fear");
  if(fearEl && window.MO7LEY_CONTENT && window.fearDotsHtml) fearEl.innerHTML = fearDotsHtml(MO7LEY_CONTENT.fearMeter(d), "Fear Factor");
  document.getElementById("dp-photos").innerHTML = photoSlots(d.id, 6);
  const fullLink = document.getElementById("dp-full-link");
  if(fullLink) fullLink.href = (window.MO7_ROOT||"") + "destinations/" + d.id + ".html";
  panel.classList.add("open");

  selectedDest = d;
  refreshGlobeLabels();

  if(fly && world){
    world.controls().autoRotate = false;
    world.pointOfView({lat:d.lat, lng:d.lng, altitude:1.4}, 1000);
  }
}
function closeDestPanel(){
  panel.classList.remove("open");
  selectedDest = null;
  refreshGlobeLabels();
}
document.getElementById("dest-panel-close").addEventListener("click", closeDestPanel);

window.addEventListener("mo7ley:photos-updated", ()=>{
  const openName = document.getElementById("dp-name").textContent;
  const d = DESTINATIONS.find(x=>x.name===openName);
  if(d && panel.classList.contains("open")) document.getElementById("dp-photos").innerHTML = photoSlots(d.id, 6);
});

window.mo7leySelectDestination = selectDestination;
