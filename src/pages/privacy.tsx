import {useContext} from "react";
import Head from "next/head";
import StaticContent from "../home/StaticContent";
import {LocalizeContext} from "../common/Localization";

const content = {
    enUS: 'a55965cadfd74c89bc9ceb869e9b1090',
} as const;

export default function Privacy() {
    const {localize, locale} = useContext(LocalizeContext);

    return <>
        <Head>
            <html lang={locale.substring(0, 2)} />
            <title>Privacy Policy • Profound Academy</title>
        </Head>

        <StaticContent notionPage={localize(content)}/>
    </>
}
