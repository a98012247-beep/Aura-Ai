import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, addDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, 'members'));
    console.log("Current members:", snap.docs.length);
    let foundUid = null;
    snap.docs.forEach(d => {
      console.log(d.id, "=>", d.data());
      if (d.data().email === 'a98012247@gmail.com') {
        foundUid = d.id;
      }
    });

    if (foundUid) {
      console.log("Found user, making admin...");
      await setDoc(doc(db, 'members', foundUid), { role: 'admin' }, { merge: true });
    } else {
      console.log("User not found. They might need to sign in first. Creating a temporary dummy admin just in case.");
      await setDoc(doc(db, 'members', 'dummy_admin_uid'), { 
        email: 'a98012247@gmail.com', 
        name: 'Admin', 
        role: 'admin',
        createdAt: new Date()
      });
    }

    // Seed dummy data
    const dummyMembers = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];
    for (const dEmail of dummyMembers) {
      await addDoc(collection(db, 'members'), {
        email: dEmail,
        name: dEmail.split('@')[0],
        role: 'free',
        status: 'active',
        credits: 5000,
        createdAt: new Date(Date.now() - 1000000000),
        lastLoginAt: new Date()
      });
    }

    // Add some dummy usage
    for (let i = 0; i < 10; i++) {
      await addDoc(collection(db, 'usage'), {
        email: dummyMembers[i % dummyMembers.length],
        tool: 'Text to Speech',
        model: 'cartesia',
        characters: Math.floor(Math.random() * 500),
        duration: Math.floor(Math.random() * 10),
        timestamp: new Date(Date.now() - Math.random() * 1000000000)
      });
    }

    // Add earnings
    await addDoc(collection(db, 'earnings'), {
      amount: 5000,
      description: 'Pro Subscription - Alice',
      timestamp: new Date()
    });
    
    // Add dummy API keys
    await addDoc(collection(db, 'platform_api_keys'), {
      name: 'Default Cartesia Key',
      key: 'sk_cartesia_dummy_key_123',
      isActive: true,
      usageCount: 0,
      totalCharactersUsed: 0,
      createdAt: new Date()
    });

    console.log("Done seeding.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
