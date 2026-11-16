'use strict';
window.mogulIcon=function(name){
  const art={
    venues:'<path d="M3 21V12h5v9M8 21V6h7v15M15 21V10h6v11M5 15h1m5-5h1m-1 4h1m5-1h1m-1 4h1"/>',
    shifts:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3m-13 5h18m-11 0v3h4v-3"/>',
    cash:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h1m10 0h1"/>',
    rep:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/>',
    rank:'<path d="m4 7 4 5 4-7 4 7 4-5-2 12H6z"/>',
    club:'<path d="M4 19v-5m4 5V8m4 11V4m4 15v-9m4 9v-5"/>',
    rooftop:'<path d="M3 20h18M5 17V9h14v8M8 9V5m8 4V5M3 13h18"/>',
    concert:'<path d="M9 13a4 4 0 0 0 6 2l5-5a4 4 0 0 0-6-6l-5 5a4 4 0 0 0 0 4Zm1 2-6 6m9-14 4 4"/>',
    vinyl:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0 1 7-7"/>',
    loft:'<path d="M3 20V9l9-5 9 5v11H3Zm0-6h18m-12 6v-6m6 6v-6"/>',
    terrace:'<path d="M3 14h18m-18 6h18m-15 0v-6m6 6v-6m6 6v-6"/><path d="M8 10a4 4 0 1 1 8 0"/>',
    jazz:'<path d="M8 18V6l12-3v12M8 10l12-3"/><ellipse cx="5" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="15" rx="3" ry="2"/>',
    warehouse:'<path d="M3 20V7l9-4 9 4v13Zm5 0v-8h8v8m-8-4h8"/>',
    speakeasy:'<path d="M5 21V3h14v18H5Zm4-9h6m1 4h1"/>',
    door:'<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a4 4 0 0 1 6 0m3-6h4m-4 4h4"/>',
    service:'<path d="M3 10h18M5 10a7 7 0 0 1 14 0m-7-7v-1M4 14h16m-14 4h12"/>',
    promo:'<path d="M3 10h5l10-5v14l-10-5H3Zm5 4 2 6m11-11v6"/>'
  }[name];
  const node=document.createElementNS('http://www.w3.org/2000/svg','svg');
  node.setAttribute('viewBox','0 0 24 24');
  node.setAttribute('fill','none');node.setAttribute('stroke','currentColor');node.setAttribute('stroke-width','1.6');
  node.setAttribute('stroke-linejoin','round');node.setAttribute('stroke-linecap','round');
  node.setAttribute('aria-hidden','true');node.classList.add('mogul-icon');
  node.innerHTML=art||'<circle cx="12" cy="12" r="7"/>';
  return node;
};
