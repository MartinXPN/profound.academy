import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";
import {useScreenAnalytics} from "../analytics";

const content = {
    enUS: 'a55965cadfd74c89bc9ceb869e9b1090',
} as const;

function Privacy() {
    const {localize} = useContext(LocalizeContext);
    useScreenAnalytics('privacy');

    return <>
        <Helmet>
            <title>Privacy Policy • Profound Academy</title>
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(Privacy);
