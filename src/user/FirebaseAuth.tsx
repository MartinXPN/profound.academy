import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import * as firebaseui from 'firebaseui';
import 'firebaseui/dist/firebaseui.css';

interface Props {
    // The Firebase UI Web UI Config object.
    // See: https://github.com/firebase/firebaseui-web#configuration
    uiConfig: firebaseui.auth.Config;
    // Callback that will be passed the FirebaseUi instance before it is
    // started. This allows access to certain configuration options such as
    // disableAutoSignIn().
    uiCallback?(ui: firebaseui.auth.AuthUI): void;
    // The Firebase App auth instance to use.
    firebaseAuth: any; // As firebaseui-web
    className?: string;
}


const FirebaseAuth = ({uiConfig, firebaseAuth, className, uiCallback}: Props) => {
    const [userSignedIn, setUserSignedIn] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        // Get or Create a firebaseUI instance.
        const firebaseUiWidget = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebaseAuth);
        if (uiConfig.signInFlow === 'popup')
            firebaseUiWidget.reset();

        // We track the auth state to reset firebaseUi if the user signs out.
        const unregisterAuthObserver = onAuthStateChanged(firebaseAuth, user => {
            if (!user && userSignedIn)
                firebaseUiWidget.reset();
            setUserSignedIn(!!user);
        });

        // Trigger the callback if any was set.
        if (uiCallback)
            uiCallback(firebaseUiWidget);

        // Render the firebaseUi Widget.
        // @ts-ignore
        firebaseUiWidget.start(elementRef.current, uiConfig);

        return () => {
            unregisterAuthObserver();
            firebaseUiWidget.reset();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firebaseui, uiConfig]);

    return <div className={className} ref={elementRef} />;
};

export default FirebaseAuth;
