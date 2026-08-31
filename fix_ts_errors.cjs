const fs = require('fs');

// 1. Fix server.ts (add cartesiaGenerationCache and crypto)
let serverCode = fs.readFileSync('server.ts', 'utf8');
if (!serverCode.includes('const cartesiaGenerationCache = new Map<string, Buffer>();')) {
  // Just inject it at the top
  serverCode = `import crypto from 'crypto';\nconst cartesiaGenerationCache = new Map<string, Buffer>();\n` + serverCode;
  fs.writeFileSync('server.ts', serverCode);
}

// 2. Fix cartesia.ts (add fetchVoices)
let cartesiaCode = fs.readFileSync('src/services/cartesia.ts', 'utf8');
if (!cartesiaCode.includes('export async function fetchVoices')) {
  cartesiaCode += `
export async function fetchVoices(): Promise<any[]> {
  const authHeaders = await getAuthHeader();
  const response = await fetch('/api/cartesia/voices', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
  });

  if (!response.ok) {
    const errText = await parseApiError(response);
    throw new Error(\`Failed to fetch voices: \${response.statusText} - \${errText}\`);
  }

  const data = await response.json();
  return data || [];
}
`;
  fs.writeFileSync('src/services/cartesia.ts', cartesiaCode);
}

// 3. Fix Settings.tsx and Studio.tsx (remove unused fetchSubscription arguments if any)
// Settings.tsx
let settingsCode = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
settingsCode = settingsCode.replace(/fetchSubscription\(.*?\)/g, 'fetchSubscription()');
fs.writeFileSync('src/pages/Settings.tsx', settingsCode);

// Studio.tsx
let studioCode = fs.readFileSync('src/pages/Studio.tsx', 'utf8');
studioCode = studioCode.replace(/fetchSubscription\(.*?\)/g, 'fetchSubscription()');
fs.writeFileSync('src/pages/Studio.tsx', studioCode);

// generation.ts
let genCode = fs.readFileSync('src/store/generation.ts', 'utf8');
genCode = genCode.replace(/fetchSubscription\(.*?\)/g, 'fetchSubscription()');
fs.writeFileSync('src/store/generation.ts', genCode);

console.log('Fixed typescript issues');
