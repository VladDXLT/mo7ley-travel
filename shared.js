/* =========================================================
   MO7LEY TRAVEL — shared chrome: nav/footer injection,
   scroll progress, reveal-on-scroll, mobile menu.
   Include on every page, after loader.js.
   ========================================================= */

/* Nav + footer live here (edit once, shows on every page). __R__ = path back to site root. */
var MO7_NAV = "<nav id=\"site-nav\">\n  <a href=\"__R__index.html\" class=\"logo\" data-home>MO7LEY <span>TRAVEL</span></a>\n  <div class=\"nav-links\" id=\"nav-links\">\n    <a href=\"__R__about.html\" data-nav=\"about\">Our Story</a>\n    <a href=\"__R__group-trips.html\" data-nav=\"group-trips\">Group Trips</a>\n    <a href=\"__R__destinations.html\" data-nav=\"destinations\">Destinations</a>\n    <a href=\"__R__activities.html\" data-nav=\"activities\">Activity Trips</a>\n    <a href=\"__R__charters.html\" data-nav=\"charters\">Boat Charters</a>\n    <a href=\"__R__journal.html\" data-nav=\"journal\">Journal</a>\n    <a href=\"__R__contact.html\" class=\"btn btn-coral btn-sm\" data-nav=\"contact\">Plan My Trip</a>\n  </div>\n  <button class=\"nav-toggle\" id=\"nav-toggle\" aria-label=\"Menu\">\u2630</button>\n</nav>\n";
var MO7_FOOTER = "<footer>\n  <div class=\"wrap\">\n    <div class=\"foot-grid\">\n      <div>\n        <a href=\"__R__index.html\" class=\"foot-logo\" data-home style=\"display:inline-block;text-decoration:none;\">MO7LEY TRAVEL</a>\n        <p style=\"max-width:280px;margin-top:10px;color:rgba(255,255,255,.5);font-size:.82rem;\">Trips to the places we've actually been. Run by someone who'd rather be outside.</p>\n      </div>\n      <div class=\"foot-links\">\n        <a href=\"__R__about.html\">Our Story</a>\n        <a href=\"__R__group-trips.html\">Group Trips</a>\n        <a href=\"__R__destinations.html\">Destinations</a>\n        <a href=\"__R__activities.html\">Activity Trips</a>\n        <a href=\"__R__charters.html\">Boat Charters</a>\n        <a href=\"__R__journal.html\">Journal</a>\n        <a href=\"__R__faq.html\">FAQ</a>\n        <a href=\"__R__contact.html\">Contact</a>\n      </div>\n      <div class=\"foot-links\">\n        <a href=\"https://www.instagram.com/vladivanenko_/\" target=\"_blank\" rel=\"noopener\">@vladivanenko_</a>\n        <a href=\"mailto:hello@mo7leytravel.com\">hello@mo7leytravel.com</a>\n      </div>\n    </div>\n    <div class=\"foot-bottom\">\u00a9 <span id=\"year\"></span> MO7LEY Travel. Run by someone who'd rather be outside.</div>\n  </div>\n</footer>\n";

/* Logo (top-left and footer) always takes you to the very top of the home page */
document.addEventListener("click", function(e){
  var a = e.target.closest && e.target.closest("a[data-home]");
  if(!a) return;
  if(document.documentElement.classList.contains("ed-on")){ e.preventDefault(); return; }   // editing: don't navigate
  var onHome = !window.MO7_ROOT && /(^|\/)(index\.html)?$/.test(location.pathname);
  if(onHome){
    e.preventDefault();
    window.scrollTo({top:0, behavior:"smooth"});
    if(location.hash) history.replaceState(null, "", location.pathname + location.search);
  }
});

function mo7leyInitChrome(){
  var navSlot = document.getElementById("nav-slot");
  var footSlot = document.getElementById("footer-slot");
  var R = window.MO7_ROOT || "";
  if(navSlot) navSlot.innerHTML = MO7_NAV.split("__R__").join(R);
  if(footSlot) footSlot.innerHTML = MO7_FOOTER.split("__R__").join(R);

  Promise.resolve().then(()=>{
    var year = document.getElementById("year");
    if(year) year.textContent = new Date().getFullYear();

    var current = document.body.getAttribute("data-page");
    document.querySelectorAll("[data-nav]").forEach(a=>{
      if(a.getAttribute("data-nav") === current) a.classList.add("nav-active");
    });

    var nav = document.getElementById("site-nav");
    if(nav){
      var forceSolid = document.body.hasAttribute("data-nav-solid");
      window.addEventListener("scroll", ()=> nav.classList.toggle("scrolled", forceSolid || window.scrollY > 40));
      if(forceSolid || window.scrollY > 40) nav.classList.add("scrolled");
    }
    var navToggle = document.getElementById("nav-toggle");
    var navLinks = document.getElementById("nav-links");
    if(navToggle && navLinks){
      navToggle.addEventListener("click", ()=> navLinks.classList.toggle("open"));
      navLinks.querySelectorAll("a").forEach(a=>a.addEventListener("click", ()=>navLinks.classList.remove("open")));
    }
    document.dispatchEvent(new Event("mo7ley:chrome-ready"));
  });

  // scroll progress bar
  var bar = document.getElementById("scroll-progress");
  if(bar){
    window.addEventListener("scroll", ()=>{
      var h = document.documentElement;
      var pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
      bar.style.width = (isFinite(pct)?pct:0) + "%";
    });
  }

  // reveal-on-scroll (works for elements present now AND injected later)
  var io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("in"); });
  },{threshold:.12});
  function observeAll(){ document.querySelectorAll(".reveal:not(.in)").forEach(el=>io.observe(el)); }
  observeAll();
  document.addEventListener("mo7ley:content-ready", observeAll);
}

if(document.getElementById("nav-slot") === null && document.getElementById("footer-slot") === null){
  // pages that still embed nav/footer directly (legacy) — just wire behavior
  document.addEventListener("DOMContentLoaded", mo7leyInitChrome);
} else if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", mo7leyInitChrome);
} else {
  mo7leyInitChrome();
}
