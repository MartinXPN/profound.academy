import {ExtendedRecordMap} from 'notion-types';
import {NotionAPI} from 'notion-client';
import {db} from './db';

export const fetchNotionPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};

export const cacheNotionPage = async (pageId: string, recordMap: ExtendedRecordMap): Promise<void> => {
    await db.notionPage(pageId).set({
        recordMap: JSON.stringify(recordMap),
    });
};

export const getCachedPage = async (pageId: string): Promise<ExtendedRecordMap | null> => {
    const recordMap = (await db.notionPage(pageId).get()).data()?.recordMap;
    if (!recordMap)
        return null;
    try {
        return JSON.parse(recordMap);
    } catch (e) {
        console.error(e);
        return null;
    }
};
