import {memo, useContext, useEffect} from "react";
import {AuthContext} from "../App";

function HelpChat() {
    const auth = useContext(AuthContext);

    useEffect(() => {
        // @ts-ignore
        if( !window.Tawk_API )
            return;

        try {
            // @ts-ignore
            window.Tawk_API.setAttributes({
                id: auth.currentUser?.uid,
                name: auth.currentUser?.displayName,
                email: auth.currentUser?.email,
            }, (error: any) => error && console.warn('tawk error:', error));
        }
        catch (e) {
            console.warn('tawk error:', e);
        }
        // @ts-ignore
    }, [auth.currentUser, window.Tawk_API]);

    useEffect(() => {
        const s1 = document.createElement('script');
        const s0 = document.getElementsByTagName('script')[0];
        s1.async = true;
        s1.src = 'https://embed.tawk.to/62b53e0b7b967b117996423b/1g69vknmo';

        s1.setAttribute('crossorigin', '*');
        s0?.parentNode?.insertBefore(s1, s0);
    }, []);

    return <></>
}

export default memo(HelpChat);
