import LocalizedStrings from "react-localization";
import {useStickyState} from "./stickystate";
import {useContext} from "react";
import {AuthContext} from "../App";

/**
 * Get localized params
 * @param param string or object mapping from locale to text value
 * @param locale (enUS, hyAM, etc)
 */
export const localize = (param: string | {[key: string]: string}, locale?: string): string => {
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

export const useLocalize = () => {
    const auth = useContext(AuthContext);
    const [locale, setLocale] = useStickyState<string>('enUS', `locale-${auth.currentUserId}`);
    const localizeText = (text: string | {[key: string]: string}) => localize(text, locale);
    return [localizeText, setLocale];
};
