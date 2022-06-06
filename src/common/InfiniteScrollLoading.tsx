import {memo, MutableRefObject, useEffect, useRef, useState} from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

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


function InfiniteScrollLoading({hasMore, loadMore}: {hasMore: boolean, loadMore: () => void}) {
    const ref = useRef();
    const isVisible = useOnScreen(ref);

    if( hasMore && isVisible )
        loadMore();

    return <>
        <Box ref={ref} paddingBottom="5em">
            {isVisible && hasMore &&
            <Box sx={{ textAlign: 'center', width: '100%', margin: '1em' }}>
                <CircularProgress />
            </Box>}
        </Box>
    </>
}

export default memo(InfiniteScrollLoading);
