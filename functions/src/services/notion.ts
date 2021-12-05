import {ExtendedRecordMap} from 'notion-types';
import {NotionAPI} from 'notion-client';

export const fetchNotionPage = async (pageId: string): Promise<ExtendedRecordMap> => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};
