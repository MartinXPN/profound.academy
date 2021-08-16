import React, {useEffect, useState} from "react";

import {ExtendedRecordMap} from "notion-types/src/maps";
import { NotionRenderer } from 'react-notion-x'


function Content() {
    const [recordMap, setRecordMap] = useState<ExtendedRecordMap | null>(null);

    useEffect(() => {
        async function getNotionPage() {
            // TODO: Set-up a firebase function to get the RecordMap and then request for it here
            const notion = new NotionAPI();
            const map = await notion.getPage('067dd719a912471ea9a3ac10710e7fdf');
            setRecordMap(map);
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