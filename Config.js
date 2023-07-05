// Import the functions you need from the SDKs you need
import firebase from "firebase";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHaPuGPjsvwDY8NlshQ_Y2e7dBKxQwfD0",
  authDomain: "biblioteca-acea6.firebaseapp.com",
  projectId: "biblioteca-acea6",
  storageBucket: "biblioteca-acea6.appspot.com",
  messagingSenderId: "445246399005",
  appId: "1:445246399005:web:a0bb5f4ce039ad9d681cf4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase.firestore();