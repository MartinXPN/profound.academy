export const getNotionPageMap = async (pageId: string) => {
    const GET_NOTION_ENDPOINT = 'https://us-central1-profound-academy.cloudfunctions.net/getNotionPage';
    const res = await fetch(`${GET_NOTION_ENDPOINT}?pageId=${pageId}`, {method: 'GET', mode: 'cors'});
    return res.json();
};


export const notionPageToId = (page: string): string => {
    return page.split('/').at(-1)?.split('-').at(-1) ?? '';
};
