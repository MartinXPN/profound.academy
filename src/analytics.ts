import {useEffect} from "react";
import { getAnalytics, logEvent } from "firebase/analytics";

export const useScreenAnalytics = (screenName: string) => {
    return useEffect(() => {
        const analytics = getAnalytics();
        logEvent(analytics, 'screen_view', {
            firebase_screen: screenName,
            firebase_screen_class: 'ReactScreenClass',
        });
    }, [screenName]);
};
