import {useEffect, useState} from "react";


/**
 * Save the result of setState to a local storage
 * @param defaultValue the default value to use if it's accessed for the first time (can be anything serializable to JSON)
 * @param key which string to use for saving the value
 */
export function useStickyState<T>(defaultValue: T, key: string) {
    const [value, setValue] = useState(() => {
        const stickyValue = localStorage.getItem(key);
        return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    });
    useEffect(() => {
        let stickyValue = localStorage.getItem(key);
        stickyValue = stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
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
