/* =========================================================
   MO7LEY TRAVEL — page editor
   ---------------------------------------------------------
   Two jobs in one file:

   1. RUNTIME (every visitor, every page): reads site-edits.js and
      re-applies your saved text / style / image / video changes on top
      of the page. This is why edits survive and show up everywhere —
      double-clicking index.html, localhost, or the live site.

   2. EDITOR (only when you launch the site with Start-MO7LEY.command):
      a floating "Edit" button turns the page into an editable canvas —
      click any text to type, format it, resize boxes, drop in images and
      videos. Everything auto-saves to site-edits.js + assets/uploads/.
      Visitors never see the editor (it needs the local save server).
   ========================================================= */
(function(){
'use strict';

var ROOT = window.MO7_ROOT || '';
var PAGE = (function(){
  var p = location.pathname.split('/').pop() || 'index.html';
  return (ROOT ? 'destinations/' : '') + p;
})();
var DATA = (window.MO7_EDITS && window.MO7_EDITS.pages) || {};
var ORIG = {};            // original html/style per element path (for "Reset")
var editing = false;
var applying = false;

/* things that are never editable (data-driven or tool UI) */
var EXCLUDE = '#ed-bar,#ed-media,#ed-sel,#ed-toggle,#ed-toast,#curation-root,#studio-toggle,#dest-list,#globe-stage,#dest-panel,#scroll-progress,#stat-countries,.loader,.page-loader,#mo7-loader,script,style,svg,iframe,canvas,select,option,textarea,input,button,[data-ed="off"],.fear-meter';
/* places an image or video can be dropped */
var SLOT_SEL = '.photo-slot,.about-visual,.trip-media,.fd-photo,.dc-media,#hero,.page-hero,.dest-hero';
var INLINE = {A:1,B:1,I:1,EM:1,STRONG:1,U:1,S:1,SPAN:1,BR:1,SMALL:1,SUP:1,SUB:1,MARK:1,CODE:1,SVG:1,IMG:1,FONT:1,STRIKE:1,DEL:1,INS:1,ABBR:1,TIME:1,PATH:1};

function $(s,r){ return (r||document).querySelector(s); }
function $$(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function keyOf(el){ return el.closest && el.closest('#nav-slot,#footer-slot') ? '_shared' : PAGE; }
function pathOf(el){
  var parts = [];
  while(el && el !== document.body && el.nodeType === 1){
    if(el.id && /^[A-Za-z][\w-]*$/.test(el.id)){ parts.unshift('#'+el.id); return parts.join(' > '); }
    var n = 1, s = el;
    while((s = s.previousElementSibling)) if(s.tagName === el.tagName) n++;
    parts.unshift(el.tagName.toLowerCase()+':nth-of-type('+n+')');
    el = el.parentElement;
  }
  return 'body > ' + parts.join(' > ');
}
function mediaHost(slot){ return slot && slot.id === 'hero' ? ($('#hero-media') || slot) : slot; }

/* ---------- runtime: apply saved edits ---------- */
function ensureOrig(el, path, withHtml){
  var o = ORIG[path] || (ORIG[path] = { html: null, style: el.getAttribute('style') });
  if(withHtml && o.html == null) o.html = el.innerHTML;       // only text blocks keep their markup
}
function applyMedia(host, m){
  $$(':scope > .ed-media', host).forEach(function(n){ n.remove(); });
  host.classList.remove('ed-has-media');
  if(!m || !m.src) return;
  var el;
  if(m.type === 'video'){
    el = document.createElement('video');
    el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true; el.setAttribute('muted','');
    el.setAttribute('playsinline',''); el.setAttribute('loop',''); el.setAttribute('autoplay','');
    el.preload = 'auto';
  } else {
    el = document.createElement('img'); el.alt = '';
  }
  el.className = 'ed-media';
  el.src = (/^(https?:|data:|blob:)/.test(m.src) ? '' : ROOT) + m.src;
  host.insertBefore(el, host.firstChild);
  host.classList.add('ed-has-media');
  if(getComputedStyle(host).position === 'static') host.style.position = 'relative';
  if(host.dataset && host.dataset.empty) host.dataset.empty = 'false';
  if(el.tagName === 'VIDEO'){ var p = el.play(); if(p && p.catch) p.catch(function(){}); }
}
function applyEntry(el, path, e){
  ensureOrig(el, path, e.html != null);
  if(e.html != null && el.innerHTML !== e.html) el.innerHTML = e.html;
  if(e.style != null){
    if(e.style){ if(el.getAttribute('style') !== e.style) el.setAttribute('style', e.style); }
    else if(el.hasAttribute('style')) el.removeAttribute('style');
  }
  if('media' in e){
    var cur = $(':scope > .ed-media', el);
    var want = e.media && e.media.src;
    if(!(cur && want && cur.getAttribute('src') && cur.getAttribute('src').indexOf(e.media.src) !== -1)) applyMedia(el, e.media);
  }
}
var obs = null, obsTimer = null;
function applyAll(){
  if(editing) return;
  applying = true;
  if(obs) obs.disconnect();
  ['_shared', PAGE].forEach(function(k){
    var m = DATA[k]; if(!m) return;
    Object.keys(m).forEach(function(p){
      var el; try{ el = document.querySelector(p); }catch(_){ return; }
      if(el) applyEntry(el, p, m[p]);
    });
  });
  applying = false;
  if(obs) obs.observe(document.body, {childList:true, subtree:true});
}
function startRuntime(){
  applyAll();
  document.addEventListener('mo7ley:content-ready', applyAll);
  document.addEventListener('mo7ley:chrome-ready', applyAll);
  window.addEventListener('load', applyAll);
  var IGNORE = '#globe-stage,#dest-list,#dest-panel,#ed-bar,#ed-media,#ed-sel,#ed-toast,#ed-toggle';
  obs = new MutationObserver(function(muts){
    if(applying || editing) return;
    var relevant = muts.some(function(m){
      var t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      return !(t && t.closest && t.closest(IGNORE));
    });
    if(!relevant) return;
    clearTimeout(obsTimer); obsTimer = setTimeout(applyAll, 250);   // re-apply if the page re-renders a section (e.g. the hero slideshow)
  });
  obs.observe(document.body, {childList:true, subtree:true});
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startRuntime);
else startRuntime();

/* ---------- is the save server running? then offer the editor ---------- */
function api(path, opts){
  opts = opts || {};
  opts.headers = Object.assign({'X-MO7-Editor':'1'}, opts.headers || {});
  return fetch(path, opts).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); });
}
if(/^https?:$/.test(location.protocol)){
  var boot = function(){ api('/__api/ping').then(function(j){ if(j && j.ok) initEditor(); }).catch(function(){}); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
}

/* =========================================================
   EDITOR UI
   ========================================================= */
function initEditor(){
  document.documentElement.classList.add('ed-available');

  var css = document.createElement('style');
  css.textContent = [
  '.ed-media{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;border-radius:inherit;pointer-events:none}',
  '.ed-has-media{isolation:isolate}',
  '.page-hero>.ed-media,.dest-hero>.ed-media{filter:brightness(.6) saturate(1.05)}',
  '.ed-has-media>img:not(.ed-media),.ed-has-media>.slide{display:none!important}',
  'html.ed-available #studio-toggle{display:none!important}',
  '#ed-toggle{position:fixed;right:20px;bottom:20px;z-index:2147483000;font:600 .82rem/1 Inter,system-ui,sans-serif;letter-spacing:.04em;background:#c3a15a;color:#111b22;border:0;border-radius:999px;padding:14px 20px;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.35)}',
  '#ed-toggle:hover{background:#d4b46c}',
  'html.ed-on #ed-toggle{background:#111b22;color:#fff;box-shadow:0 0 0 1px rgba(195,161,90,.6),0 10px 30px rgba(0,0,0,.35)}',
  '#ed-bar{position:fixed;left:50%;bottom:78px;transform:translateX(-50%);z-index:2147482999;display:none;flex-wrap:wrap;gap:6px 4px;align-items:center;justify-content:center;max-width:calc(100vw - 24px);background:rgba(17,27,34,.96);backdrop-filter:blur(10px);border:1px solid rgba(195,161,90,.35);border-radius:16px;padding:8px 10px;box-shadow:0 18px 50px rgba(0,0,0,.45);font:500 .78rem/1 Inter,system-ui,sans-serif;color:#fff;user-select:none}',
  'html.ed-on #ed-bar{display:flex}',
  '#ed-bar.top{bottom:auto;top:92px}',
  '#ed-bar .g{display:flex;align-items:center;gap:2px;padding:0 6px;border-right:1px solid rgba(255,255,255,.14)}',
  '#ed-bar .g:last-child{border-right:0}',
  '#ed-bar button{all:unset;box-sizing:border-box;min-width:32px;height:32px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;gap:5px;border-radius:8px;cursor:pointer;color:#fff;font:600 .78rem/1 Inter,system-ui,sans-serif;white-space:nowrap}',
  '#ed-bar button:hover{background:rgba(255,255,255,.12)}',
  '#ed-bar button.on{background:#c3a15a;color:#111b22}',
  '#ed-bar button[disabled]{opacity:.3;pointer-events:none}',
  '#ed-bar svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round}',
  '#ed-bar input[type=number]{width:48px;height:30px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:7px;color:#fff;text-align:center;font:600 .78rem Inter,sans-serif}',
  '#ed-bar input[type=color]{width:30px;height:30px;padding:0;border:0;background:none;cursor:pointer}',
  '#ed-bar .lbl{font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.5);padding:0 4px 0 2px}',
  '#ed-status{font-size:.72rem;color:rgba(255,255,255,.65);padding:0 8px;min-width:96px;text-align:center}',
  '#ed-status.err{color:#ff8a70}',
  'html.ed-on [data-ed-text]{outline:1px dashed rgba(195,161,90,0);outline-offset:3px;cursor:text;transition:outline-color .15s}',
  'html.ed-on [data-ed-text]:hover{outline-color:rgba(195,161,90,.75)}',
  'html.ed-on [data-ed-text]:focus{outline:2px solid #c3a15a}',
  'html.ed-on [data-ed-slot]{outline:2px dashed rgba(195,161,90,.7);outline-offset:-4px}',
  'html.ed-on [data-ed-slot].ed-drop{outline:3px solid #ff6b4a;outline-offset:-4px}',
  'html.ed-on .reveal{opacity:1!important;transform:none!important}',
  'html.ed-on *::before,html.ed-on *::after{pointer-events:none!important}',
  'html.ed-on .hero-scrim{pointer-events:none!important}',
  'html.ed-on #site-nav a,html.ed-on footer a{pointer-events:auto}',
  '#ed-sel{position:fixed;z-index:2147482990;pointer-events:none;border:2px solid #4cc9f0;display:none}',
  '#ed-sel .chip{position:absolute;left:-2px;top:-22px;background:#4cc9f0;color:#06222b;font:700 .64rem/1 Inter,sans-serif;padding:4px 7px;border-radius:5px 5px 5px 0;white-space:nowrap;letter-spacing:.03em}',
  '#ed-sel i{position:absolute;width:12px;height:12px;background:#fff;border:2px solid #4cc9f0;border-radius:3px;pointer-events:auto}',
  '#ed-sel .e{right:-7px;top:50%;margin-top:-6px;cursor:ew-resize}',
  '#ed-sel .s{bottom:-7px;left:50%;margin-left:-6px;cursor:ns-resize}',
  '#ed-sel .se{right:-7px;bottom:-7px;cursor:nwse-resize}',
  '#ed-media{position:fixed;top:0;right:0;bottom:0;width:320px;max-width:92vw;z-index:2147483001;background:#0c1317;color:#fff;border-left:1px solid rgba(195,161,90,.35);box-shadow:-20px 0 60px rgba(0,0,0,.45);transform:translateX(105%);transition:transform .28s ease;display:flex;flex-direction:column;font-family:Inter,system-ui,sans-serif}',
  '#ed-media.open{transform:none}',
  '#ed-media header{padding:16px 16px 10px;display:flex;align-items:center;justify-content:space-between}',
  '#ed-media header b{font:italic 500 1.2rem Fraunces,serif}',
  '#ed-media header button{all:unset;cursor:pointer;font-size:1.1rem;padding:4px 8px;color:rgba(255,255,255,.7)}',
  '#ed-media .hint{font-size:.74rem;line-height:1.5;color:rgba(255,255,255,.6);padding:0 16px 10px}',
  '#ed-drop{margin:0 16px 12px;border:2px dashed rgba(195,161,90,.55);border-radius:12px;padding:20px 12px;text-align:center;font-size:.8rem;color:rgba(255,255,255,.85);cursor:pointer}',
  '#ed-drop.over{background:rgba(195,161,90,.15);border-color:#c3a15a}',
  '#ed-grid{flex:1;overflow:auto;padding:0 16px 16px;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:start}',
  '#ed-grid .it{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#1a252c;cursor:grab;border:1px solid rgba(255,255,255,.1)}',
  '#ed-grid .it:hover{border-color:#c3a15a}',
  '#ed-grid .it img,#ed-grid .it video{width:100%;height:100%;object-fit:cover;pointer-events:none}',
  '#ed-grid .it span{position:absolute;left:4px;bottom:4px;background:rgba(0,0,0,.65);font-size:.6rem;padding:2px 5px;border-radius:4px}',
  '#ed-toast{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:2147483002;background:#111b22;color:#fff;border:1px solid rgba(195,161,90,.5);border-radius:12px;padding:12px 18px;font:500 .84rem/1.4 Inter,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.4);display:none;max-width:min(520px,90vw);text-align:center}'
  ].join('\n');
  document.head.appendChild(css);

  function ico(paths){ return '<svg viewBox="0 0 24 24">'+paths+'</svg>'; }
  var ALIGN = {
    left:   ico('<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>'),
    center: ico('<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>'),
    right:  ico('<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>'),
    justify:ico('<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>')
  };
  var bar = document.createElement('div'); bar.id = 'ed-bar';
  bar.innerHTML =
    '<div class="g"><span class="lbl">Text</span>' +
      '<button data-cmd="bold" title="Bold (⌘B)"><b>B</b></button>' +
      '<button data-cmd="italic" title="Italic (⌘I)"><i style="font-family:Georgia,serif">I</i></button>' +
      '<button data-cmd="underline" title="Underline (⌘U)"><u>U</u></button>' +
      '<button data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>' +
      '<input type="color" id="ed-color" value="#ffffff" title="Text color">' +
    '</div>' +
    '<div class="g"><span class="lbl">Size</span>' +
      '<button data-act="size-" title="Smaller">A−</button><input type="number" id="ed-size" min="8" max="240" title="Font size (px)"><button data-act="size+" title="Bigger">A+</button>' +
    '</div>' +
    '<div class="g"><span class="lbl">Align</span>' +
      ['left','center','right','justify'].map(function(a){ return '<button data-align="'+a+'" title="Align text '+a+'">'+ALIGN[a]+'</button>'; }).join('') +
    '</div>' +
    '<div class="g"><span class="lbl">Box</span>' +
      '<button data-act="parent" title="Select the box around this one">↑ Parent</button>' +
      '<button data-box="left" title="Move box to the left">'+ico('<path d="M4 4v16"/><rect x="7" y="7" width="9" height="10" rx="1"/>')+'</button>' +
      '<button data-box="center" title="Center the box">'+ico('<path d="M12 3v18"/><rect x="6" y="7" width="12" height="10" rx="1"/>')+'</button>' +
      '<button data-box="right" title="Move box to the right">'+ico('<path d="M20 4v16"/><rect x="8" y="7" width="9" height="10" rx="1"/>')+'</button>' +
      '<button data-act="full" title="Full width">↔ Full</button>' +
      '<button data-act="gap-" title="Less space below">⇡</button><button data-act="gap+" title="More space below">⇣</button>' +
      '<button data-act="reset" title="Undo size/position/formatting changes on this box">Reset</button>' +
    '</div>' +
    '<div class="g"><button data-act="media" title="Upload images and videos">🖼 Media</button><button data-act="clearmedia" title="Remove the image/video from the selected box">✕ Media</button></div>' +
    '<div class="g"><span id="ed-status">Ready</span><button data-act="dock" title="Move this toolbar to the top / bottom of the screen">⇅</button></div>';
  document.body.appendChild(bar);

  var tog = document.createElement('button'); tog.id = 'ed-toggle'; tog.textContent = '✏️  Edit page';
  document.body.appendChild(tog);
  var toast = document.createElement('div'); toast.id = 'ed-toast'; document.body.appendChild(toast);
  var sel = document.createElement('div'); sel.id = 'ed-sel';
  sel.innerHTML = '<div class="chip"></div><i class="e"></i><i class="s"></i><i class="se"></i>';
  document.body.appendChild(sel);

  var drawer = document.createElement('div'); drawer.id = 'ed-media';
  drawer.innerHTML = '<header><b>Images &amp; videos</b><button data-act="closemedia" title="Close">✕</button></header>' +
    '<div class="hint">Drag a thumbnail onto any dashed box on the page — or drop files straight onto a box. Videos play muted on a loop.</div>' +
    '<div id="ed-drop">＋ Drop files here<br>or click to upload<input type="file" id="ed-file" multiple accept="image/*,video/*" style="display:none"></div>' +
    '<div id="ed-grid"></div>';
  document.body.appendChild(drawer);

  var status = $('#ed-status');
  var toastT;
  function say(t, ms){ toast.textContent = t; toast.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function(){ toast.style.display = 'none'; }, ms || 4200); }
  function setStatus(t, err){ status.textContent = t; status.className = err ? 'err' : ''; }

  /* ---------- saving ---------- */
  var dirty = {}, saveT = null, saving = false;
  function scheduleSave(){ setStatus('Unsaved…'); clearTimeout(saveT); saveT = setTimeout(flush, 700); }
  function flush(){
    clearTimeout(saveT);
    var keys = Object.keys(dirty); if(!keys.length) return Promise.resolve();
    setStatus('Saving…');
    return Promise.all(keys.map(function(k){
      var body = JSON.stringify({page:k, entries: DATA[k] || {}});
      delete dirty[k];
      return api('/__api/save', {method:'POST', headers:{'Content-Type':'application/json'}, body: body});
    })).then(function(){ setStatus('All changes saved ✓'); })
      .catch(function(){ keys.forEach(function(k){ dirty[k] = 1; }); setStatus('Not saved — is Start-MO7LEY running?', true); });
  }
  window.addEventListener('beforeunload', function(e){ if(Object.keys(dirty).length){ flush(); e.preventDefault(); e.returnValue = ''; } });

  function cleanHTML(el){
    var c = el.cloneNode(true);
    [c].concat($$('*', c)).forEach(function(n){
      ['contenteditable','spellcheck','data-ed-text','data-ed-slot'].forEach(function(a){ n.removeAttribute(a); });
      if(n.getAttribute && n.getAttribute('class') === '') n.removeAttribute('class');
    });
    $$('font', c).forEach(function(f){ while(f.firstChild) f.parentNode.insertBefore(f.firstChild, f); f.remove(); });
    return c.innerHTML;
  }
  function commit(el, what){
    var p = pathOf(el), k = keyOf(el);
    ensureOrig(el, p, what === 'html');
    var m = DATA[k] || (DATA[k] = {});
    var e = m[p] || (m[p] = {});
    if(what === 'html') e.html = cleanHTML(el);
    if(what === 'style') e.style = el.getAttribute('style') || '';
    dirty[k] = 1; scheduleSave();
  }
  function commitMedia(host, media){
    var p = pathOf(host), k = keyOf(host);
    ensureOrig(host, p, false);
    var m = DATA[k] || (DATA[k] = {});
    var e = m[p] || (m[p] = {});
    if(media) e.media = media; else delete e.media;
    if(!Object.keys(e).length) delete m[p];
    dirty[k] = 1; scheduleSave();
  }

  /* ---------- edit mode on/off ---------- */
  var current = null;      // text block being edited
  var box = null;          // selected box (outline + handles)

  function findTextBlocks(){
    $$('body *').forEach(function(el){
      if(el.closest(EXCLUDE)) return;
      var hasText = false;
      for(var i=0;i<el.childNodes.length;i++){ var n = el.childNodes[i]; if(n.nodeType === 3 && n.nodeValue.trim()){ hasText = true; break; } }
      if(!hasText) return;
      for(var j=0;j<el.children.length;j++) if(!INLINE[el.children[j].tagName]) return;
      if(INLINE[el.tagName] && el.parentElement && el.parentElement.closest('[data-ed-text]')) return;
      el.setAttribute('data-ed-text','');
      el.contentEditable = 'true';
      el.spellcheck = false;
    });
  }
  function enter(){
    editing = true;
    document.documentElement.classList.add('ed-on');
    document.execCommand('styleWithCSS', false, true);
    findTextBlocks();
    $$(SLOT_SEL).forEach(function(s){ if(!s.closest(EXCLUDE)) s.setAttribute('data-ed-slot',''); });
    tog.textContent = '✓  Done editing';
    setStatus('Ready');
    say('Edit mode: click any text to type. Click a dashed box to drop in an image or video. Everything saves automatically.', 6500);
  }
  function leave(){
    flush();
    editing = false;
    document.documentElement.classList.remove('ed-on');
    $$('[data-ed-text]').forEach(function(el){ el.removeAttribute('contenteditable'); el.removeAttribute('data-ed-text'); el.removeAttribute('spellcheck'); });
    $$('[data-ed-slot]').forEach(function(el){ el.removeAttribute('data-ed-slot'); el.classList.remove('ed-drop'); });
    drawer.classList.remove('open');
    select(null);
    tog.textContent = '✏️  Edit page';
  }
  tog.addEventListener('click', function(){ editing ? leave() : enter(); });

  /* ---------- selection box + resize handles ---------- */
  function blockOf(el){
    while(el && el !== document.body && getComputedStyle(el).display.indexOf('inline') === 0) el = el.parentElement;
    return el;
  }
  function select(el){
    box = el && el !== document.body ? el : null;
    current = box ? (box.closest('[data-ed-text]') || null) : null;
    if(box) ensureOrig(box, pathOf(box), box.hasAttribute('data-ed-text'));
    if(current && current !== box) ensureOrig(current, pathOf(current), true);
    placeSel(); refreshBar();
  }
  function placeSel(){
    if(!box || !editing){ sel.style.display = 'none'; return; }
    var r = box.getBoundingClientRect();
    sel.style.cssText = 'display:block;left:'+r.left+'px;top:'+r.top+'px;width:'+r.width+'px;height:'+r.height+'px';
    var cls = (typeof box.className === 'string' && box.className.trim()) ? '.'+box.className.trim().split(/\s+/).filter(function(c){ return c.indexOf('ed-') !== 0; })[0] : '';
    sel.firstChild.textContent = box.tagName.toLowerCase() + (box.id ? '#'+box.id : cls || '');
  }
  window.addEventListener('scroll', placeSel, true);
  window.addEventListener('resize', placeSel);

  var drag = null;
  sel.addEventListener('pointerdown', function(e){
    var h = e.target.closest('i'); if(!h || !box) return;
    e.preventDefault(); e.stopPropagation();
    var r = box.getBoundingClientRect();
    drag = {mode:h.className, x:e.clientX, y:e.clientY, w:r.width, h:r.height};
    if(getComputedStyle(box).display === 'inline') box.style.display = 'inline-block';
    h.setPointerCapture(e.pointerId);
  });
  sel.addEventListener('pointermove', function(e){
    if(!drag) return;
    if(drag.mode.indexOf('e') !== -1 || drag.mode === 'se'){ box.style.width = Math.max(40, Math.round(drag.w + e.clientX - drag.x)) + 'px'; box.style.maxWidth = 'none'; }
    if(drag.mode === 's' || drag.mode === 'se'){ box.style.height = Math.max(24, Math.round(drag.h + e.clientY - drag.y)) + 'px'; }
    placeSel();
  });
  sel.addEventListener('pointerup', function(){ if(!drag) return; drag = null; commit(box, 'style'); });

  /* ---------- clicking / typing inside the page ---------- */
  function inUI(t){ return t && t.closest && t.closest('#ed-bar,#ed-media,#ed-sel,#ed-toggle'); }
  document.addEventListener('mousedown', function(e){
    if(!editing || inUI(e.target)) return;
    var t = e.target.nodeType === 1 ? e.target : e.target.parentElement;
    var tb = t.closest('[data-ed-text]');
    select(tb || blockOf(t));
  }, true);
  document.addEventListener('click', function(e){
    if(!editing || inUI(e.target)) return;
    if(e.target.closest('a[href],form,summary')) e.preventDefault();
  }, true);
  document.addEventListener('submit', function(e){ if(editing) e.preventDefault(); }, true);
  document.addEventListener('input', function(e){
    if(!editing) return;
    var tb = e.target.closest && e.target.closest('[data-ed-text]');
    if(tb){ commit(tb, 'html'); }
  });
  document.addEventListener('paste', function(e){
    if(!editing) return;
    var tb = e.target.closest && e.target.closest('[data-ed-text]'); if(!tb) return;
    e.preventDefault();
    var txt = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, txt);
  }, true);
  document.addEventListener('keydown', function(e){
    if(!editing) return;
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's'){ e.preventDefault(); flush(); return; }
    if(e.key === 'Escape'){ select(null); return; }
    if(e.key === 'Enter' && e.target.closest && e.target.closest('[data-ed-text]') && !e.shiftKey){
      e.preventDefault(); document.execCommand('insertLineBreak');
    }
  }, true);
  document.addEventListener('selectionchange', function(){ if(editing) refreshBar(); });

  /* ---------- toolbar ---------- */
  function curBlock(){ return current || (box && box.closest('[data-ed-text]')) || null; }
  function selInBlock(blk){
    var s = getSelection();
    return s.rangeCount && blk && blk.contains(s.anchorNode) && !s.isCollapsed;
  }
  function selectAllIn(blk){
    var r = document.createRange(); r.selectNodeContents(blk);
    var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function fmt(cmd){
    var blk = curBlock(); if(!blk) return say('Click on some text first.');
    if(!selInBlock(blk)){ blk.focus(); selectAllIn(blk); }
    document.execCommand(cmd); commit(blk, 'html'); refreshBar();
  }
  function curSize(){
    var blk = curBlock(), n = null;
    var s = getSelection();
    if(blk && s.rangeCount && blk.contains(s.anchorNode)) n = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement;
    n = n || blk || box;
    return n ? Math.round(parseFloat(getComputedStyle(n).fontSize)) : 16;
  }
  function setSize(px){
    px = Math.max(8, Math.min(240, Math.round(px)));
    var blk = curBlock(); if(!blk && box && box.style) { box.style.fontSize = px+'px'; commit(box,'style'); placeSel(); return; }
    if(!blk) return say('Click on some text first.');
    if(selInBlock(blk)){
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('fontSize', false, '7');
      var made = [];
      $$('font[size="7"]', blk).forEach(function(f){
        var sp = document.createElement('span'); sp.style.fontSize = px+'px';
        while(f.firstChild) sp.appendChild(f.firstChild);
        f.parentNode.replaceChild(sp, f); made.push(sp);
      });
      document.execCommand('styleWithCSS', false, true);
      if(made.length){                                  // keep the text selected so A+ / A- can be pressed again
        var r = document.createRange(); r.setStartBefore(made[0]); r.setEndAfter(made[made.length-1]);
        var s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r);
      }
      commit(blk, 'html');
    } else { blk.style.fontSize = px+'px'; commit(blk, 'style'); }
    placeSel(); refreshBar();
  }
  function textTarget(){ return curBlock() || box; }
  function refreshBar(){
    if(!editing) return;
    ['bold','italic','underline','strikeThrough'].forEach(function(c){
      var b = $('[data-cmd="'+c+'"]', bar), on = false;
      try{ on = document.queryCommandState(c); }catch(_){}
      b.classList.toggle('on', !!(on && curBlock()));
    });
    var t = textTarget();
    $$('[data-align]', bar).forEach(function(b){ b.classList.toggle('on', !!t && getComputedStyle(t).textAlign.replace('start','left').replace('-webkit-','') === b.getAttribute('data-align')); });
    var si = $('#ed-size'); if(document.activeElement !== si) si.value = (curBlock()||box) ? curSize() : '';
    $('[data-act="clearmedia"]', bar).disabled = !(box && $(':scope > .ed-media', mediaHost(box)));
    $('[data-act="parent"]', bar).disabled = !box || box.parentElement === document.body;
  }
  bar.addEventListener('mousedown', function(e){ if(e.target.tagName !== 'INPUT') e.preventDefault(); });
  bar.addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    var cmd = b.getAttribute('data-cmd'), act = b.getAttribute('data-act'), al = b.getAttribute('data-align'), bx = b.getAttribute('data-box');
    if(cmd) return fmt(cmd);
    if(al){ var t = textTarget(); if(!t) return say('Click on some text or a box first.'); t.style.textAlign = al; commit(t, 'style'); return refreshBar(); }
    if(bx){ return boxAlign(bx); }
    if(act === 'size+') return setSize(curSize() + (curSize() >= 40 ? 4 : 2));
    if(act === 'size-') return setSize(curSize() - (curSize() > 40 ? 4 : 2));
    if(act === 'parent'){ if(box && box.parentElement) select(box.parentElement); return; }
    if(act === 'full'){ if(!box) return; box.style.width = '100%'; box.style.maxWidth = 'none'; commit(box, 'style'); return placeSel(); }
    if(act === 'gap+' || act === 'gap-'){ if(!box) return; var cur = parseFloat(getComputedStyle(box).marginBottom) || 0; box.style.marginBottom = Math.max(0, cur + (act === 'gap+' ? 8 : -8)) + 'px'; commit(box, 'style'); return placeSel(); }
    if(act === 'reset') return resetBox();
    if(act === 'dock') return bar.classList.toggle('top');
    if(act === 'media'){ drawer.classList.add('open'); return loadUploads(); }
    if(act === 'clearmedia'){ var h = mediaHost(box); applyMedia(h, null); commitMedia(h, null); return refreshBar(); }
  });
  drawer.addEventListener('click', function(e){ var b = e.target.closest('[data-act="closemedia"]'); if(b) drawer.classList.remove('open'); });
  $('#ed-size').addEventListener('change', function(){ var v = parseFloat(this.value); if(v) setSize(v); });
  $('#ed-color').addEventListener('input', function(){
    var blk = curBlock(); if(!blk) return say('Click on some text first.');
    var v = this.value;
    if(selInBlock(blk)){ document.execCommand('foreColor', false, v); commit(blk, 'html'); }
    else { blk.style.color = v; commit(blk, 'style'); }
  });
  function boxAlign(side){
    if(!box) return say('Click on a box first.');
    var cs = getComputedStyle(box);
    if(cs.display === 'inline') box.style.display = 'block';
    if(!box.style.width && cs.display !== 'flex' && cs.display !== 'grid'){ box.style.width = 'fit-content'; box.style.maxWidth = '100%'; }
    box.style.marginLeft = side === 'left' ? '0' : 'auto';
    box.style.marginRight = side === 'right' ? '0' : 'auto';
    commit(box, 'style'); placeSel();
  }
  function resetBox(){
    var t = box; if(!t) return;
    var p = pathOf(t), k = keyOf(t), o = ORIG[p];
    var host = mediaHost(t);
    if(host && $(':scope > .ed-media', host)) applyMedia(host, null);
    if(o){
      if(o.html != null) t.innerHTML = o.html;
      if(o.style == null) t.removeAttribute('style'); else t.setAttribute('style', o.style);
    }
    if(DATA[k]) delete DATA[k][p];
    dirty[k] = 1; scheduleSave();
    t.setAttribute('data-ed-text',''); t.contentEditable = 'true';
    placeSel(); say('That box is back to how it was originally.');
  }

  /* ---------- images & videos ---------- */
  function loadUploads(){
    api('/__api/uploads').then(function(list){
      var g = $('#ed-grid');
      if(!list.length){ g.innerHTML = '<p style="grid-column:1/-1;color:rgba(255,255,255,.45);font-size:.8rem">Nothing uploaded yet.</p>'; return; }
      g.innerHTML = list.map(function(f){
        var tag = f.type === 'video' ? '<video src="'+ROOT+f.src+'" muted preload="metadata"></video>' : '<img src="'+ROOT+f.src+'" alt="">';
        return '<div class="it" draggable="true" data-src="'+f.src+'" data-type="'+f.type+'" title="'+f.name+'">'+tag+'<span>'+(f.type==='video'?'▶ ':'')+f.name.slice(0,16)+'</span></div>';
      }).join('');
    }).catch(function(){ say('Could not load your uploads.'); });
  }
  $('#ed-grid').addEventListener('dragstart', function(e){
    var it = e.target.closest('.it'); if(!it) return;
    e.dataTransfer.setData('application/x-ed-media', JSON.stringify({src:it.dataset.src, type:it.dataset.type}));
    e.dataTransfer.effectAllowed = 'copy';
  });
  $('#ed-grid').addEventListener('click', function(e){      // click-to-place on the selected box
    var it = e.target.closest('.it'); if(!it) return;
    var slot = box && (box.closest(SLOT_SEL) || null);
    if(!slot) return say('Click a dashed box on the page first, or drag this thumbnail onto one.');
    assign(slot, {src:it.dataset.src, type:it.dataset.type});
  });
  var fileIn = $('#ed-file'), dz = $('#ed-drop');
  dz.addEventListener('click', function(){ fileIn.click(); });
  fileIn.addEventListener('change', function(){ uploadFiles(fileIn.files).then(loadUploads); fileIn.value = ''; });
  ['dragenter','dragover'].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(t){ dz.addEventListener(t, function(e){ e.preventDefault(); dz.classList.remove('over'); }); });
  dz.addEventListener('drop', function(e){ e.stopPropagation(); uploadFiles(e.dataTransfer.files).then(loadUploads); });

  function uploadFiles(files){
    var list = Array.prototype.slice.call(files || []).filter(function(f){ return /^(image|video)\//.test(f.type) || /\.(jpe?g|png|gif|webp|avif|svg|mp4|mov|m4v|webm)$/i.test(f.name); });
    if(!list.length){ say('Those files aren\'t images or videos.'); return Promise.resolve([]); }
    var out = [];
    return list.reduce(function(chain, f){
      return chain.then(function(){
        setStatus('Uploading '+f.name.slice(0,18)+'…');
        if(f.size > 90*1024*1024) say('Heads up: '+f.name+' is over 90 MB. GitHub rejects files over 100 MB, so compress it before you publish.', 8000);
        return fetch('/__api/upload?name='+encodeURIComponent(f.name), {method:'POST', headers:{'X-MO7-Editor':'1'}, body:f})
          .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
          .then(function(j){ out.push(j); });
      }).catch(function(){ say('Upload failed for '+f.name+'.'); });
    }, Promise.resolve()).then(function(){ setStatus(out.length ? 'Uploaded ✓' : 'Ready'); return out; });
  }
  function assign(slot, media){
    var host = mediaHost(slot);
    applyMedia(host, media); commitMedia(host, media);
    select(slot); say('Placed. Drag a different one on top to swap it.', 2500);
  }
  function slotOf(t){ var el = t && (t.nodeType === 1 ? t : t.parentElement); return el ? el.closest(SLOT_SEL) : null; }
  var lastHL = null;
  function hl(s){ if(lastHL && lastHL !== s) lastHL.classList.remove('ed-drop'); if(s) s.classList.add('ed-drop'); lastHL = s; }
  document.addEventListener('dragover', function(e){
    if(!editing) return;
    if(e.target.closest && e.target.closest('#ed-media')) return;
    var dt = e.dataTransfer, hasFiles = dt && Array.prototype.indexOf.call(dt.types || [], 'Files') !== -1, isMedia = dt && Array.prototype.indexOf.call(dt.types || [], 'application/x-ed-media') !== -1;
    if(!hasFiles && !isMedia) return;
    e.preventDefault(); hl(slotOf(e.target));
  }, true);
  document.addEventListener('dragleave', function(e){ if(editing && !e.relatedTarget) hl(null); }, true);
  document.addEventListener('drop', function(e){
    if(!editing) return;
    if(e.target.closest && e.target.closest('#ed-media')) return;
    var dt = e.dataTransfer; if(!dt) return;
    var raw = dt.getData('application/x-ed-media');
    var hasFiles = dt.files && dt.files.length;
    if(!raw && !hasFiles) return;
    e.preventDefault(); e.stopPropagation();
    var slot = slotOf(e.target); hl(null);
    if(!slot){ say('Drop it onto one of the dashed image/video boxes.'); return; }
    if(raw){ try{ assign(slot, JSON.parse(raw)); }catch(_){} return; }
    uploadFiles(dt.files).then(function(r){ if(r[0]) assign(slot, r[0]); loadUploads(); });
  }, true);
}

})();
