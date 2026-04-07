import admin from 'firebase-admin';
import { config } from '../../config/env';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseAdminProjectId,
      clientEmail: config.firebaseAdminClientEmail,
      privateKey: config.firebaseAdminPrivateKey,
    }),
  });
}

export const adminAuth = admin.auth();
