import 'dotenv/config';

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const config = {
  host: process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'),
  port: Number(process.env.PORT || 3001),
  databaseUrl: required('DATABASE_URL'),
  firebaseAdminProjectId: required('FIREBASE_ADMIN_PROJECT_ID'),
  firebaseAdminClientEmail: required('FIREBASE_ADMIN_CLIENT_EMAIL'),
  firebaseAdminPrivateKey: required('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
};
