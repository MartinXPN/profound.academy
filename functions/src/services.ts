import {NotionAPI} from 'notion-client';


export const fetchNotionPage = async (pageId: string) => {
    const notion = new NotionAPI();
    return await notion.getPage(pageId);
};
