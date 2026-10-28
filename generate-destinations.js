/* =========================================================
   Generates /destinations/<id>.html for every destination in
   data.js. Run with: node generate-destinations.js
   Re-run any time data.js changes (new spot, edited copy).
   ========================================================= */
const fs = require("fs");
const path = require("path");
const { DESTINATIONS, ACTIVITIES } = require("./data.js");
const CONTENT = require("./content-helpers.js");

const OUT_DIR = path.join(__dirname, "destinations");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const LOADER_LABELS = {
  plane: ["boarding for", "flying out to", "cruising toward"],
  boat: ["casting off for", "setting sail for", "motoring out to"],
  mountain: ["gearing up for", "roping up for", "climbing toward"],
  compass: ["finding our way to", "charting a course to", "pointing north toward"]
};

function activityChip(a){
  return `<a href="../activities.html#${a.id}" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:.72rem;font-weight:600;padding:7px 14px;border-radius:20px;font-family:'Inter',sans-serif;">${a.icon} ${a.name}</a>`;
}

function fearDots(score){
  let d = "";
  for (let i=1;i<=5;i++) d += `<i class="${i<=score?"on":""}"></i>`;
  return `<div class="fear-meter"><span class="fm-label">Fear Factor</span><div class="fm-dots">${d}</div></div>`;
}

function page(dest){
  const acts = (dest.activities||[]).map(id => ACTIVITIES.find(a=>a.id===id)).filter(Boolean);
  const [p1, p2, p3] = CONTENT.paragraphs(dest, ACTIVITIES);
  const fear = CONTENT.fearLine(dest);
  const fearScore = CONTENT.fearMeter(dest);
  const theme = CONTENT.loaderTheme(dest);
  const label = LOADER_LABELS[theme][CONTENT.hashPick(dest.id, [0,1,2])] + " " + dest.name;
  const hasBoat = (dest.activities||[]).includes("boat");
  const crumbTrail = [
    `<a href="../destinations.html">Destinations</a>`,
    `<span>/</span>`,
    `<span>${dest.continent}</span>`,
    `<span>/</span>`,
    dest.kind !== "country" ? `<a href="../destinations.html">${dest.country}</a><span>/</span><span>${dest.name}</span>` : `<span>${dest.name}</span>`
  ].join(" ");

  const nearby = DESTINATIONS.filter(d => !d.hideCard && d.id !== dest.id && d.continent === dest.continent)
    .sort((a,b)=> (a.country===dest.country?0:1) - (b.country===dest.country?0:1))
    .slice(0,4);

  const nearbyHtml = nearby.map(d => `
    <a class="dest-card" href="../destinations/${d.id}.html">
      <div class="dc-media" style="background:${d.gradient};"></div>
      <div class="dc-body"><div class="dc-kicker">${d.country}</div><h3>${d.name}</h3><p>${d.tagline}</p></div>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${dest.name} — MO7LEY Travel</title>
<meta name="description" content="${dest.tagline} — ${dest.blurb}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../shapes.css">
<link rel="stylesheet" href="../loader.css">
<style>
.dest-hero{ min-height:72vh; display:flex; align-items:flex-end; position:relative; padding:0 0 70px;
  background:linear-gradient(180deg, rgba(9,14,17,.2), rgba(9,14,17,.9)), ${dest.gradient}; overflow:hidden; }
.dest-hero .dh-inner{ position:relative; z-index:1; color:#fff; }
.dest-hero h1{ font-size:clamp(2.4rem,6vw,4.2rem); color:#fff; }
.fear-callout{ background:var(--navy); color:#fff; padding:34px 40px; margin:40px 0; position:relative; }
.fear-callout .fc-label{ font-size:.66rem; letter-spacing:.16em; text-transform:uppercase; color:var(--gold); font-weight:700; font-family:"Inter",sans-serif; margin-bottom:10px; }
.fear-callout p{ font-family:"Fraunces",serif; font-style:italic; font-size:1.3rem; color:#fff; margin:0; }
.act-chip-row{ display:flex; gap:10px; flex-wrap:wrap; margin-top:18px; }
.dest-gallery{ display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:140px; gap:10px; }
.dest-gallery .dg-feature{ grid-column:span 2; grid-row:span 2; aspect-ratio:auto !important; }
.charter-callout{ background:var(--sand-2); border:1px solid var(--sand-2); padding:30px 34px; display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; margin-top:40px; }
</style>
</head>
<body data-page="destinations" data-loader="${theme}" data-loader-label="${label}">
<script src="../loader.js"></script>
<div id="scroll-progress"></div>
<div id="nav-slot"></div>

<header class="dest-hero">
  <div class="wrap dh-inner">
    <div class="crumb">${crumbTrail}</div>
    <span class="eyebrow" style="color:var(--gold);">${dest.country}${dest.kind!=="country" ? " · " + dest.continent : ""}</span>
    <h1>${dest.name}</h1>
    <p style="max-width:560px;color:rgba(255,255,255,.85);font-family:'Inter',sans-serif;font-size:1.05rem;">${dest.tagline}</p>
    <div class="act-chip-row">${acts.map(activityChip).join("") || ""}</div>
    <div style="margin-top:22px;">${fearDots(fearScore)}</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:30px;">
      <a href="../contact.html" class="btn btn-coral btn-icon"><svg viewBox="0 0 24 24"><path d="M2 16l7-2 5.5 3L22 14 12 2 9.5 3l4 8.5L7 13.5 4 11l-2 1z"/></svg>Plan A Trip Here</a>
      <a href="../index.html#concierge" class="btn btn-outline">View On The Globe</a>
    </div>
  </div>
</header>

<section class="section-pad">
  <div class="wrap" style="max-width:760px;">
    <p class="reveal" style="font-size:1.1rem;color:var(--navy);">${p1}</p>
    <p class="reveal">${p2}</p>
    <div class="fear-callout reveal shape-a">
      <div class="fc-label">The Fear We Faced Here</div>
      <p>"${fear.charAt(0).toUpperCase()+fear.slice(1)}."</p>
    </div>
    <p class="reveal">${p3}</p>
    ${hasBoat ? `<div class="charter-callout reveal"><div><b style="font-family:'Fraunces',serif;font-style:italic;font-size:1.2rem;color:var(--navy);">We charter boats here, too.</b><p style="margin:6px 0 0;">Fishing, diving, or just a day on the water in ${dest.name}.</p></div><a href="../charters.html" class="btn btn-navy btn-sm">See Charters →</a></div>` : ``}
  </div>
</section>

<section class="section-pad" style="background:var(--sand-2);">
  <div class="wrap">
    <div class="section-head reveal"><span class="eyebrow">The Gallery</span><h2>${dest.name}, as we've seen it.</h2></div>
    <div class="dest-gallery reveal" id="dest-gallery"></div>
  </div>
</section>

${nearby.length ? `
<section class="section-pad">
  <div class="wrap">
    <div class="section-head reveal"><span class="eyebrow">Nearby</span><h2>More of ${dest.continent}.</h2></div>
    <div class="dest-grid reveal" style="display:grid;grid-template-columns:repeat(${nearby.length},1fr);gap:20px;">${nearbyHtml}</div>
  </div>
</section>` : ``}

<section class="section-pad" style="background:var(--navy);text-align:center;">
  <div class="wrap">
    <h2 class="reveal" style="color:#fff;font-style:italic;">Ready to see ${dest.name} for yourself?</h2>
    <a href="../contact.html" class="btn btn-coral reveal">Start Planning →</a>
  </div>
</section>

<div id="footer-slot"></div>
<script src="../data.js"></script>
<script src="../content-helpers.js"></script>
<script src="../shared.js"></script>
<script src="../site-edits.js"></script>
<script src="../editor.js"></script>
<script>
window.PHOTO_LIBRARY = window.PHOTO_LIBRARY || {};
document.getElementById("dest-gallery").innerHTML = (function(){
  var photos = (window.PHOTO_LIBRARY["${dest.id}"]||[]);
  var extra = { 0:"dg-feature shape-b", 4:"shape-a", 8:"shape-c" };
  var html = "";
  for(var i=0;i<12;i++){
    var url = photos[i];
    var cls = "photo-slot" + (extra[i] ? " "+extra[i] : "");
    html += '<div class="'+cls+'" data-loc="${dest.id}" data-idx="'+i+'" data-empty="'+(url?"false":"true")+'">' + (url? '<img src="'+url+'" alt="${dest.name}">':"") + '</div>';
  }
  return html;
})();
document.dispatchEvent(new Event("mo7ley:content-ready"));
</script>
<script src="../curation.js"></script>
</body>
</html>
`;
}

let count = 0;
DESTINATIONS.filter(d => !d.hideCard).forEach(dest => {
  fs.writeFileSync(path.join(OUT_DIR, dest.id + ".html"), page(dest));
  count++;
});
console.log(`Generated ${count} destination pages in /destinations`);
