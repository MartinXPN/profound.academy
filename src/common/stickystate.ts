import {useEffect, useState} from "react";


export function safeParse<T>(str: string | null, defaultValue: T) {
    if( !str || str.trim() === '' || str === 'undefined' )
        return defaultValue;
    try {
        return JSON.parse(str);
    }
    catch (e) {
        console.error(`Could not parse "${str}" => ${e}`);
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
    }, [value, key]);
    return [value, setValue];
}
