
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from "../firebase-applet-config.json";
import fs from 'fs';
import path from 'path';

async function fetchVoices() {
  console.log("Initializing Firebase Admin...");
  if (getApps().length === 0) {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }

  const db = getFirestore(firebaseConfig.firestoreDatabaseId);
  
  console.log("Fetching Cartesia API keys from Firestore...");
  const keysSnap = await db.collection('preview_api_keys').get();
  if (keysSnap.empty) {
    console.error("No Cartesia API keys found in Firestore.");
    process.exit(1);
  }

  const apiKey = keysSnap.docs[0].data().key;
  console.log("Found API key. Fetching voices from Cartesia...");

  const response = await fetch("https://api.cartesia.ai/voices", {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2026-08-14"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Cartesia API Error:", errorText);
    process.exit(1);
  }

  const voices = await response.json();
  console.log(`Fetched ${voices.length} voices.`);

  // Cartesia voices don't have "age" or "country" in the base API response usually, 
  // they might be in description or tags. We might need to map them.
  // The user provided a CSV with age before.
  
  const mappedVoices = voices.map((v: any) => ({
    id: v.id,
    name: v.name,
    description: v.description || "",
    language: v.language || "en",
    gender: v.gender || "neutral",
    country: v.country || "US", // Default or extract
    is_high_quality: true,
    is_public: true,
    accents_locales: v.language_locales || v.language,
    age: v.age || "Middle-Aged" // Default or extract
  }));

  const dataPath = path.join(__dirname, '../src/data/voices.json');
  fs.writeFileSync(dataPath, JSON.stringify(mappedVoices, null, 2));
  console.log(`Saved ${mappedVoices.length} voices to ${dataPath}`);
}

fetchVoices().catch(console.error);
