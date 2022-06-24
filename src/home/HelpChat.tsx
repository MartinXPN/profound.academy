import {memo, useEffect} from "react";

function HelpChat() {
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
