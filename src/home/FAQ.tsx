import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";
import {useScreenAnalytics} from "../analytics";

const content = {
    enUS: 'c4565d6169704a8fac3922f3cf9c1864',
} as const;

function Privacy() {
    const {localize} = useContext(LocalizeContext);
    useScreenAnalytics('faq');

    return <>
        <Helmet>
            <title>FAQ • Profound Academy</title>
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(Privacy);
