import {useEffect, useState} from "react";



function safeParse<T>(str: string | null, defaultValue: T) {
    if( !str )
        return defaultValue;
    try {
        return JSON.parse(str);
    }
    catch (e) {
        console.error(e);
        return defaultValue;
    }
}

/**
 * Save the result of setState to a local storage
 * @param defaultValue the default value to use if it's accessed for the first time (can be anything serializable to JSON)
 * @param key which string to use for saving the value
 */
export function useStickyState<T>(defaultValue: T, key: string) {
    const [value, setValue] = useState(() => {
        const storageValue = localStorage.getItem(key);
        return safeParse(storageValue, defaultValue);
    });
    useEffect(() => {
        const storageValue = localStorage.getItem(key);
        const stickyValue = safeParse(storageValue, defaultValue);
        localStorage.setItem(key, JSON.stringify(stickyValue));
        setValue(stickyValue);
    }, [defaultValue, key]);
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
        // intentionally not include the `key` parameter in deps so that the previous useEffect runs on-key-change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    return [value, setValue];
}
