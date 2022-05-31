import {createContext} from "react";
import firebase from "firebase/compat/app";


interface AuthContextProps {
    isSignedIn: boolean;
    currentUser: firebase.User | null;
    currentUserId?: string;
    setCurrentUser: (user: firebase.User | null) => void;
}


const AuthContext = createContext<AuthContextProps>({
    isSignedIn: false, currentUser: null, setCurrentUser: () => {}
});

export default AuthContext;
