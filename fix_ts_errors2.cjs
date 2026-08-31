const fs = require('fs');

// 1. Remove duplicate crypto import in server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');
if (serverCode.startsWith('import crypto from \'crypto\';\nimport crypto from \'crypto\';')) {
  serverCode = serverCode.replace('import crypto from \'crypto\';\nimport crypto from \'crypto\';', 'import crypto from \'crypto\';');
  fs.writeFileSync('server.ts', serverCode);
}

// 2. Settings.tsx fix
let settingsCode = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
settingsCode = settingsCode.replace(/fetchSubscription\(.*?\)/g, 'fetchSubscription()');
fs.writeFileSync('src/pages/Settings.tsx', settingsCode);

// 3. generation.ts fix
let genCode = fs.readFileSync('src/store/generation.ts', 'utf8');
genCode = genCode.replace(/fetchSubscription\(.*?\)/g, 'fetchSubscription()');
fs.writeFileSync('src/store/generation.ts', genCode);

console.log('Fixed duplicate crypto and remaining arguments');
