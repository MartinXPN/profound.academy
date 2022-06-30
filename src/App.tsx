import {Suspense, createContext, lazy, useEffect, useContext} from 'react';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import './firebase';

import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';
import {Helmet, HelmetProvider} from 'react-helmet-async';

import {updateUserInfo} from "./services/users";
import {useStickyState} from "./common/stickystate";
import ErrorBoundary from './common/ErrorBoundary';
import Home from './home/Home';
import About from "./home/About";
import UserProfile from './user/UserProfile';
import Localization, {LocalizeContext} from "./common/Localization";
import Privacy from "./home/Privacy";
import TermsAndConditions from "./home/TermsAndConditions";
import FAQ from "./home/FAQ";
// Do not include the Course and the editor in the main bundle as they're pretty heavy
const Course = lazy(() => import('./course/Course'));
const CourseEditor = lazy(() => import('./course/CourseEditor'));


const theme = createTheme({
    typography: {
        h1: {fontSize: 48},
        h2: {fontSize: 30},
        h3: {fontSize: 26},
        h4: {fontSize: 20},
        h5: {fontSize: 18},
        h6: {fontSize: 16},
    },
    palette: {
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        primary: {
            main: '#4B5FAA',
        },
        secondary: {
            main: '#0F1729'
        },
        info: {
            main: '#f44336'
        }
    }
});

const MetaTags = () => {
    const {locale} = useContext(LocalizeContext);
    return <>
        <Helmet>
            <html lang={locale.substring(0, 2)} />
            <title>Profound Academy</title>
        </Helmet>
    </>
}

interface AuthContextProps {
    isSignedIn: boolean;
    currentUser: firebase.User | null;
    currentUserId?: string;
    setCurrentUser: (user: firebase.User | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
    isSignedIn: false, currentUser: null, setCurrentUser: () => {}
});


function App() {
    const [currentUser, setCurrentUser] = useStickyState<firebase.User | null>(null, 'user');

    // Listen to the Firebase Auth state and set the local state.
    useEffect(() => {
        return firebase.auth().onAuthStateChanged(user => {
            console.log('auth state changed...', user);
            if( user )
                updateUserInfo(user.uid, user.displayName ?? undefined, user.photoURL ?? undefined)
                    .then(() => console.log('Successfully updated user info'));
            setCurrentUser(user);
        });
    }, [setCurrentUser]);


    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
            <AuthContext.Provider value={{
                isSignedIn: !!currentUser,
                currentUser: currentUser,
                currentUserId: currentUser?.uid ?? undefined,
                setCurrentUser: setCurrentUser,
            }}>
            <ErrorBoundary>
            <Router>
            <Localization>
            <HelmetProvider>
            <MetaTags/>
            <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                    <Route path="/" element={<Home/>} />
                    <Route path="/about" element={<About/>} />
                    <Route path="/faq" element={<FAQ/>} />
                    <Route path="/privacy" element={<Privacy/>} />
                    <Route path="/terms" element={<TermsAndConditions/>} />
                    <Route path="/users/:userId" element={<UserProfile/>} />
                    <Route path="/new" element={<CourseEditor/>} />
                    <Route path=":courseId" element={<Course/>} />
                    <Route path=":courseId/*" element={<Course/>} />
                </Routes>
            </Suspense>
            </HelmetProvider>
            </Localization>
            </Router>
            </ErrorBoundary>
            </AuthContext.Provider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}

export default App;
