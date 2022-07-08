import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";
import {useScreenAnalytics} from "../analytics";

const content = {
    enUS: '76764fc54cc144d9b788ddff3907d0d5',
} as const;

function TermsAndConditions() {
    const {localize} = useContext(LocalizeContext);
    useScreenAnalytics('terms');

    return <>
        <Helmet>
            <meta property="og:type" content="article" />
            <title>Terms and Conditions • Profound Academy</title>
            <meta property="og:title" content="Terms and Conditions • Profound Academy" />
            <meta property="twitter:title" content="Terms and Conditions • Profound Academy" />

            <meta name="description" content="Terms and Conditions for Profound Academy." />
            <meta property="og:description" content="Terms and Conditions for Profound Academy." />
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(TermsAndConditions);
