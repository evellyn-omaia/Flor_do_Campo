import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCcKFCdB4nhoexRHazuOllr7Xry8-OoJ6A",
  authDomain: "flordocampodb.firebaseapp.com",
  databaseURL: "https://flordocampodb-default-rtdb.firebaseio.com",
  projectId: "flordocampodb",
  storageBucket: "flordocampodb.firebasestorage.app",
  messagingSenderId: "375315793258",
  appId: "1:375315793258:web:91703f03e131ad7c819113"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

export default app;
