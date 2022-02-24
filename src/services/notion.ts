export const getNotionPageMap = async (pageId: string) => {
    const GET_NOTION_ENDPOINT = 'https://us-central1-profound-academy.cloudfunctions.net/getNotionPage';
    const res = await fetch(`${GET_NOTION_ENDPOINT}?pageId=${pageId}`, {method: 'GET', mode: 'cors'});
    return res.json();
}
