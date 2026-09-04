import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const raw = fs.readFileSync('firebase-applet-config.json');
const config = JSON.parse(raw);
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDocs(collection(db, 'platform_api_keys'));
    console.log('Keys:', snap.size);
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
check();
