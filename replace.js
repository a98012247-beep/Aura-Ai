const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf-8');

const target = `              <p className="font-bold text-red-200 mb-1">Cartesia Audio Notice</p>
              <p className="text-red-300 leading-relaxed">{previewError}</p>
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="mt-2.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  Manage API Keys in Admin Panel
                </button>
              )}`;

const replacement = `              <p className="font-bold text-red-200 mb-1">Notice</p>
              <p className="text-red-300 leading-relaxed">
                {previewError.includes('Cartesia') || previewError.includes('API') ? 'An error occurred during generation.' : previewError}
                <br /><br />
                Need help? <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white">Contact support on WhatsApp</a>
              </p>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/pages/Home.tsx', content);
  console.log('Replaced Home.tsx successfully');
} else {
  console.log('Target not found in Home.tsx');
}
