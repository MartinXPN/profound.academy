import {useContext} from "react";
import Head from "next/head";
import StaticContent from "../home/StaticContent";
import {LocalizeContext} from "../common/Localization";

const content = {
    enUS: '95e3c00cd1d744cd9bff906885af6a87',
} as const;

export default function About() {
    const {localize, locale} = useContext(LocalizeContext);

    return <>
        <Head>
            {/*<html lang={locale.substring(0, 2)} />*/}
            <title>About Profound Academy</title>
        </Head>

        <StaticContent notionPage={localize(content)}/>
    </>
}
