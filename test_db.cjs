const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');

initializeApp({ projectId: config.projectId });
const db = getFirestore(config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await db.collection('preview_api_keys').get();
    console.log("Docs:", snap.docs.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
run();
