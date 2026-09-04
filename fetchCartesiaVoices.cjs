const fs = require('fs');
const https = require('https');

const API_KEY = 'sk_car_9J1qnmLYaMvTkcEi5b7Qxq';
const VERSION = '2026-08-14';

async function fetchAllVoices() {
  let allVoices = [];
  let hasMore = true;
  let startingAfter = null;

  console.log('Fetching voices from Cartesia...');
  
  while (hasMore) {
    // using dynamic import for node-fetch if available, or just fetch natively since node 18+ has fetch
    try {
      let url = `https://api.cartesia.ai/voices?limit=100`;
      if (startingAfter) {
        url += `&starting_after=${startingAfter}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Cartesia-Version': VERSION,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Cartesia API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.data.length} voices...`);
      allVoices = allVoices.concat(data.data);
      
      hasMore = data.has_more;
      if (hasMore && data.data.length > 0) {
        startingAfter = data.data[data.data.length - 1].id;
      }
    } catch (e) {
      console.error('Error fetching:', e);
      break;
    }
  }

  console.log(`Total voices fetched: ${allVoices.length}`);
  
  const fileContent = `export const CARTESIA_DEFAULT_MODEL = "sonic-3.6";\n\nexport const MASTER_CARTESIA_VOICES = ${JSON.stringify(allVoices, null, 2)};\n`;
  
  fs.writeFileSync('src/data/cartesiaVoices.ts', fileContent);
  console.log('Successfully wrote to src/data/cartesiaVoices.ts');
}

fetchAllVoices();
