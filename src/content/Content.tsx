import React, {useEffect, useState} from "react";
import firebase from 'firebase/app';
import 'firebase/functions';

import {ExtendedRecordMap} from "notion-types/src/maps";
import { NotionRenderer } from 'react-notion-x'
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'prismjs/themes/prism-tomorrow.css'; // used for code syntax highlighting (optional)
import 'rc-dropdown/assets/index.css';      // used for collection views (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations (optional)


function Content() {
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
    const pageId = '067dd719a912471ea9a3ac10710e7fdf';

    useEffect(() => {
        async function getNotionPage() {
            const getPage = firebase.functions().httpsCallable('getNotionPage');
            const map = await getPage({ pageId: pageId });
            console.log({map: map.data});
            // @ts-ignore
            setRecordMap(map.data);
        }
        getNotionPage();
    }, []);

    return (
        <>
            {recordMap && <NotionRenderer recordMap={recordMap} fullPage={true} darkMode={false}/> }
        </>
    );
}


export default Content;