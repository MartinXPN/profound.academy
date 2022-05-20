import React, {memo, useRef, useState} from 'react';
import useAsyncEffect from 'use-async-effect';

import {ExtendedRecordMap} from 'notion-types';
import {NotionRenderer} from 'react-notion-x';
import {Collection} from 'react-notion-x/build/third-party/collection';
import {Equation} from 'react-notion-x/build/third-party/equation';
import LazyCode from "./LazyCode";
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'prismjs/themes/prism.min.css';      // used for code syntax highlighting (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import {getNotionPageMap} from "../../services/notion";


function Content({notionPage}: {notionPage: string}) {
    const isMounted = useRef(false)
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);
    const [errors, setErrors] = useState<string | null>(null);

    useAsyncEffect(async () => {
        isMounted.current = true;
        setRecordMap(null);
        setErrors(null);
        const map = await getNotionPageMap(notionPage);
        if( !isMounted.current )
            return;

        setRecordMap(map);
        setErrors(map ? null : `Could not get Notion page with id: ${notionPage}`);
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
            components={{Code: LazyCode, Collection, Equation}} />
            : errors
                ? <Typography textAlign="center" color="error" marginBottom={4}>{errors}</Typography>
                : <Box width="80%" margin="10%" textAlign="center"><CircularProgress/></Box>
        }
    </>
}


export default memo(Content);
