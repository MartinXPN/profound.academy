import React, {useState} from 'react';
import firebase from 'firebase/app';
import 'firebase/functions';

import {ExtendedRecordMap} from "notion-types/src/maps";
import {Code, Collection, CollectionRow, Equation, Modal, NotionRenderer} from 'react-notion-x'
import { highlightAll } from "prismjs";
import 'prismjs/themes/prism.css';          // used for code syntax highlighting (optional)
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'rc-dropdown/assets/index.css';      // used for collection views (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations (optional)
import useAsyncEffect from "use-async-effect";
import {CircularProgress} from "@material-ui/core";

import './Content.css';


interface ContentProps {
    notionPage: string;
}

function Content(props: ContentProps) {
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
    const {notionPage} = props;

    useAsyncEffect(async () => {
        setRecordMap(null);
        const getPage = firebase.functions().httpsCallable('getNotionPage');
        const map = await getPage({pageId: notionPage});
        console.log({map: map.data});
        // @ts-ignore
        setRecordMap(map.data);

        // TODO: Get the languages from record map obtained from getPage()
        const languages = ['cpp', 'python', 'c'];
        await Promise.all(languages.map(l => import(`prismjs/components/prism-${l}.min`)));
        highlightAll();
    }, [notionPage]);

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