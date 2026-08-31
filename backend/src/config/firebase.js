const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const fs = require("node:fs");
const path = require("node:path");

const serviceAccountPath = path.resolve(
  __dirname,
  "../../firebase-service-account.json"
);

const getServiceAccount = () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  const hasEnvironmentCredentials =
    FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY;

  if (hasEnvironmentCredentials) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  if (fs.existsSync(serviceAccountPath)) {
    return require(serviceAccountPath);
  }

  throw new Error(
    "Credenciais do Firebase Admin ausentes. Configure FIREBASE_PROJECT_ID, " +
      "FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY ou disponibilize " +
      "backend/firebase-service-account.json no ambiente local."
  );
};

if (!process.env.FIREBASE_DATABASE_URL) {
  throw new Error("A variavel FIREBASE_DATABASE_URL nao foi configurada.");
}

initializeApp({
  credential: cert(getServiceAccount()),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = getDatabase();

module.exports = db;
