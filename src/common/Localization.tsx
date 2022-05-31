import LocalizedStrings from "react-localization";
import {useStickyState} from "./stickystate";
import {createContext, memo, ReactNode, useCallback, useContext, useEffect} from "react";
import AuthContext from "../user/AuthContext";
import {useRouter} from "next/router";

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
    const router = useRouter();
    const [locale, setLocale] = useStickyState<string>('enUS', `locale-${auth.currentUserId}`);
    const localizeText = useCallback((text: string | {[key: string]: string}) => localize(text, locale), [locale]);
    const {lang} = router.query;
    useEffect(() => {
        console.log('lang search param:', lang);
        if( lang )
            setLocale(lang);
    }, [lang, setLocale]);
    return [localizeText, locale, setLocale];
};

function Localization({children}: { children: ReactNode }) {
    const [localizeText, locale, setLocale] = useLocalize();
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
