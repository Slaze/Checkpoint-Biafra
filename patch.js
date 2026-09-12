/* v1.29 live boot — illustrated POV hands (no Three replacement) */
(function () {
  if (window.__cbLiveBoot) return;
  window.__cbLiveBoot = true;

  var VER = '1.29';

  function add(src, mod) {
    var key = src.split('?')[0];
    if (document.querySelector('script[src^="' + key + '"]')) return;
    var el = document.createElement('script');
    el.src = src;
    if (mod) el.type = 'module';
    document.head.appendChild(el);
  }

  add('desk-v22.js?v=' + VER, false);
  add('patch-gameplay.js?v=' + VER, false);
  add('features-v23.js?v=' + VER, false);
})();
