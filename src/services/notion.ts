import {parsePageId} from 'notion-utils';

const GET_NOTION_ENDPOINT = 'https://us-central1-profound-academy.cloudfunctions.net/getNotionPage';

export const getNotionPageMap = async (pageId: string) => {
    try {
        const res = await fetch(`${GET_NOTION_ENDPOINT}?pageId=${pageId}`, {method: 'GET', mode: 'cors'});
        console.log('Got Notion Map:', pageId);
        return res.json();
    } catch (e) {
        console.error('getNotionPageMap:', e);
    }
    return null;
};


export const notionPageToId = (page: string): string => parsePageId(page, {uuid: false});
