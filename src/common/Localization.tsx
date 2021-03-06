import LocalizedStrings from "react-localization";
import {useStickyState} from "./stickystate";
import {createContext, memo, ReactNode, useCallback, useContext, useEffect} from "react";
import {AuthContext} from "../App";
import { useSearchParams } from "react-router-dom";
import useAsyncEffect from "use-async-effect";
import {updateUserPreferredLocale} from "../services/users";

interface LocalizeContextProps {
    localize: (text: string | {[key: string]: string}) => string;
    locale: string;
    setLocale: (locale: string) => void;
}
export const LocalizeContext = createContext<LocalizeContextProps>({
    localize: text => '',
    locale: 'enUS',
    setLocale: locale => {},
});

/**
 * Get localized params
 * @param param string or object mapping from locale to text value
 * @param locale (enUS, hyAM, etc)
 */
const localize = (param: string | {[key: string]: string}, locale?: string): string => {
    if( !param )
        return '';
    if( typeof param === 'string' )
        return param;

    const localeToParamText: {[key: string]: {value: string}} = {};
    Object.entries(param).forEach(([locale, text]) => {
        localeToParamText[locale] = {value: text};
    });

    const localizedStrings = new LocalizedStrings(localeToParamText);
    locale && localizedStrings.setLanguage(locale);
    return localizedStrings.value;
};

const useLocalize = (): [
    (text: string | {[key: string]: string}) => string, string, (locale: string) => void
] => {
    const auth = useContext(AuthContext);
    const [locale, setLocale] = useStickyState<string>('enUS', `locale-${auth.currentUserId}`);
    const localizeText = useCallback((text: string | {[key: string]: string}) => localize(text, locale), [locale]);
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const lang = searchParams.get('lang')
        console.log('lang search param:', lang);
        if( lang )
            setLocale(lang);
    }, [searchParams, setLocale]);
    return [localizeText, locale, setLocale];
};

function Localization({children}: { children: ReactNode }) {
    const auth = useContext(AuthContext);
    const [localizeText, locale, setLocale] = useLocalize();

    // Update user preferred-locale
    useAsyncEffect(async () => {
        if( auth.currentUserId )
            return await updateUserPreferredLocale(auth.currentUserId, locale);
    }, [auth.currentUserId, locale]);

    return <>
        <LocalizeContext.Provider value={{
            localize: localizeText,
            locale: locale,
            setLocale: setLocale,
        }}>
            {children}
        </LocalizeContext.Provider>
    </>
}

export default memo(Localization);
