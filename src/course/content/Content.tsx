import React, {useRef, useState} from 'react';
import useAsyncEffect from "use-async-effect";

import {ExtendedRecordMap} from "notion-types/src/maps";
import {Code, Collection, CollectionRow, Equation, Modal, NotionRenderer} from 'react-notion-x'
import { highlightAll } from "prismjs";
import 'prismjs/themes/prism.css';          // used for code syntax highlighting (optional)
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'rc-dropdown/assets/index.css';      // used for collection views (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations (optional)
import {CircularProgress} from "@material-ui/core";

import './Content.css';
import {getNotionPageMap} from "../../services/courses";


interface ContentProps {
    notionPage: string;
}

function Content(props: ContentProps) {
    const {notionPage} = props;
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
        const languages = ['c', 'cpp', 'python'];
        await Promise.all(languages.map(l => import(`prismjs/components/prism-${l}.min`)));
        highlightAll();
    }, () => isMounted.current = false, [notionPage]);

    return (
        <>
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
                <div className='center'>
                    <CircularProgress/>
                </div>
            }
        </>
    );
}


export default Content;