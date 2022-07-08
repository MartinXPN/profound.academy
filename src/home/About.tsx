import {memo, useContext} from "react";
import StaticContent from "./StaticContent";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";
import {useScreenAnalytics} from "../analytics";

const content = {
    enUS: '95e3c00cd1d744cd9bff906885af6a87',
} as const;

function About() {
    const {localize} = useContext(LocalizeContext);
    useScreenAnalytics('about');

    return <>
        <Helmet>
            <meta property="og:type" content="article" />
            <title>About Profound Academy</title>
            <meta property="og:title" content="About Profound Academy" />
            <meta property="twitter:title" content="About Profound Academy" />

            <meta name="description" content="Profound Academy is an educational platform that provides tailored courses for hands-on learning about programming and computer science." />
            <meta property="og:description" content="Profound Academy is an educational platform that provides tailored courses for hands-on learning about programming and computer science." />
        </Helmet>

        <StaticContent notionPage={localize(content)}/>
    </>
}

export default memo(About);
