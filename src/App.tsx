import React, {createContext, useState} from 'react';

import firebase from 'firebase/app';
import './firebase';
import 'firebase/analytics';
import {MuiThemeProvider, createTheme} from '@material-ui/core/styles';

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


interface AuthContextProps {
    isSignedIn: boolean;
    currentUser: firebase.User | null;
    setCurrentUser: (user: firebase.User | null) => void;
}

export const AuthContext = createContext<AuthContextProps | null>(null);


function App() {
    const [currentUser, setCurrentUser] = useState<firebase.User | null>(JSON.parse(localStorage.getItem('user') ?? 'null'));
    const setUser = (user: firebase.User | null) => {
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
    }

    return (
        <MuiThemeProvider theme={theme}>
        <AuthContext.Provider value={{isSignedIn: !!currentUser, currentUser: currentUser, setCurrentUser: setUser}}>
            <Header/>
            <CourseList/>
        </AuthContext.Provider>
        </MuiThemeProvider>
    );
}

export default App;
