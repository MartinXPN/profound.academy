import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";

const content = {
    enUS: 'a55965cadfd74c89bc9ceb869e9b1090',
} as const;

function Privacy() {
    const {localize, locale} = useContext(LocalizeContext);

    return <>
        <Helmet>
            <html lang={locale.substring(0, 2)} />
            <title>Privacy Policy • Profound Academy</title>
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(Privacy);
