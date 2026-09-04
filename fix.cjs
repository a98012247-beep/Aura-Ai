const fs = require('fs');
let code = fs.readFileSync('src/store/settings.ts', 'utf-8');
code = code.replace(/\\`custom-profile-\\\$\{uuidv4\(\)\}\\`/g, '`custom-profile-${uuidv4()}`');
fs.writeFileSync('src/store/settings.ts', code);
