import {useContext} from "react";
import Head from "next/head";
import StaticContent from "../home/StaticContent";
import {LocalizeContext} from "../common/Localization";

const content = {
    enUS: '76764fc54cc144d9b788ddff3907d0d5',
} as const;

export default function Terms() {
    const {localize, locale} = useContext(LocalizeContext);

    return <>
        <Head>
            <html lang={locale.substring(0, 2)} />
            <title>Terms and Conditions • Profound Academy</title>
        </Head>

        <StaticContent notionPage={localize(content)}/>
    </>
}
