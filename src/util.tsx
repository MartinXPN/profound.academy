import {MutableRefObject, useEffect, useState} from "react";



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
    }, [value, key]);
    return [value, setValue];
}


export function useOnScreen(ref: MutableRefObject<any>) {

    const [isIntersecting, setIntersecting] = useState(false);
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting));

    useEffect(() => {
        if( ref.current )
            observer.observe(ref.current);
        // Remove the observer as soon as the component is unmounted
        return () => { observer.disconnect() }
        // intentionally not include observer as it's created on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref]);

    return isIntersecting;
}
