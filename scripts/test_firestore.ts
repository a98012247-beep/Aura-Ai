import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from "../firebase-applet-config.json";

async function testFirestore() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }

  // Try with default db first
  console.log("Testing default DB...");
  const dbDefault = getFirestore();
  try {
    const collections = await dbDefault.listCollections();
    console.log("Default DB collections:", collections.map(c => c.id));
  } catch (e: any) {
    console.error("Default DB failed:", e.message);
  }

  // Try with config db
  console.log("Testing config DB:", firebaseConfig.firestoreDatabaseId);
  const dbConfig = getFirestore(firebaseConfig.firestoreDatabaseId);
  try {
    const collections = await dbConfig.listCollections();
    console.log("Config DB collections:", collections.map(c => c.id));
  } catch (e: any) {
    console.error("Config DB failed:", e.message);
  }
}

testFirestore().catch(console.error);
