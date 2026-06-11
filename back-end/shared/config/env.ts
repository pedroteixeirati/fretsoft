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
  fiscalModuleEnabled: (process.env.FISCAL_MODULE_ENABLED || 'true').trim().toLowerCase() !== 'false',
  // Piso minimo de frete (R$) para alerta nao-bloqueante ao pagar TAC. 0 = desligado.
  // Simplificacao ate a integracao das tabelas oficiais da ANTT (distancia/eixos/carga).
  fiscalPisoMinFreight: Number(process.env.FISCAL_PISO_MIN_FREIGHT || 0),
};
