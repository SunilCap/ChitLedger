/* Ad integration for Chit Ledger.
 *
 * Two completely separate ad paths, auto-detected at runtime — same file works
 * for both the plain website/installed PWA and the native Android app:
 *
 *   1. Native Android app (wrapped via Capacitor): shows an AdMob banner.
 *      Requires no edits here — it already uses Google's official TEST ad unit
 *      ID, safe for development. See the chit-ledger-android project's README
 *      for swapping in real AdMob IDs before publishing.
 *
 *   2. Plain web / installed PWA (this is what runs at your GitHub Pages URL,
 *      and when the PWA is "Added to Home Screen"): shows a Google AdSense ad
 *      in a fixed bar pinned to the bottom of the screen, sized and positioned
 *      by this code (not Google's automatic "Anchor ads" placement).
 *      REQUIRES your real AdSense Publisher ID and an Ad Unit/Slot ID below —
 *      does nothing until both are filled in.
 */
(function () {
  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }


  /* ---------------- 1. Native Android app: AdMob banner ---------------- */
  function initNativeAdMob() {
    var AdMob = window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    if (!AdMob) {
      console.warn('AdMob plugin not found — did you run `npm install @capacitor-community/admob` and `npx cap sync android`?');
      return;
    }

    // Google's official TEST ad unit ID — safe for development. Replace before publishing.
    var TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

    function reserveBannerSpace(heightPx) {
      document.documentElement.style.setProperty('--ad-banner-height', (heightPx || 50) + 'px');
    }

    AdMob.addListener('bannerAdSizeChanged', function (info) {
      reserveBannerSpace(info && info.height);
    });
    AdMob.addListener('bannerAdLoaded', function () {
      if (document.documentElement.style.getPropertyValue('--ad-banner-height') === '0px') {
        reserveBannerSpace(50);
      }
    });
    AdMob.addListener('bannerAdFailedToLoad', function (err) {
      console.warn('AdMob banner failed to load:', err);
      reserveBannerSpace(0);
    });

    AdMob.initialize({
      initializeForTesting: true // TODO: remove before publishing
    }).then(function () {
      return AdMob.showBanner({
        adId: TEST_BANNER_AD_UNIT_ID,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: true // TODO: remove before publishing
      });
    }).catch(function (err) {
      console.warn('AdMob init/show failed:', err);
    });
  }

  /* ---------------- 2. Web / installed PWA: quote strip + optional AdSense ----------------
   * The strip is always built (so layout never jumps). It shows a rotating quote
   * until a real AdSense ad fills it; if the ad is blocked/unfilled the quote returns. */
  var QUOTES = [
    "Small steps every day add up to big change.",
    "You don't have to be perfect to make progress.",
    "Start where you are. Use what you have.",
    "Consistency beats intensity.",
    "Today's effort is tomorrow's advantage.",
    "Progress, not perfection.",
    "Dream big, begin small, keep going.",
    "Every expert was once a beginner.",
    "Difficult roads often lead to beautiful places.",
    "Discipline is choosing what you want most over what you want now.",
    "Believe you can, and you're halfway there.",
    "Your future is built by what you do today.",
    "Fall seven times, stand up eight.",
    "Be patient with yourself; growth takes time.",
    "The best way to predict tomorrow is to shape today.",
    "Little by little, a little becomes a lot.",
    "Focus on the step in front of you.",
    "Courage is taking the next step while still afraid.",
    "Make today count.",
    "Hard work quietly outlasts talent that waits.",
    "A setback is a setup for a comeback.",
    "Keep going; you're closer than you think.",
    "Done is better than perfect.",
    "Energy flows where attention goes.",
    "Be the effort you wish to see.",
    "Small wins build lasting confidence.",
    "The only way out is through.",
    "Strong habits make strong futures.",
    "Turn 'someday' into a start date.",
    "Mistakes are proof that you are trying.",
    "Rest if you must, but don't quit.",
    "You are capable of more than you know.",
    "Great things take time; keep showing up.",
    "Stay curious, stay humble, stay moving.",
    "Choose progress over comfort.",
    "A calm mind makes clear decisions.",
    "Plant today; the harvest will come.",
    "Success is the sum of small efforts repeated.",
    "What you do daily matters more than what you do occasionally.",
    "Begin now; the right moment is a myth."
  ];

  function shuffle(arr) {
    for (var n = arr.length - 1; n > 0; n--) { var j = Math.floor(Math.random() * (n + 1)); var t = arr[n]; arr[n] = arr[j]; arr[j] = t; }
    return arr;
  }
  function attachBar(bar) {
    if (!document.body) document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(bar); });
    else document.body.appendChild(bar);
  }
  function reserve(bar) {
    function update() {
      var h = bar.hidden ? 0 : bar.offsetHeight;
      document.documentElement.style.setProperty('--ad-banner-height', (h ? h + 12 : 0) + 'px');
    }
    update();
    if (window.ResizeObserver) new ResizeObserver(update).observe(bar);
    else { setTimeout(update, 500); setTimeout(update, 2000); }
    return update;
  }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function initWebAdSense() {
    // TODO: fill these in from your AdSense account. Until both are real values, only quotes show.
    var ADSENSE_CLIENT_ID = 'ca-pub-xxxxxxxxxxxxxxxx';
    var ADSENSE_SLOT_ID = 'xxxxxxxxxx';
    var configured = !(/x{4}/i.test(ADSENSE_CLIENT_ID) || /x{4}/i.test(ADSENSE_SLOT_ID));

    var bar = document.createElement('div');
    bar.id = 'adsense-bottom-bar';
    bar.className = 'ad-strip'; // positioned above the bottom nav by index.html's CSS
    bar.setAttribute('role', 'complementary');
    var q = document.createElement('div');
    q.className = 'quote';
    q.setAttribute('title', 'Tap for another');
    q.innerHTML = '<span class="ad-label">Quote</span><span class="quote-text"></span>';
    bar.appendChild(q);
    var text = q.querySelector('.quote-text');

    var order = shuffle(QUOTES.slice()), idx = 0;
    text.textContent = order[idx++];
    function nextQuote() {
      if (idx >= order.length) { order = shuffle(QUOTES.slice()); idx = 0; }
      var t = order[idx++];
      if (reduced()) { text.textContent = t; return; }
      q.style.opacity = '0';
      setTimeout(function () { text.textContent = t; q.style.opacity = '1'; }, 250);
    }
    q.addEventListener('click', nextQuote);
    setInterval(function () { if (!document.hidden && !bar.classList.contains('has-ad')) nextQuote(); }, 15000);

    attachBar(bar);
    reserve(bar);
    if (!configured) { console.info('AdSense IDs not set yet — showing quotes only.'); return; }

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:block;opacity:0;pointer-events:none;';
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT_ID);
    ins.setAttribute('data-ad-slot', ADSENSE_SLOT_ID);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    bar.appendChild(ins);

    if (window.MutationObserver) {
      new MutationObserver(function () {
        var filled = ins.getAttribute('data-ad-status') === 'filled';
        bar.classList.toggle('has-ad', filled);
        ins.style.opacity = filled ? '1' : '0';
        ins.style.pointerEvents = filled ? 'auto' : 'none';
      }).observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT_ID;
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { console.warn('AdSense push failed:', e); }
    };
    script.onerror = function () { console.warn('AdSense script failed to load (ad blocker, or site not yet approved).'); };
    document.head.appendChild(script);
  }

  // Dispatch last, so every var above is initialised first.
  if (isNativeApp()) {
    initNativeAdMob();
  } else {
    initWebAdSense();
  }
})();
