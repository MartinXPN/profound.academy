import React, {memo} from 'react';
import useSWR from 'swr';

import {NotionRenderer} from 'react-notion-x';
import {Collection} from 'react-notion-x/build/third-party/collection';
import {Equation} from 'react-notion-x/build/third-party/equation';
import NotionLazyCode from "./LazyCode";
import 'react-notion-x/src/styles.css';     // core styles shared by all of react-notion-x (required)
import 'prismjs/themes/prism.min.css';      // used for code syntax highlighting (optional)
import 'katex/dist/katex.min.css';          // used for rendering equations
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import {getNotionPageMap} from "../../services/notion";


function Content({notionPage}: {notionPage: string}) {
    const {data, error} = useSWR(notionPage, getNotionPageMap, {
        errorRetryCount: 2,
        revalidateOnFocus: false, revalidateOnReconnect: false, refreshInterval: 1000 * 60 * 5
    });

    return <>
        {/*Fix issue where the user is prevented from selecting text: https://github.com/NotionX/react-notion-x/issues/81*/}
        <style>{`
            .notion-viewport {
                z-index: -1;
            }
        `}</style>

        {!data && !error && <Box width="80%" margin="10%" textAlign="center"><CircularProgress/></Box>}
        {error && <Typography textAlign="center" color="error" margin={4}>{error.message}</Typography>}
        {data && <NotionRenderer recordMap={data} fullPage={false} darkMode={false}
                                 components={{Code: NotionLazyCode, Collection, Equation}} />}
    </>
}


export default memo(Content);
