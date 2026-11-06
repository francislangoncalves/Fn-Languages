// Pós-build: injeta manifest, ícones e registro do service worker no dist/index.html
const fs = require('fs');
const file = 'dist/index.html';
let html = fs.readFileSync(file, 'utf8');
const tags = `
<style>html,body{background:#0F1222}</style>
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0F1222" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Lingua Tutor" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="icon" type="image/png" href="/favicon.png" />
<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}</script>
`;
if (!html.includes('rel="manifest"')) html = html.replace('</head>', tags + '</head>');
// viewport-fit para áreas seguras do iPhone
html = html.replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />');
fs.writeFileSync(file, html);
console.log('PWA tags injetadas em', file);
