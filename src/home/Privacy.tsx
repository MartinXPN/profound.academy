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
            <meta property="og:type" content="article" />
            <title>Privacy Policy • Profound Academy</title>
            <meta property="og:title" content="Privacy Policy • Profound Academy" />
            <meta property="twitter:title" content="Privacy Policy • Profound Academy" />

            <meta name="description" content="Privacy Policy for Profound Academy." />
            <meta property="og:description" content="Privacy Policy for Profound Academy." />
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(Privacy);
