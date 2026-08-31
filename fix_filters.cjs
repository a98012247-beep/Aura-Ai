const fs = require('fs');
let code = fs.readFileSync('src/pages/VoiceLibrary.tsx', 'utf8');

// replace accents filter option gathering
code = code.replace(
  /const accents = Array\.from\(new Set\(voices\.flatMap\(v =>[\s\S]*?\]\n    \)\.filter\(Boolean\)\)\)\.sort\(\);/m, 
  'const accents = Array.from(new Set(voices.flatMap(v => v.accents ? v.accents.map(a => a.locale) : []).filter(Boolean))).sort();'
);

// replace filter matching
code = code.replace(
  /const matchesAccent = filters\.accent === 'all' \|\| \(v\.accents_locales && v\.accents_locales\.includes\(filters\.accent\)\);/g,
  "const matchesAccent = filters.accent === 'all' || (v.accents && v.accents.some(a => a.locale === filters.accent));"
);

fs.writeFileSync('src/pages/VoiceLibrary.tsx', code);
console.log('Fixed VoiceLibrary filters');
