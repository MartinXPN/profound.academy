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
            <title>Terms and Conditions • Profound Academy</title>
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(TermsAndConditions);
