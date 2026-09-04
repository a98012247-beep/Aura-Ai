const fs = require('fs');
let code = fs.readFileSync('src/pages/VoiceLibrary.tsx', 'utf8');

const targetPreview = 'const res = await fetch(`/api/voice/preview/${voiceId}`);';
const newPreview = `
        const previewText = "Hello, I am " + (voices.find(v => v.id === voiceId)?.name || "a Cartesia voice") + ". " + (voices.find(v => v.id === voiceId)?.description || "");
        const res = await fetch('/api/cartesia/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: previewText, voiceId })
        });
`;
code = code.replace(targetPreview, newPreview);
fs.writeFileSync('src/pages/VoiceLibrary.tsx', code);
console.log('Fixed preview logic');
