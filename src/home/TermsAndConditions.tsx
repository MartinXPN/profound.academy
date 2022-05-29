import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";

const content = {
    enUS: '76764fc54cc144d9b788ddff3907d0d5',
} as const;

function TermsAndConditions() {
    const {localize, locale} = useContext(LocalizeContext);

    return <>
        <Helmet>
            <html lang={locale.substring(0, 2)} />
            <title>Terms and Conditions • Profound Academy</title>
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(TermsAndConditions);
