// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import 'firebase/auth'
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA2usC5r3Lfv3YTaGWQ1HcsPaaLAisg5lE",
  authDomain: "chatbot-331b4.firebaseapp.com",
  projectId: "chatbot-331b4",
  storageBucket: "chatbot-331b4.appspot.com",
  messagingSenderId: "942490082396",
  appId: "1:942490082396:web:05055793e1dd561ab01a99",
  measurementId: "G-SZBHLVM8BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
export default app