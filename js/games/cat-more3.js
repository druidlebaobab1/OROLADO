/* v2807 — more3 catalogue (owner request: full lobby rows): Lucky Planets (live draw, casino_lib.php casino_draw_*) and
   Star Bowling (instant, server fiche casino_ext/more3.php). */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  var hi = function (x, y, r) { return '<ellipse cx="' + (x - r * .34) + '" cy="' + (y - r * .4) + '" rx="' + (r * .34) + '" ry="' + (r * .22) + '" fill="#fff" opacity=".6" transform="rotate(-30 ' + (x - r * .34) + ' ' + (y - r * .4) + ')"/>'; };
  var ICONS = {
    planets: '<defs>' + rg('IDa', '#FFF3C4', '#F59E0B', '#9A3412') + rg('IDb', '#E0F2FE', '#38BDF8', '#1E3A8A') + rg('IDc', '#FFE4E6', '#F43F5E', '#881337') + lg('IDr', '#FDE68A', '#B45309') +
      '<linearGradient id="IDt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
      '<ellipse cx="32" cy="57" rx="24" ry="4.5" fill="#000" opacity=".28"/>' +
      '<ellipse cx="32" cy="34" rx="29" ry="9" fill="none" stroke="#C4B5FD" stroke-opacity=".55" stroke-width="1.2" transform="rotate(-14 32 34)"/>' +
      '<path d="M8 41a26 8 -14 0 0 50-13" fill="none" stroke="url(#IDr)" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="32" cy="32" r="15" fill="url(#IDa)"/>' + hi(32, 32, 15) +
      '<path d="M18.5 38a15 4.2 -14 0 0 28-7" fill="none" stroke="url(#IDr)" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="10" cy="20" r="6.5" fill="url(#IDb)"/>' + hi(10, 20, 6.5) + '<circle cx="54" cy="47" r="5.5" fill="url(#IDc)"/>' + hi(54, 47, 5.5) +
      '<path d="M37 8L53 13" stroke="url(#IDt)" stroke-width="2.6" stroke-linecap="round"/><circle cx="54" cy="13.4" r="2.6" fill="#fff"/><circle cx="54" cy="13.4" r="5" fill="#fff" opacity=".25"/>',
    bowling: '<defs>' + rg('IDa', '#E9D5FF', '#8B5CF6', '#3B0764') + '<linearGradient id="IDp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CBD5E1"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#A8B3C4"/></linearGradient></defs>' +
      '<ellipse cx="32" cy="57.5" rx="27" ry="4.5" fill="#000" opacity=".3"/>' +
      (function () { var pin = function (x, y, r, s) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')"><path d="M0-30c-3.4 0-4.6 3-4.6 6 0 3.6 2 5.4 2 8.4 0 3-5.4 7-5.4 14.6 0 5 2 8.6 3 10h10c1-1.4 3-5 3-10 0-7.6-5.4-11.6-5.4-14.6 0-3 2-4.8 2-8.4 0-3-1.2-6-4.6-6z" fill="url(#IDp)" stroke="#94A3B8" stroke-width=".6"/><path d="M-3.3-17.5h6.6M-3-14.8h6" stroke="#E11D48" stroke-width="1.8"/><path d="M-2.4-26c-.6 2 0 4.5.6 6" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".9"/></g>'; };
        return pin(44, 37, 14, 1.02) + pin(53, 40, 24, .9); })() +
      '<circle cx="24" cy="38" r="17.5" fill="url(#IDa)"/>' + hi(24, 38, 17.5) +
      '<circle cx="21" cy="31" r="2.6" fill="#1E0B3B"/><circle cx="28" cy="30" r="2.6" fill="#1E0B3B"/><circle cx="25" cy="37" r="3.1" fill="#1E0B3B"/>' +
      '<path d="M10.5 46a17 17 0 0 0 10 8" stroke="#F0ABFC" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M13 9l1.3 3.4 3.4 1.3-3.4 1.3L13 18.4l-1.3-3.4-3.4-1.3 3.4-1.3z" fill="#FDE68A"/>'
  };
  D6.CasinoCatalog.add([
    { k: 'planets', name: 'Lucky Planets', sec: 'live', file: 'planets', pal: ['#EDE9FE', '#7C3AED'], icon: ICONS.planets },
    { k: 'bowling', name: 'Star Bowling', sec: 'more', file: 'bowling', pal: ['#FAE8FF', '#A21CAF'], icon: ICONS.bowling }
  ]);
})(window.D6 = window.D6 || {});
