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

  if (isNativeApp()) {
    initNativeAdMob();
  } else {
    initWebAdSense();
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

  /* ---------------- 2. Web / installed PWA: AdSense fixed bottom bar ---------------- */
  function initWebAdSense() {
    // TODO: fill these in from your AdSense account (Ads > By ad unit > Display ads
    // > create a responsive unit). Nothing shows until both are real values.
    var ADSENSE_CLIENT_ID = 'ca-pub-2129877342025466';
    var ADSENSE_SLOT_ID = '3192124134';

    if (ADSENSE_CLIENT_ID.indexOf('XXXX') !== -1 || ADSENSE_SLOT_ID.indexOf('XXXX') !== -1) {
      console.warn('AdSense IDs not set yet — edit ads.js (ADSENSE_CLIENT_ID / ADSENSE_SLOT_ID) once you have both.');
      return;
    }

    var bar = document.createElement('div');
    bar.id = 'adsense-bottom-bar';
    bar.style.position = 'fixed';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.bottom = '0';
    bar.style.zIndex = '9999';
    bar.style.background = 'var(--paper-card, #fff)';
    bar.style.borderTop = '1px solid rgba(0,0,0,0.1)';
    bar.style.display = 'flex';
    bar.style.justifyContent = 'center';
    bar.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    bar.style.minHeight = '50px';

    var ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.style.maxWidth = '728px';
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT_ID);
    ins.setAttribute('data-ad-slot', ADSENSE_SLOT_ID);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    bar.appendChild(ins);

    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(bar); });
    } else {
      document.body.appendChild(bar);
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT_ID;
    script.crossOrigin = 'anonymous';
    script.onload = function () {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('AdSense push failed:', e);
      }
    };
    script.onerror = function () {
      console.warn('AdSense script failed to load (ad blocker, or site not yet approved).');
    };
    document.head.appendChild(script);

    // Reserve space in the page so the fixed bar never covers the footer or buttons.
    // Re-measures as the ad actually renders in, since its real height isn't known upfront.
    function updateReservedSpace() {
      document.documentElement.style.setProperty('--ad-banner-height', (bar.offsetHeight || 0) + 'px');
    }
    updateReservedSpace();
    if (window.ResizeObserver) {
      new ResizeObserver(updateReservedSpace).observe(bar);
    } else {
      setTimeout(updateReservedSpace, 1000);
      setTimeout(updateReservedSpace, 3000);
    }
  }
})();
