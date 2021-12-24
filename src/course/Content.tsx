import React, {useRef, useState} from 'react';
import useAsyncEffect from "use-async-effect";

import {ExtendedRecordMap} from "notion-types/src/maps";
import {Code, Collection, CollectionRow, Equation, Modal, NotionRenderer} from 'react-notion-x'
import { highlightAll } from "prismjs";
import 'prismjs/themes/prism.css';          // used for code syntax highlighting (optional)
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'rc-dropdown/assets/index.css';      // used for collection views (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations (optional)
import {CircularProgress} from "@mui/material";

import {getNotionPageMap} from "../services/courses";


function Content({notionPage}: {notionPage: string}) {
    const isMounted = useRef(false)
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);

    useAsyncEffect(async () => {
        isMounted.current = true;
        setRecordMap(null);
        const map = await getNotionPageMap(notionPage);
        console.log({map: map});

        // @ts-ignore
        isMounted.current && setRecordMap(map);

        // TODO: Get the languages from record map obtained from getPage()
        const languages = ['cpp', 'python'];
        // @ts-ignore
        await import('prismjs/components/prism-c.min');
        await Promise.all(languages.map(l => import(`prismjs/components/prism-${l}.min`)));
        highlightAll();
    }, () => isMounted.current = false, [notionPage]);

    return <>
        {/*Fix issue where the user is prevented from selecting text: https://github.com/NotionX/react-notion-x/issues/81*/}
        <style>{`
            .notion-viewport {
                z-index: -1;
            }
        `}</style>

        {recordMap ?
        <NotionRenderer
            recordMap={recordMap}
            fullPage={false}
            darkMode={false}
            components={{
                code: Code,
                collection: Collection,
                collectionRow: CollectionRow,
                modal: Modal,
                equation: Equation,
            }}
        /> :
        <div style={{width: '80%', margin: '10%', textAlign: 'center'}}>
            <CircularProgress/>
        </div>
    }</>;
}


export default Content;