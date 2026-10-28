/* =========================================================
   MO7LEY TRAVEL — Photo Curation Studio (TEMPORARY / INTERNAL)
   -----------------------------------------------------------
   A bottom-docked drawer (not a blocking modal) so the live
   site stays visible behind it. Lets Vlad:
     1. Drop in candidate photos for a location
     2. Swipe left (discard) / right (keep) through them
     3. See all "kept" photos in a Library panel
     4. Drag a Library photo onto any photo slot on the site
   Everything is stored in the browser's IndexedDB so choices
   survive a page reload. Before going live, use "Export kept
   photos" to download the files, drop them in assets/images/,
   then delete this file + its <script> tag + the toggle button
   in index.html.
   ========================================================= */

const STUDIO_TARGET_DEFAULT = 25;
const STUDIO_LOCATIONS = [
  ...DESTINATIONS.filter(d=>!d.hideCard).map(d=>({id:d.id, label:`📍 ${d.name}`})),
  ...ACTIVITIES.map(a=>({id:"activity-"+a.id, label:`${a.icon} Activity: ${a.name}`})),
];

/* ---------------- tiny IndexedDB wrapper ---------------- */
const StudioDB = (function(){
  let dbp = null;
  function open(){
    if(dbp) return dbp;
    dbp = new Promise((resolve,reject)=>{
      const req = indexedDB.open("mo7ley_studio", 1);
      req.onupgradeneeded = ()=>{
        const db = req.result;
        if(!db.objectStoreNames.contains("candidates")){
          const s = db.createObjectStore("candidates",{keyPath:"id", autoIncrement:true});
          s.createIndex("loc","loc");
        }
        if(!db.objectStoreNames.contains("assignments")){
          db.createObjectStore("assignments",{keyPath:"key"});
        }
      };
      req.onsuccess = ()=>resolve(req.result);
      req.onerror = ()=>reject(req.error);
    });
    return dbp;
  }
  async function tx(store, mode){ const db = await open(); return db.transaction(store, mode).objectStore(store); }
  return {
    async addCandidate(loc, file, decision){
      const s = await tx("candidates","readwrite");
      return new Promise((res,rej)=>{
        const r = s.add({loc, filename:file.name||"dropped-image", blob:file, decision: decision||null, addedAt:Date.now()});
        r.onsuccess = ()=>res(r.result); r.onerror=()=>rej(r.error);
      });
    },
    async getByLoc(loc){
      const s = await tx("candidates","readonly");
      return new Promise((res,rej)=>{
        const idx = s.index("loc"); const items=[];
        const r = idx.openCursor(IDBKeyRange.only(loc));
        r.onsuccess = e=>{ const c=e.target.result; if(c){items.push(c.value); c.continue();} else res(items); };
        r.onerror = ()=>rej(r.error);
      });
    },
    async get(id){
      const s = await tx("candidates","readonly");
      return new Promise((res,rej)=>{ const r=s.get(id); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
    },
    async decide(id, decision){
      const s = await tx("candidates","readwrite");
      return new Promise((res,rej)=>{
        const g = s.get(id);
        g.onsuccess = ()=>{ const rec=g.result; if(!rec) return res(); rec.decision=decision; const p=s.put(rec); p.onsuccess=()=>res(rec); p.onerror=()=>rej(p.error); };
        g.onerror=()=>rej(g.error);
      });
    },
    async setAssignment(loc, idx, candidateId){
      const s = await tx("assignments","readwrite");
      return new Promise((res,rej)=>{
        const r = s.put({key:loc+"::"+idx, loc, idx, candidateId});
        r.onsuccess=()=>res(); r.onerror=()=>rej(r.error);
      });
    },
    async getAllAssignments(){
      const s = await tx("assignments","readonly");
      return new Promise((res,rej)=>{ const items=[]; const r=s.openCursor();
        r.onsuccess=e=>{ const c=e.target.result; if(c){items.push(c.value); c.continue();} else res(items); };
        r.onerror=()=>rej(r.error);
      });
    },
    async getAllCandidates(){
      const s = await tx("candidates","readonly");
      return new Promise((res,rej)=>{ const items=[]; const r=s.openCursor();
        r.onsuccess=e=>{ const c=e.target.result; if(c){items.push(c.value); c.continue();} else res(items); };
        r.onerror=()=>rej(r.error);
      });
    }
  };
})();

/* ---------------- studio DOM ---------------- */
const studioHTML = `
<div id="studio-drawer" class="studio-drawer">
  <div class="studio-head">
    <div class="studio-title">🖼️ MO7LEY Photo Studio <span class="studio-badge">internal / remove before launch</span></div>
    <div class="studio-tabs">
      <button class="studio-tab active" data-tab="add">Add Photos</button>
      <button class="studio-tab" data-tab="swipe">Swipe & Keep</button>
      <button class="studio-tab" data-tab="library">Library</button>
    </div>
    <div class="studio-loc-picker">
      <select id="studio-loc"></select>
      <span id="studio-progress"></span>
    </div>
    <button id="studio-minimize" class="studio-icon-btn" title="Minimize">—</button>
    <button id="studio-close" class="studio-icon-btn" title="Close">✕</button>
  </div>

  <div class="studio-body">
    <div class="studio-panel active" data-panel="add">
      <div id="studio-dropzone" class="studio-dropzone">
        <div class="dz-icon">⬇️</div>
        <div><b>Drag & drop photos here</b><br>(or click to choose files) — added as candidates for the location selected above.</div>
        <input type="file" id="studio-file-input" multiple accept="image/*" style="display:none;">
      </div>
      <p class="studio-hint">Tip: export a location's album from Photos as files, select them all, and drag the whole batch in at once.</p>
    </div>

    <div class="studio-panel" data-panel="swipe">
      <div class="swipe-stage">
        <div id="swipe-empty" class="swipe-empty">No candidates left to review for this location. Add more in the "Add Photos" tab, or pick another location.</div>
        <div id="swipe-card" class="swipe-card" style="display:none;">
          <img id="swipe-img" draggable="false">
          <div class="swipe-flag keep">KEEP</div>
          <div class="swipe-flag discard">SKIP</div>
        </div>
      </div>
      <div class="swipe-controls">
        <button id="swipe-discard" class="btn btn-outline-dark btn-sm">✕ Discard</button>
        <span id="swipe-counter" class="swipe-counter"></span>
        <button id="swipe-keep" class="btn btn-coral btn-sm">✓ Keep</button>
      </div>
    </div>

    <div class="studio-panel" data-panel="library">
      <div class="library-toolbar">
        <span>Drag any photo below onto a photo box on the site to place it there.</span>
        <button id="studio-export" class="btn btn-navy btn-sm">Export kept photos (.zip)</button>
      </div>
      <div id="studio-library-grid" class="library-grid"></div>
    </div>
  </div>
</div>`;

const styleTag = document.createElement("style");
styleTag.textContent = `
.studio-drawer{ position:fixed; left:0; right:0; bottom:0; z-index:950; background:#0b1f33; color:#fff;
  box-shadow:0 -16px 40px rgba(0,0,0,.4); transform:translateY(0); transition:transform .25s ease; max-height:52vh; display:flex; flex-direction:column; font-family:"Manrope",sans-serif;}
.studio-drawer.minimized{ transform:translateY(calc(100% - 52px)); }
.studio-head{ display:flex; align-items:center; gap:16px; padding:10px 16px; background:#081625; flex-wrap:wrap;}
.studio-title{ font-weight:800; font-family:"Baloo 2"; font-size:1rem; display:flex; align-items:center; gap:8px;}
.studio-badge{ background:#ff6b4a; font-size:.65rem; padding:3px 8px; border-radius:999px; font-weight:800; text-transform:uppercase; letter-spacing:.03em;}
.studio-tabs{display:flex; gap:6px;}
.studio-tab{ background:rgba(255,255,255,.08); border:none; color:#fff; padding:7px 14px; border-radius:8px; font-weight:700; font-size:.82rem;}
.studio-tab.active{ background:#0ea5b7;}
.studio-loc-picker{ display:flex; align-items:center; gap:10px; margin-left:auto;}
.studio-loc-picker select{ padding:7px 10px; border-radius:8px; border:none; font-weight:700; font-size:.82rem;}
#studio-progress{ font-size:.78rem; opacity:.8; font-weight:700; white-space:nowrap;}
.studio-icon-btn{ background:rgba(255,255,255,.08); border:none; color:#fff; width:30px; height:30px; border-radius:8px; font-size:.9rem;}
.studio-body{ padding:16px 20px; overflow-y:auto;}
.studio-panel{display:none;}
.studio-panel.active{display:block;}
.studio-dropzone{ border:2px dashed rgba(255,255,255,.3); border-radius:14px; padding:40px 20px; text-align:center; cursor:pointer; color:rgba(255,255,255,.85); font-size:.9rem;}
.studio-dropzone.drag-over{ background:rgba(14,165,183,.15); border-color:#0ea5b7;}
.dz-icon{font-size:1.8rem; margin-bottom:8px;}
.studio-hint{ font-size:.78rem; color:rgba(255,255,255,.55); margin-top:12px;}
.swipe-stage{ position:relative; height:260px; display:flex; align-items:center; justify-content:center;}
.swipe-card{ width:220px; height:240px; border-radius:14px; overflow:hidden; position:relative; background:#122a44; box-shadow:0 14px 30px rgba(0,0,0,.4); touch-action:none; user-select:none; cursor:grab;}
.swipe-card img{ width:100%; height:100%; object-fit:cover; pointer-events:none;}
.swipe-flag{ position:absolute; top:14px; padding:6px 12px; border:3px solid; border-radius:8px; font-weight:900; font-size:.85rem; opacity:0; transform:rotate(-12deg);}
.swipe-flag.keep{ right:10px; color:#22c55e; border-color:#22c55e;}
.swipe-flag.discard{ left:10px; color:#ef4444; border-color:#ef4444; transform:rotate(12deg);}
.swipe-empty{ max-width:320px; text-align:center; font-size:.85rem; color:rgba(255,255,255,.6);}
.swipe-controls{ display:flex; align-items:center; justify-content:center; gap:22px; margin-top:12px;}
.swipe-counter{ font-weight:800; font-size:.85rem; color:rgba(255,255,255,.75);}
.btn-outline-dark{ background:rgba(255,255,255,.08); color:#fff; border:none; padding:10px 18px; border-radius:999px; font-weight:800;}
.library-toolbar{ display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-size:.85rem; color:rgba(255,255,255,.7); flex-wrap:wrap; gap:10px;}
.library-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(84px,1fr)); gap:10px;}
.library-thumb{ aspect-ratio:1; border-radius:8px; overflow:hidden; cursor:grab; position:relative; border:2px solid transparent;}
.library-thumb img{width:100%; height:100%; object-fit:cover;}
.library-thumb .lt-loc{ position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,.55); font-size:.55rem; padding:2px 4px; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;}
#studio-toggle.active{ background:#0ea5b7 !important; }
.photo-slot.drop-hover{ outline:3px solid #ff6b4a; outline-offset:-3px; }
`;
document.head.appendChild(styleTag);

(function ensureRoot(){
  if(!document.getElementById("curation-root")){
    var r = document.createElement("div");
    r.id = "curation-root";
    document.body.appendChild(r);
  }
  if(!document.getElementById("studio-toggle")){
    var btn = document.createElement("button");
    btn.id = "studio-toggle";
    btn.title = "Photo Curation Studio (Vlad only)";
    btn.textContent = "🖼️";
    btn.style.cssText = "position:fixed;bottom:20px;left:20px;z-index:900;width:52px;height:52px;border-radius:50%;background:#111b22;color:#fff;border:none;font-size:1.3rem;box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer;";
    document.body.appendChild(btn);
  }
})();

document.getElementById("curation-root").innerHTML = studioHTML;

/* populate location dropdown */
const locSelect = document.getElementById("studio-loc");
locSelect.innerHTML = STUDIO_LOCATIONS.map(l=>`<option value="${l.id}">${l.label}</option>`).join("");

let currentLoc = STUDIO_LOCATIONS[0].id;
let currentCard = null; // {id, blob, objectUrl}
let studioOpen = false;

const drawer = document.getElementById("studio-drawer");
const toggleBtn = document.getElementById("studio-toggle");

function openStudio(){ studioOpen = true; drawer.style.display="flex"; drawer.classList.remove("minimized"); toggleBtn.classList.add("active"); refreshProgress(); renderLibrary(); loadNextCard(); }
function closeStudio(){ studioOpen = false; drawer.style.display="none"; toggleBtn.classList.remove("active"); }
drawer.style.display = "none";

toggleBtn.addEventListener("click", ()=> studioOpen ? closeStudio() : openStudio());
document.getElementById("studio-close").addEventListener("click", closeStudio);
document.getElementById("studio-minimize").addEventListener("click", ()=> drawer.classList.toggle("minimized"));

/* tabs */
document.querySelectorAll(".studio-tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".studio-tab").forEach(t=>t.classList.remove("active"));
    document.querySelectorAll(".studio-panel").forEach(p=>p.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`.studio-panel[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    if(tab.dataset.tab === "swipe") loadNextCard();
    if(tab.dataset.tab === "library") renderLibrary();
  });
});

locSelect.addEventListener("change", ()=>{ currentLoc = locSelect.value; refreshProgress(); loadNextCard(); });

/* ---------------- Add Photos (dropzone) ---------------- */
const dz = document.getElementById("studio-dropzone");
const fileInput = document.getElementById("studio-file-input");
dz.addEventListener("click", ()=>fileInput.click());
fileInput.addEventListener("change", e=> handleFiles(e.target.files));
["dragenter","dragover"].forEach(ev=>dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.add("drag-over"); }));
["dragleave","drop"].forEach(ev=>dz.addEventListener(ev, e=>{ e.preventDefault(); dz.classList.remove("drag-over"); }));
dz.addEventListener("drop", e=> handleFiles(e.dataTransfer.files));

async function handleFiles(fileList){
  const files = Array.from(fileList||[]).filter(f=>f.type.startsWith("image/"));
  for(const f of files){ await StudioDB.addCandidate(currentLoc, f, null); }
  refreshProgress();
  if(document.querySelector('.studio-panel[data-panel="swipe"]').classList.contains("active")) loadNextCard();
}

/* ---------------- Swipe deck ---------------- */
async function loadNextCard(){
  const items = (await StudioDB.getByLoc(currentLoc)).filter(c=>c.decision===null);
  const cardEl = document.getElementById("swipe-card");
  const emptyEl = document.getElementById("swipe-empty");
  if(currentCard && currentCard.objectUrl) URL.revokeObjectURL(currentCard.objectUrl);
  if(!items.length){
    currentCard = null;
    cardEl.style.display="none"; emptyEl.style.display="flex";
    refreshProgress();
    return;
  }
  const rec = items[0];
  const url = URL.createObjectURL(rec.blob);
  currentCard = {id:rec.id, objectUrl:url};
  document.getElementById("swipe-img").src = url;
  cardEl.style.display="block"; emptyEl.style.display="none";
  cardEl.style.transform = "translateX(0) rotate(0)";
  cardEl.querySelector(".keep").style.opacity = 0;
  cardEl.querySelector(".discard").style.opacity = 0;
  wireSwipeGestures(cardEl);
  refreshProgress();
}

async function decideCurrent(decision){
  if(!currentCard) return;
  await StudioDB.decide(currentCard.id, decision);
  await loadNextCard();
  renderLibrary();
}
document.getElementById("swipe-keep").addEventListener("click", ()=>decideCurrent("keep"));
document.getElementById("swipe-discard").addEventListener("click", ()=>decideCurrent("discard"));
document.addEventListener("keydown", e=>{
  if(!studioOpen) return;
  if(!document.querySelector('.studio-panel[data-panel="swipe"]').classList.contains("active")) return;
  if(e.key === "ArrowRight") decideCurrent("keep");
  if(e.key === "ArrowLeft") decideCurrent("discard");
});

function wireSwipeGestures(cardEl){
  let startX=0, dx=0, dragging=false;
  const keepFlag = cardEl.querySelector(".keep"), discardFlag = cardEl.querySelector(".discard");
  function down(e){ dragging=true; startX = (e.touches?e.touches[0].clientX:e.clientX); cardEl.style.cursor="grabbing"; }
  function move(e){
    if(!dragging) return;
    const x = (e.touches?e.touches[0].clientX:e.clientX);
    dx = x - startX;
    cardEl.style.transform = `translateX(${dx}px) rotate(${dx/14}deg)`;
    keepFlag.style.opacity = Math.max(0, Math.min(1, dx/80));
    discardFlag.style.opacity = Math.max(0, Math.min(1, -dx/80));
  }
  function up(){
    if(!dragging) return;
    dragging=false; cardEl.style.cursor="grab";
    if(dx > 90) decideCurrent("keep");
    else if(dx < -90) decideCurrent("discard");
    else { cardEl.style.transform="translateX(0) rotate(0)"; keepFlag.style.opacity=0; discardFlag.style.opacity=0; }
    dx = 0;
  }
  cardEl.onpointerdown = down; cardEl.onpointermove = move; cardEl.onpointerup = up; cardEl.onpointerleave = up;
}

/* ---------------- progress ---------------- */
async function refreshProgress(){
  const items = await StudioDB.getByLoc(currentLoc);
  const kept = items.filter(c=>c.decision==="keep").length;
  const reviewed = items.filter(c=>c.decision!==null).length;
  const target = STUDIO_TARGET_DEFAULT;
  const el = document.getElementById("studio-progress");
  let msg = `${kept}/${target} kept · ${reviewed}/${items.length} reviewed`;
  if(reviewed >= Math.min(items.length,100) && kept < target){
    msg += ` — need ${target-kept} more, add photos!`;
  }
  el.textContent = msg;
}

/* ---------------- library ---------------- */
async function renderLibrary(){
  const all = await StudioDB.getAllCandidates();
  const kept = all.filter(c=>c.decision==="keep");
  const grid = document.getElementById("studio-library-grid");
  if(!kept.length){ grid.innerHTML = `<p style="color:rgba(255,255,255,.5);font-size:.85rem;">No kept photos yet — swipe right on some, or drop files directly onto a photo box on the site.</p>`; return; }
  grid.innerHTML = kept.map(c=>{
    const url = URL.createObjectURL(c.blob);
    return `<div class="library-thumb" draggable="true" data-cid="${c.id}"><img src="${url}"><div class="lt-loc">${c.loc}</div></div>`;
  }).join("");
  grid.querySelectorAll(".library-thumb").forEach(t=>{
    t.addEventListener("dragstart", e=>{ e.dataTransfer.setData("text/mo7ley-candidate", t.dataset.cid); });
  });
}

/* ---------------- drop onto site photo slots ---------------- */
document.addEventListener("dragover", e=>{
  const slot = e.target.closest(".photo-slot");
  if(slot){ e.preventDefault(); slot.classList.add("drop-hover"); }
});
document.addEventListener("dragleave", e=>{
  const slot = e.target.closest(".photo-slot");
  if(slot) slot.classList.remove("drop-hover");
});
document.addEventListener("drop", async e=>{
  const slot = e.target.closest(".photo-slot");
  if(!slot) return;
  e.preventDefault();
  slot.classList.remove("drop-hover");
  const loc = slot.dataset.loc, idx = +slot.dataset.idx;

  const cid = e.dataTransfer.getData("text/mo7ley-candidate");
  if(cid){
    await StudioDB.setAssignment(loc, idx, +cid);
    const rec = await StudioDB.get(+cid);
    window.PHOTO_LIBRARY[loc] = window.PHOTO_LIBRARY[loc] || [];
    window.PHOTO_LIBRARY[loc][idx] = URL.createObjectURL(rec.blob);
    window.dispatchEvent(new Event("mo7ley:photos-updated"));
    return;
  }
  // direct file drag from Finder straight onto a site photo slot
  if(e.dataTransfer.files && e.dataTransfer.files.length){
    const file = e.dataTransfer.files[0];
    if(file.type.startsWith("image/")){
      const cid2 = await StudioDB.addCandidate(loc, file, "keep");
      await StudioDB.setAssignment(loc, idx, cid2);
      window.PHOTO_LIBRARY[loc] = window.PHOTO_LIBRARY[loc] || [];
      window.PHOTO_LIBRARY[loc][idx] = URL.createObjectURL(file);
      window.dispatchEvent(new Event("mo7ley:photos-updated"));
    }
  }
});

/* ---------------- export kept photos as a .zip ---------------- */
document.getElementById("studio-export").addEventListener("click", async ()=>{
  const all = await StudioDB.getAllCandidates();
  const kept = all.filter(c=>c.decision==="keep");
  if(!kept.length){ alert("No kept photos yet."); return; }
  if(typeof JSZip === "undefined"){
    await loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js");
  }
  const zip = new JSZip();
  const byLoc = {};
  kept.forEach(c=>{ byLoc[c.loc] = byLoc[c.loc] || []; byLoc[c.loc].push(c); });
  Object.keys(byLoc).forEach(loc=>{
    byLoc[loc].forEach((c,i)=>{
      const ext = (c.filename.split(".").pop()||"jpg").toLowerCase();
      zip.file(`${loc}/${loc}-${String(i+1).padStart(2,"0")}.${ext}`, c.blob);
    });
  });
  const blob = await zip.generateAsync({type:"blob"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mo7ley-kept-photos.zip";
  a.click();
});
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }

/* ---------------- rehydrate assignments on page load ---------------- */
(async function rehydrate(){
  try{
    const assignments = await StudioDB.getAllAssignments();
    for(const a of assignments){
      const rec = await StudioDB.get(a.candidateId);
      if(!rec) continue;
      window.PHOTO_LIBRARY[a.loc] = window.PHOTO_LIBRARY[a.loc] || [];
      window.PHOTO_LIBRARY[a.loc][a.idx] = URL.createObjectURL(rec.blob);
    }
    if(assignments.length){ window.dispatchEvent(new Event("mo7ley:photos-updated")); }
  }catch(err){ console.warn("Studio rehydrate skipped:", err); }
})();

refreshProgress();
