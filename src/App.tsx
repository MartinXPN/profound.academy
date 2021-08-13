import React from 'react';

import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import 'firebase/firestore';

import './App.css';
import Auth from "./auth/Auth";


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCoZzYEGYmfNgEwVN2thZcAmQ7NBqnzlBQ",
    authDomain: "profound-academy.firebaseapp.com",
    projectId: "profound-academy",
    storageBucket: "profound-academy.appspot.com",
    messagingSenderId: "344681371914",
    appId: "1:344681371914:web:1f4967125a364c0c4e42f3",
    measurementId: "G-5EM92EE4GL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();


function App() {
    return (
        <div className="App">
            <header className="App-header">
                <Auth />
            </header>
        </div>
    );
}

export default App;
