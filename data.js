/* =========================================================
   MO7LEY TRAVEL — destination + activity + group trip data
   Edit this file to add/remove destinations. Everything on
   the site (globe, sidebar list, cards) is generated from it.
   ========================================================= */

/* Each destination:
   id          unique slug, also used as the folder name for photos
   name        display name
   kind        "country" | "region" (state/province) | "city"
   parent      id of parent in the tree (or null for country-level)
   continent   "North America" | "Europe" | "Asia" | "Oceania"
   country     country display name (for breadcrumb)
   lat, lng    coordinates for the globe dot
   tagline     short punchy line
   blurb       1-3 sentence description, nature/activity focused
   activities  array of activity tags (matches ACTIVITIES ids below)
   gradient    CSS gradient used for placeholder art until real photos are added
*/

const DESTINATIONS = [
  // ---------------- ASIA ----------------
  { id:"maldives", name:"Maldives", kind:"country", parent:null, continent:"Asia", country:"Maldives",
    lat:3.2, lng:73.2, tagline:"Where the ocean shows off",
    blurb:"Manta rays, whale sharks, and reefs so close you can snorkel straight off the beach. This is where MO7LEY's group trips live.",
    activities:["scuba","freedive","boat"], gradient:"linear-gradient(135deg,#0ea5b7,#0a3d62)" },

  { id:"philippines", name:"Philippines", kind:"country", parent:null, continent:"Asia", country:"Philippines",
    lat:10.3, lng:122.9, tagline:"7,000 islands of blue",
    blurb:"Whale sharks in Oslob, tiger sharks in Fuvahmulah-style drift dives, and skydiving over water so blue it looks fake.",
    activities:["scuba","freedive","skydive","boat","surf"], gradient:"linear-gradient(135deg,#12b5c9,#0b4f6c)" },

  { id:"malaysia", name:"Malaysia", kind:"country", parent:null, continent:"Asia", country:"Malaysia",
    lat:4.9, lng:114.9, tagline:"Jungle meets reef",
    blurb:"Borneo rainforest canopies dropping straight into world-class dive sites — rare mix of jungle and reef in one trip.",
    activities:["scuba","mountaineering"], gradient:"linear-gradient(135deg,#1d9a6c,#0b4f6c)" },

  { id:"shanghai", name:"Shanghai", kind:"city", parent:"china", continent:"Asia", country:"China",
    lat:31.23, lng:121.47, tagline:"The other side of the map",
    blurb:"Neon skyline and a totally different pace of life — proof that MO7LEY trips aren't just beaches and mountains.",
    activities:[], gradient:"linear-gradient(135deg,#7c3aed,#1e1b4b)" },
  { id:"china", name:"China", kind:"country", parent:null, continent:"Asia", country:"China",
    lat:31.23, lng:121.47, tagline:"The other side of the map", blurb:"", activities:[], gradient:"linear-gradient(135deg,#7c3aed,#1e1b4b)", hideCard:true },

  // ---------------- OCEANIA ----------------
  { id:"fiji", name:"Fiji", kind:"country", parent:null, continent:"Oceania", country:"Fiji",
    lat:-17.7, lng:178.0, tagline:"Soft coral capital of the world",
    blurb:"Warm water, walls of soft coral in every color, and some of the friendliest people on earth.",
    activities:["scuba","freedive","boat","surf"], gradient:"linear-gradient(135deg,#06b6d4,#0e7490)" },

  // ---------------- EUROPE ----------------
  { id:"germany", name:"Germany", kind:"country", parent:null, continent:"Europe", country:"Germany",
    lat:48.14, lng:11.58, tagline:"Home base",
    blurb:"Bavarian mountains, lake towns, and the launchpad for most of our European trips.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#334155,#0f172a)" },

  { id:"austria", name:"Austria", kind:"country", parent:null, continent:"Europe", country:"Austria",
    lat:47.26, lng:11.39, tagline:"Alps without the crowds",
    blurb:"Alpine ridgelines, glacier lakes, and trailheads that start right outside quiet mountain towns.",
    activities:["mountaineering","skydive"], gradient:"linear-gradient(135deg,#475569,#1e293b)" },

  { id:"switzerland", name:"Switzerland", kind:"country", parent:null, continent:"Europe", country:"Switzerland",
    lat:46.68, lng:7.87, tagline:"Vertical paradise",
    blurb:"Base jumping and skydiving over the Alps, glacier hikes, and views that don't feel real until you're standing in them.",
    activities:["mountaineering","skydive"], gradient:"linear-gradient(135deg,#60a5fa,#1e3a8a)" },

  { id:"croatia", name:"Croatia", kind:"country", parent:null, continent:"Europe", country:"Croatia",
    lat:42.65, lng:18.09, tagline:"Adriatic blue",
    blurb:"Cliff jumping, island-hopping by boat, and coastal towns built into limestone cliffs.",
    activities:["boat","freedive","surf"], gradient:"linear-gradient(135deg,#2563eb,#172554)" },

  { id:"slovenia", name:"Slovenia", kind:"country", parent:null, continent:"Europe", country:"Slovenia",
    lat:46.36, lng:14.09, tagline:"Europe's best-kept secret",
    blurb:"Emerald rivers, Lake Bled, and mountain trails minutes from turquoise water.",
    activities:["mountaineering","freedive"], gradient:"linear-gradient(135deg,#16a34a,#052e16)" },

  { id:"italy", name:"Italy", kind:"country", parent:null, continent:"Europe", country:"Italy",
    lat:46.4, lng:11.8, tagline:"Dolomites to the coast",
    blurb:"Jagged Dolomite peaks, coastal cliff towns, and some of the best mountain-to-sea contrast in Europe.",
    activities:["mountaineering","boat"], gradient:"linear-gradient(135deg,#f97316,#7c2d12)" },

  { id:"france", name:"France", kind:"country", parent:null, continent:"Europe", country:"France",
    lat:45.92, lng:6.87, tagline:"Chamonix and beyond",
    blurb:"Mont Blanc massif mountaineering, paragliding launches, and alpine towns built for adventure.",
    activities:["mountaineering","skydive"], gradient:"linear-gradient(135deg,#64748b,#0f172a)" },

  { id:"belarus", name:"Belarus", kind:"country", parent:null, continent:"Europe", country:"Belarus",
    lat:53.9, lng:27.57, tagline:"Roots trip",
    blurb:"Forests, lakes, and a slower pace — a personal favorite off the beaten path.",
    activities:[], gradient:"linear-gradient(135deg,#84cc16,#365314)" },

  // ---------------- NORTH AMERICA : USA ----------------
  { id:"usa", name:"USA", kind:"country", parent:null, continent:"North America", country:"USA",
    lat:39.5, lng:-98.35, tagline:"Home turf", blurb:"", activities:[], gradient:"linear-gradient(135deg,#1d4ed8,#111827)", hideCard:true },

  { id:"oregon", name:"Oregon", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:43.8, lng:-120.5, tagline:"Waterfalls and volcanic coast",
    blurb:"Crater Lake, the Columbia River Gorge, and a coastline made for storm-watching and hiking.",
    activities:["mountaineering","surf"], gradient:"linear-gradient(135deg,#059669,#022c22)" },

  { id:"california-socal", name:"California — SoCal", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:34.02, lng:-118.28, tagline:"Desert, surf, and Whitney",
    blurb:"Mt. Whitney summit hikes, Joshua Tree, and world-class surf breaks all within a few hours of each other.",
    activities:["mountaineering","surf","skydive"], gradient:"linear-gradient(135deg,#f59e0b,#78350f)" },

  { id:"california-norcal", name:"California — NorCal", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:37.77, lng:-122.42, tagline:"Redwoods and Yosemite granite",
    blurb:"Yosemite big walls, redwood forests, and rugged Pacific coastline.",
    activities:["mountaineering","surf"], gradient:"linear-gradient(135deg,#15803d,#052e16)" },

  { id:"washington", name:"Washington", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:47.4, lng:-121.5, tagline:"Volcanoes and evergreen",
    blurb:"Mt. Rainier, the North Cascades, and endless alpine lakes.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#0f766e,#042f2e)" },

  { id:"montana", name:"Montana", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:46.9, lng:-110.4, tagline:"Big Sky backcountry",
    blurb:"Glacier National Park ridgelines and wide-open wilderness.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#334155,#0f172a)" },

  { id:"hawaii-kauai", name:"Hawaii — Kauai", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:22.09, lng:-159.5, tagline:"The Garden Isle",
    blurb:"Na Pali Coast from the air and the water, jungle hikes, and the most dramatic coastline in the Pacific.",
    activities:["scuba","freedive","surf","skydive"], gradient:"linear-gradient(135deg,#10b981,#064e3b)" },

  { id:"hawaii-maui", name:"Hawaii — Maui", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:20.8, lng:-156.3, tagline:"Volcano to reef",
    blurb:"Haleakala sunrise, Road to Hana, and reef dives right off the coast.",
    activities:["scuba","freedive","boat"], gradient:"linear-gradient(135deg,#0891b2,#0c4a6e)" },

  { id:"hawaii-oahu", name:"Hawaii — Oahu", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:21.45, lng:-158.0, tagline:"North Shore energy",
    blurb:"Big wave surf culture, tiger shark dives, and skydiving over turquoise reefs.",
    activities:["surf","scuba","skydive","boat"], gradient:"linear-gradient(135deg,#0ea5e9,#0c4a6e)" },

  { id:"nevada", name:"Nevada", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:39.5, lng:-116.9, tagline:"Desert extremes",
    blurb:"Red rock canyons and wide-open desert flying and jumping terrain.",
    activities:["skydive","mountaineering"], gradient:"linear-gradient(135deg,#b45309,#451a03)" },

  { id:"utah", name:"Utah", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:38.57, lng:-109.55, tagline:"Canyon country",
    blurb:"Moab slickrock, national park canyons, and some of the best desert light anywhere.",
    activities:["mountaineering","skydive"], gradient:"linear-gradient(135deg,#dc2626,#450a0a)" },

  { id:"arizona", name:"Arizona", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:34.87, lng:-111.76, tagline:"Sedona red rock",
    blurb:"Red rock hiking, Grand Canyon rim to river, and sunsets that don't quit.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#ea580c,#431407)" },

  { id:"colorado", name:"Colorado", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:39.1, lng:-105.3, tagline:"14ers and powder",
    blurb:"Fourteener summits and Rocky Mountain backcountry.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#0369a1,#082f49)" },

  { id:"idaho", name:"Idaho", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:44.2, lng:-114.7, tagline:"Untouched wilderness",
    blurb:"Sawtooth Mountains and some of the least-crowded backcountry in the Lower 48.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#166534,#052e16)" },

  { id:"wyoming", name:"Wyoming", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:43.48, lng:-110.76, tagline:"Tetons and Yellowstone",
    blurb:"Grand Teton alpine routes and Yellowstone backcountry.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#57534e,#1c1917)" },

  { id:"new-york", name:"New York", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:40.71, lng:-74.0, tagline:"City energy",
    blurb:"The Adirondacks upstate and the city itself — the full range in one state.",
    activities:[], gradient:"linear-gradient(135deg,#475569,#0f172a)" },

  { id:"florida", name:"Florida", kind:"region", parent:"usa", continent:"North America", country:"USA",
    lat:24.55, lng:-81.78, tagline:"Keys and reef",
    blurb:"Reef diving and wreck diving down the Keys, plus offshore fishing charters.",
    activities:["scuba","boat","freedive"], gradient:"linear-gradient(135deg,#0d9488,#134e4a)" },

  // ---------------- NORTH AMERICA : CANADA ----------------
  { id:"canada", name:"Canada", kind:"country", parent:null, continent:"North America", country:"Canada",
    lat:56.1, lng:-106.3, tagline:"Rockies and coast", blurb:"", activities:[], gradient:"linear-gradient(135deg,#dc2626,#1c1917)", hideCard:true },

  { id:"banff", name:"Banff", kind:"city", parent:"canada", continent:"North America", country:"Canada",
    lat:51.18, lng:-115.57, tagline:"Turquoise lakes, jagged peaks",
    blurb:"Glacier-fed lakes and some of the most photogenic mountaineering terrain on the continent.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#0284c7,#0c4a6e)" },

  { id:"jasper", name:"Jasper", kind:"city", parent:"canada", continent:"North America", country:"Canada",
    lat:52.87, lng:-118.08, tagline:"Wild and remote Rockies",
    blurb:"Quieter and wilder than Banff — huge skies and untouched backcountry.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#0e7490,#083344)" },

  { id:"vancouver", name:"Vancouver", kind:"city", parent:"canada", continent:"North America", country:"Canada",
    lat:49.28, lng:-123.12, tagline:"Mountains meet ocean",
    blurb:"City living with alpine terrain and the Pacific both minutes away.",
    activities:["mountaineering","boat"], gradient:"linear-gradient(135deg,#059669,#022c22)" },

  { id:"calgary", name:"Calgary", kind:"city", parent:"canada", continent:"North America", country:"Canada",
    lat:51.05, lng:-114.07, tagline:"Gateway to the Rockies",
    blurb:"The launchpad for Banff and Jasper trips.",
    activities:["mountaineering"], gradient:"linear-gradient(135deg,#78716c,#1c1917)" },

  // ---------------- NORTH AMERICA : MEXICO ----------------
  { id:"mexico", name:"Mexico", kind:"country", parent:null, continent:"North America", country:"Mexico",
    lat:23.6, lng:-102.5, tagline:"Reef, cenotes, and waves", blurb:"", activities:[], gradient:"linear-gradient(135deg,#16a34a,#052e16)", hideCard:true },

  { id:"cancun", name:"Cancun", kind:"city", parent:"mexico", continent:"North America", country:"Mexico",
    lat:21.16, lng:-86.85, tagline:"Cenotes and reef",
    blurb:"Underwater cave diving in cenotes and the Mesoamerican Reef just offshore.",
    activities:["scuba","freedive","boat"], gradient:"linear-gradient(135deg,#0ea5b7,#0c4a6e)" },

  { id:"puerto-vallarta", name:"Puerto Vallarta", kind:"city", parent:"mexico", continent:"North America", country:"Mexico",
    lat:20.65, lng:-105.23, tagline:"Pacific charters",
    blurb:"Humpback whales in season, big-game fishing charters, and jungle-backed beaches.",
    activities:["boat","surf"], gradient:"linear-gradient(135deg,#f97316,#7c2d12)" },

  { id:"cabo", name:"Cabo", kind:"city", parent:"mexico", continent:"North America", country:"Mexico",
    lat:22.89, lng:-109.91, tagline:"Where the sea meets the desert",
    blurb:"Marlin fishing charters, sea lion dives, and dramatic desert-meets-ocean scenery.",
    activities:["boat","scuba","surf"], gradient:"linear-gradient(135deg,#f59e0b,#78350f)" },
];

/* Group trips MO7LEY currently runs (public departures, book a spot) */
const GROUP_TRIPS = [
  {
    id: "maldives-group",
    destinationId: "maldives",
    name: "Maldives Group Trip",
    tagline: "Swim with manta rays and whale sharks, live on a boat, sleep under the stars.",
    description: "Our flagship group trip. Small crew, liveaboard-style days on the water, reef and drift diving, and open-ocean snorkels with manta rays and whale sharks. This is the trip that started MO7LEY — we've spent enough time in the Maldives to know exactly where to be and when.",
    highlights: ["Manta ray & whale shark snorkels", "Reef + drift diving", "Sandbank sunsets", "Small group, big adventure"]
  }
];

/* Activity categories shown in the "Activity Trips" section */
const ACTIVITIES = [
  { id:"scuba", name:"Scuba Diving", icon:"🤿",
    blurb:"Reef, wreck, and drift dives in the best visibility water on earth — from manta cleaning stations to cave systems." },
  { id:"freedive", name:"Free Diving", icon:"🫧",
    blurb:"Breath-hold diving with mantas, reef sharks, and bait balls — no bubbles, no noise, just you and the ocean." },
  { id:"skydive", name:"Skydiving", icon:"🪂",
    blurb:"Jump over reefs, deserts, and the Alps. If there's a view worth falling toward, we've probably jumped it." },
  { id:"mountaineering", name:"Mountaineering & Hiking", icon:"⛰️",
    blurb:"Summit pushes, alpine ridgelines, and multi-day treks — from Mt. Whitney to the Dolomites." },
  { id:"surf", name:"Surf Trips", icon:"🏄", blurb:"Chasing swell from the North Shore to the Pacific coast." },
  { id:"boat", name:"Boat Charters", icon:"⛵",
    blurb:"Private charters anywhere in the world — fishing, diving, island-hopping, or just getting out on the water." },
];

/* Node export (used by generate-destinations.js) — no-op in the browser */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DESTINATIONS, GROUP_TRIPS, ACTIVITIES };
}
