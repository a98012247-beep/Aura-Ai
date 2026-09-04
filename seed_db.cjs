const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const config = require('./firebase-applet-config.json');

initializeApp({
  projectId: config.projectId,
});

const db = getFirestore(config.firestoreDatabaseId);
const auth = getAuth();

async function seed() {
  try {
    // 1. Make the user an admin
    const email = 'a98012247@gmail.com';
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log('User found:', user.uid);
      await db.collection('members').doc(user.uid).set({
        email: email,
        name: 'Admin User',
        role: 'admin',
        status: 'active',
        credits: 999999,
        createdAt: new Date(),
        lastLoginAt: new Date()
      }, { merge: true });
      console.log('Admin user updated in members collection.');
    } catch (e) {
      console.log('User not found by email. They must sign in first.');
    }

    // 2. Add some dummy users
    const dummyMembers = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];
    for (const dEmail of dummyMembers) {
      await db.collection('members').add({
        email: dEmail,
        name: dEmail.split('@')[0],
        role: 'free',
        status: 'active',
        credits: 5000,
        createdAt: new Date(Date.now() - 1000000000),
        lastLoginAt: new Date()
      });
    }

    // 3. Add some dummy usage
    for (let i = 0; i < 10; i++) {
      await db.collection('usage').add({
        email: dummyMembers[i % dummyMembers.length],
        tool: 'Text to Speech',
        model: 'cartesia',
        characters: Math.floor(Math.random() * 500),
        duration: Math.floor(Math.random() * 10),
        timestamp: new Date(Date.now() - Math.random() * 1000000000)
      });
    }

    // 4. Add some earnings
    await db.collection('earnings').add({
      amount: 5000,
      description: 'Pro Subscription - Alice',
      timestamp: new Date()
    });

    console.log('Database seeded successfully!');
  } catch (e) {
    console.error(e);
  }
}

seed();
