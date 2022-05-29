import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";

const content = {
    enUS: '95e3c00cd1d744cd9bff906885af6a87',
} as const;

function About() {
    const {localize, locale} = useContext(LocalizeContext);

    return <>
        <Helmet>
            <html lang={locale.substring(0, 2)} />
            <title>About Profound Academy</title>
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(About);
