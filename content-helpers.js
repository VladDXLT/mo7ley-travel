/* =========================================================
   MO7LEY TRAVEL — shared content generator
   Works in the browser (window.MO7LEY_CONTENT) AND in Node
   (require) so the destination-page generator and the live
   globe popup produce identical copy from one source.
   Placeholder, on-brand copy — Vlad edit later.
   ========================================================= */
(function(root){

  var ACTIVITY_PHRASES = {
    scuba: {
      does: ["dropping below the surface on reef and wall dives", "spending long tank-time on reef and drift dives"],
      fear: ["the first backward roll off the boat into open water", "trusting your gear on the first deep wall dive"]
    },
    freedive: {
      does: ["holding a single breath down past the reef line", "going quiet underwater on nothing but one lungful of air"],
      fear: ["letting go of the surface with no tank on your back", "the moment your body wants air and the surface is still far up"]
    },
    skydive: {
      does: ["jumping from altitude and watching the ground arrive", "getting in the door and stepping into open air"],
      fear: ["the ten seconds after the door opens", "the freefall before the canopy opens"]
    },
    mountaineering: {
      does: ["pushing for a summit most people only see in photos", "putting in long days on exposed ridgelines"],
      fear: ["the exposed section where turning back stops being an option", "the final push when the air gets thin and the legs get heavy"]
    },
    surf: {
      does: ["paddling into swell that's bigger than it looked from the beach", "chasing a break most people just watch from the sand"],
      fear: ["the hold-down after a wave you misjudged", "paddling out past a lineup that's clearly out of your depth"]
    },
    boat: {
      does: ["spending full days out on the water, wherever the charter goes", "getting comfortable a long way from land"],
      fear: ["losing sight of the coastline", "trusting open water further out than feels comfortable"]
    }
  };
  var GENERIC_FEAR = ["showing up somewhere with no real plan and figuring it out", "being the least experienced person in the group and going anyway", "doing the thing you'd normally talk yourself out of"];

  function hashPick(id, arr){
    var h = 0;
    for(var i=0;i<id.length;i++) h += id.charCodeAt(i);
    return arr[h % arr.length];
  }

  function fearLine(dest){
    var act = (dest.activities||[])[0];
    if(act && ACTIVITY_PHRASES[act]) return hashPick(dest.id, ACTIVITY_PHRASES[act].fear);
    return hashPick(dest.id, GENERIC_FEAR);
  }

  function paragraphs(dest, ACTIVITIES){
    var p1 = dest.blurb || "";
    var act = (dest.activities||[])[0];
    var actName = function(id){ var a=(ACTIVITIES||[]).find(function(x){return x.id===id;}); return a?a.name.toLowerCase():id; };
    var p2;
    if(act && ACTIVITY_PHRASES[act]){
      p2 = "Here, that means " + hashPick(dest.id, ACTIVITY_PHRASES[act].does) + ".";
      if((dest.activities||[]).length > 1){
        p2 += " Most trips also leave room for " + actName(dest.activities[1]) + (dest.activities[2] ? " and " + actName(dest.activities[2]) : "") + ".";
      }
    } else {
      p2 = "This one is less about a single activity and more about the pace of the place — slowing down enough to actually be somewhere, not just pass through it.";
    }
    var locWord = dest.kind === "country" ? dest.country : (dest.country + ", specifically " + dest.name);
    var p3 = dest.name + " is exactly why MO7LEY exists — we don't send anyone somewhere we've only seen in photos. We've spent real time in " + locWord + ", and every experience we build here comes from that time on the ground (or underwater).";
    return [p1, p2, p3];
  }

  function fearMeter(dest){
    var weights = { skydive:5, mountaineering:4, freedive:4, scuba:3, surf:3, boat:2 };
    var score = 1;
    (dest.activities||[]).forEach(function(a){ score = Math.max(score, weights[a]||1); });
    return score; // 1-5
  }

  /* pick a loader theme for this destination: plane | boat | mountain | compass */
  function loaderTheme(dest){
    var acts = dest.activities || [];
    if(acts.indexOf("mountaineering") !== -1) return "mountain";
    if(acts.indexOf("boat") !== -1 || acts.indexOf("scuba") !== -1 || acts.indexOf("freedive") !== -1) return "boat";
    if(dest.continent === "Asia" || dest.continent === "Oceania") return "plane";
    return "compass";
  }

  var api = { fearLine: fearLine, paragraphs: paragraphs, fearMeter: fearMeter, loaderTheme: loaderTheme, hashPick: hashPick };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.MO7LEY_CONTENT = api;

})(typeof window !== "undefined" ? window : globalThis);
