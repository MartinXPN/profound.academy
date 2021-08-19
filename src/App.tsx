import React from 'react';

import firebase from 'firebase/app';
import 'firebase/analytics';
import { MuiThemeProvider, createTheme } from '@material-ui/core/styles';

import Content from "./content/Content";
import Editor from "./editor/Editor";
import Header from "./header/Header";
import './App.css';
import CourseList from "./course-list/CourseList";


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

const theme = createTheme({
    palette: {
        primary: {
            main: '#4B5FAA',
        },
        secondary: {
            main: '#37a4dc'
        }
    }
});

function App() {
    return (
        <MuiThemeProvider theme={theme}>
            <Header />
            {/*<div className="App">*/}
            {/*    <Content />*/}
            {/*    <Auth />*/}
            {/*</div>*/}
            {/*<Editor />*/}
            <CourseList />
        </MuiThemeProvider>
    );
}

export default App;
