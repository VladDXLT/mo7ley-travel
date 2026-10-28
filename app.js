/* =========================================================
   MO7LEY TRAVEL — homepage behavior
   Nav/footer/reveal/scroll-progress are handled by shared.js.
   This file: hero slideshow, group trips, activity tabs.
   ========================================================= */

/* ---------- helper: photo slots ----------
   Renders a grid of photo placeholders for a destination/activity.
   Real photos (once curated) live in PHOTO_LIBRARY[locationId] = [urls...]
   window.PHOTO_LIBRARY is populated by curation.js runtime state. */
window.PHOTO_LIBRARY = window.PHOTO_LIBRARY || {};

function photoSlots(locationId, count, opts){
  opts = opts || {};
  const photos = (window.PHOTO_LIBRARY[locationId] || []).slice(0, count);
  let html = "";
  for(let i=0;i<count;i++){
    const url = photos[i];
    html += `<div class="photo-slot" data-loc="${locationId}" data-idx="${i}" data-empty="${url?"false":"true"}" style="${opts.style||""}">`
      + (url ? `<img src="${url}" alt="${locationId} photo ${i+1}">` : "")
      + `</div>`;
  }
  return html;
}
window.photoSlots = photoSlots;

function fearDotsHtml(score, label, lightBg){
  let dots = "";
  for(let i=1;i<=5;i++) dots += `<i class="${i<=score?"on":""}"></i>`;
  return `<div class="fear-meter${lightBg?" on-light":""}"><span class="fm-label">${label||"Fear Factor"}</span><div class="fm-dots">${dots}</div></div>`;
}
window.fearDotsHtml = fearDotsHtml;

/* ---------- hero background slideshow ---------- */
const HERO_ROTATION = ["maldives","hawaii-oahu","switzerland","philippines","italy","banff","fiji","utah"];
const heroSlideshow = (function(){
  const wrap = document.getElementById("hero-media");
  let idx = 0;
  function render(){
    wrap.innerHTML = HERO_ROTATION.map((id,i)=>{
      const dest = DESTINATIONS.find(d=>d.id===id) || {gradient:"linear-gradient(135deg,#33645d,#111b22)"};
      const photo = (window.PHOTO_LIBRARY[id]||[])[0];
      const bg = photo ? `background-image:url('${photo}')` : `background-image:${dest.gradient}`;
      return `<div class="slide${i===idx?" active":""}" style="${bg}"></div>`;
    }).join("");
  }
  function next(){
    const slides = wrap.querySelectorAll(".slide");
    if(!slides.length) return;
    slides[idx].classList.remove("active");
    idx = (idx+1) % slides.length;
    slides[idx].classList.add("active");
  }
  render();
  setInterval(next, 5000);
  return { render, next };
})();
window.addEventListener("mo7ley:photos-updated", ()=> heroSlideshow.render());

/* ---------- hero stat count-up ---------- */
(function countUp(){
  const el = document.getElementById("stat-countries");
  const total = DESTINATIONS.filter(d=>!d.hideCard).length;
  let n = 0;
  const step = ()=>{ n++; el.textContent = n; if(n<total) requestAnimationFrame(()=>setTimeout(step,25)); };
  step();
})();

/* ---------- GROUP TRIPS ---------- */
(function renderGroupTrips(){
  const wrap = document.getElementById("group-trip-list");
  wrap.innerHTML = GROUP_TRIPS.map(trip=>{
    const dest = DESTINATIONS.find(d=>d.id===trip.destinationId);
    return `
    <div class="trip-card">
      <div class="trip-media shape-a" style="background:${dest.gradient}">
        <span class="badge">Now Booking</span>
        <div class="mini-gallery">${photoSlots(trip.destinationId, 8)}</div>
      </div>
      <div class="trip-body">
        <h3>${trip.name}</h3>
        <p>${trip.description}</p>
        <ul class="trip-highlights">
          ${trip.highlights.map(h=>`<li>${h}</li>`).join("")}
        </ul>
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <a href="${MO7_ROOT}contact.html" class="btn btn-coral">Join the Waitlist</a>
          <a href="${MO7_ROOT}group-trips.html" class="btn btn-outline" style="color:var(--navy,#111b22);border-color:rgba(255,255,255,.4);">Full Itinerary →</a>
        </div>
      </div>
    </div>`;
  }).join("");
  document.dispatchEvent(new Event("mo7ley:content-ready"));
})();

/* ---------- ACTIVITY TRIPS ---------- */
const ACTIVITY_FEAR = { skydive:5, mountaineering:4, freedive:4, scuba:3, surf:3, boat:2 };
(function renderActivities(){
  const tabWrap = document.getElementById("activity-tabs");
  const panelWrap = document.getElementById("activity-panels");
  tabWrap.innerHTML = ACTIVITIES.map((a,i)=>
    `<button class="activity-tab${i===0?" active":""}" data-act="${a.id}">${a.icon} ${a.name}</button>`
  ).join("");
  panelWrap.innerHTML = ACTIVITIES.map((a,i)=>{
    const places = DESTINATIONS.filter(d=>d.activities.includes(a.id) && !d.hideCard).slice(0,6).map(d=>d.name).join(" · ");
    return `
    <div class="activity-card${i===0?" active":""}" data-act="${a.id}">
      <div class="activity-media shape-c" style="background:linear-gradient(150deg,#33645d,#111b22)">
        <div class="icon-badge">${a.icon}</div>
      </div>
      <div class="activity-body">
        <h3>${a.name}</h3>
        <p>${a.blurb}</p>
        ${fearDotsHtml(ACTIVITY_FEAR[a.id]||2, "Fear Factor", true)}
        <p style="font-weight:700;color:var(--navy);font-size:.88rem;margin-top:14px;">Where we run it: ${places || "ask us"}</p>
        <div class="activity-gallery">${photoSlots("activity-"+a.id, 4)}</div>
        <a href="${MO7_ROOT}contact.html" class="btn btn-coral btn-sm" style="margin-top:14px;">Ask about ${a.name}</a>
      </div>
    </div>`;
  }).join("");

  tabWrap.addEventListener("click", (e)=>{
    const btn = e.target.closest(".activity-tab");
    if(!btn) return;
    tabWrap.querySelectorAll(".activity-tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    panelWrap.querySelectorAll(".activity-card").forEach(c=>c.classList.toggle("active", c.dataset.act===btn.dataset.act));
  });
  document.dispatchEvent(new Event("mo7ley:content-ready"));
})();

/* re-render photo slots whenever curation tool updates the library */
window.addEventListener("mo7ley:photos-updated", ()=>{
  document.querySelectorAll(".photo-slot").forEach(slot=>{
    const loc = slot.dataset.loc, idx = +slot.dataset.idx;
    const url = (window.PHOTO_LIBRARY[loc]||[])[idx];
    slot.dataset.empty = url ? "false" : "true";
    slot.innerHTML = url ? `<img src="${url}" alt="${loc}">` : "";
  });
});
