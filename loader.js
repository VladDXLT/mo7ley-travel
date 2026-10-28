window.MO7_ROOT = /\/destinations\/[^\/]*$/.test(location.pathname) ? "../" : "";
/* =========================================================
   MO7LEY TRAVEL — page loader controller
   Reads body[data-loader] ("plane" | "boat" | "mountain" | "compass")
   and injects the matching scene, then fades the overlay out.
   ========================================================= */
(function(){
  var SCENES = {
    plane: function(){
      return '<div class="path-line"></div><div class="plane-icon"><svg viewBox="0 0 24 24"><path d="M2 16l7-2 5.5 3L22 14 12 2 9.5 3l4 8.5L7 13.5 4 11l-2 1z"/></svg></div>';
    },
    boat: function(){
      return '<div class="wave-line"><svg viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 8 2 16 10 T 32 10 T 48 10 T 64 10 T 80 10 T 100 10"/></svg></div>'
        + '<div class="boat-icon"><svg viewBox="0 0 24 24"><path d="M12 2l1 9h6l-2 3H7l-2-3h6l1-9z"/><path d="M4 17l8 3 8-3-2 4H6l-2-4z"/></svg></div>';
    },
    mountain: function(){
      return '<div class="mtn-icon"><svg viewBox="0 0 280 100">'
        + '<path class="mtn-path" d="M10 90 L80 25 L120 60 L165 15 L270 90 Z" />'
        + '<g class="mtn-flag" transform="translate(158,8)"><line x1="0" y1="0" x2="0" y2="14" stroke="#c3a15a" stroke-width="1.5"/><path d="M0 0 L10 3 L0 6 Z" fill="#a8502e"/></g>'
        + '</svg></div>';
    },
    compass: function(){
      return '<div class="compass-icon"><svg viewBox="0 0 64 64">'
        + '<circle class="compass-ring" cx="32" cy="32" r="26"/>'
        + '<g class="compass-tick">'
        + '<line x1="32" y1="6" x2="32" y2="12"/><line x1="32" y1="52" x2="32" y2="58"/>'
        + '<line x1="6" y1="32" x2="12" y2="32"/><line x1="52" y1="32" x2="58" y2="32"/>'
        + '</g>'
        + '<line class="compass-needle" x1="32" y1="32" x2="32" y2="12"/>'
        + '</svg></div>';
    }
  };

  function init(){
    var body = document.body;
    var theme = body.getAttribute("data-loader") || "compass";
    var overlay = document.createElement("div");
    overlay.id = "page-loader";
    overlay.innerHTML =
      '<div class="loader-stage">' + (SCENES[theme] ? SCENES[theme]() : SCENES.compass()) + '</div>'
      + '<div class="loader-word">MO7LEY</div>'
      + '<div class="loader-sub">' + (body.getAttribute("data-loader-label") || "loading the map") + '</div>';
    document.body.appendChild(overlay);

    var minShow = 700;
    var start = Date.now();
    function hide(){
      var elapsed = Date.now() - start;
      var wait = Math.max(0, minShow - elapsed);
      setTimeout(function(){
        overlay.classList.add("hide");
        setTimeout(function(){ overlay.remove(); }, 550);
      }, wait);
    }
    if(document.readyState === "complete") hide();
    else window.addEventListener("load", hide);
    // safety: never block the page for more than 3.5s
    setTimeout(hide, 3500);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
