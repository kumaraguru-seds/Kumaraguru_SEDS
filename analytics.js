(function(){
  // Edit this:
  const API_BASE = "https://sedsipaddress.gamer.gd/api/api";
  const ORIGIN = "https://kumaraguruseds.space"; // your GitHub Pages origin

  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    sessionStorage.setItem('visitor_session_id', sessionId);
  }

  function detectDevice(){ const ua = navigator.userAgent||''; if(/mobile|android|iphone|ipad|phone/i.test(ua)) return 'mobile'; if(/tablet/i.test(ua)) return 'tablet'; return 'desktop'; }

  function sendVisit(){
    const payload = {
      page: document.title || '',
      path: location.pathname + location.search,
      ref: document.referrer || '',
      ua: navigator.userAgent || '',
      browser: navigator.userAgent || '',
      device: detectDevice(),
      extra: '',
      session_id: sessionId
    };
    navigator.sendBeacon ? navigator.sendBeacon(API_BASE + '/log_visit.php', JSON.stringify(payload)) :
      fetch(API_BASE + '/log_visit.php', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).catch(()=>{});
  }

  let heatBatch = [];
  function pushHeat(x,y){
    heatBatch.push({x: Math.round(x), y: Math.round(y), viewport_w: window.innerWidth, viewport_h: window.innerHeight});
    if (heatBatch.length >= 20) flushHeat();
  }
  function flushHeat(){
    if (!heatBatch.length) return;
    const body = { page_path: location.pathname, points: heatBatch.slice(0,100), session_id: sessionId };
    fetch(API_BASE + '/log_heatmap.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)}).catch(()=>{});
    heatBatch = [];
  }

  let lastMove = 0;
  document.addEventListener('click', function(e){
    pushHeat(e.clientX, e.clientY);
  }, true);
  document.addEventListener('pointermove', function(e){
    const now = Date.now();
    if (now - lastMove > 1000){ lastMove = now; pushHeat(e.clientX, e.clientY); }
  }, true);

  let start = Date.now();
  function sendExit(){
    const time_on_page = Math.round((Date.now() - start)/1000);
    const payload = { session_id: sessionId, time_on_page: time_on_page, page: location.pathname };
    navigator.sendBeacon ? navigator.sendBeacon(API_BASE + '/log_exit.php', JSON.stringify(payload)) :
      fetch(API_BASE + '/log_exit.php', {method:'POST',headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).catch(()=>{});
  }
  window.addEventListener('beforeunload', function(){ flushHeat(); sendExit(); });
  setInterval(flushHeat, 5000);

  sendVisit();
})();
