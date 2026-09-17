const admin = require('firebase-admin');

// IMPORTANT: The user needs to provide their service account key JSON file
// and point to it via the FIREBASE_SERVICE_ACCOUNT_PATH environment variable,
// or provide the individual values as env vars.
// For now, this is a placeholder initialization that expects env variables.

// To get the service account: Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Customer Backend: Firebase Admin initialized successfully using service account file.');
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            })
        });
        console.log('Customer Backend: Firebase Admin initialized successfully using env variables.');
    } else {
        console.warn('Customer Backend WARNING: Firebase Admin not initialized. Missing credentials in .env');
    }
} catch (error) {
    console.error('Customer Backend: Firebase Admin initialization error', error);
}

module.exports = admin;
