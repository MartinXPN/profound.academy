import React from 'react';

import firebase from 'firebase/app';
import './firebase';
import { MuiThemeProvider, createTheme } from '@material-ui/core/styles';

import Header from "./header/Header";
import CourseList from "./course-list/CourseList";
import './App.css';

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
