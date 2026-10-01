/* AdMob banner integration (via @capacitor-community/admob).
 *
 * This file does nothing when the app is opened as a plain website or installed
 * PWA (e.g. on GitHub Pages) — it only activates inside the native Android app,
 * where Capacitor injects window.Capacitor automatically. No build step needed:
 * Capacitor exposes native plugins as window.Capacitor.Plugins.<PluginName>.
 *
 * ============================== BEFORE YOU PUBLISH ==============================
 * 1. Replace TEST_BANNER_AD_UNIT_ID below with your real AdMob Ad Unit ID.
 * 2. Replace the matching com.google.android.gms.ads.APPLICATION_ID meta-data
 *    value in android/app/src/main/AndroidManifest.xml with your real AdMob App ID.
 * 3. Remove/flip isTesting and initializeForTesting (see TODOs below).
 * 4. Add a privacy policy URL in your Play Store listing and implement a consent
 *    flow (Google's User Messaging Platform / UMP SDK) if you'll serve ads to
 *    users in the EEA/UK — this is an AdMob policy requirement, not optional,
 *    and is NOT implemented here.
 * ==================================================================================
 */
(function () {
  function isNativeApp() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  if (!isNativeApp()) return;

  var AdMob = window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
  if (!AdMob) {
    console.warn('AdMob plugin not found — did you run `npm install @capacitor-community/admob` and `npx cap sync android`?');
    return;
  }

  // Google's official TEST ad unit ID for Android banners — safe to use during
  // development, shows a clearly-labelled "Test Ad". Swap before publishing.
  var TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

  function reserveBannerSpace(heightPx) {
    document.documentElement.style.setProperty('--ad-banner-height', (heightPx || 50) + 'px');
  }

  AdMob.addListener('bannerAdSizeChanged', function (info) {
    reserveBannerSpace(info && info.height);
  });
  AdMob.addListener('bannerAdLoaded', function () {
    // Fallback in case bannerAdSizeChanged doesn't fire on this plugin version/device.
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
})();
