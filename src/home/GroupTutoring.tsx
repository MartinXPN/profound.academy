import {memo, useContext, useEffect} from "react";
import {Helmet} from "react-helmet-async";
import {LocalizeContext} from "../common/Localization";
import {useScreenAnalytics} from "../analytics";
import Pricing from "./Pricing";
import ProfileAppBar from "../user/ProfileAppBar";
import {Box, Divider} from "@mui/material";
import Content from "../common/notion/Content";
import Footer from "./Footer";

const content = {
    enUS: 'e868e08df54c4d3ea8cb506ab7632e4f',
} as const;

function GroupTutoring() {
    const {localize} = useContext(LocalizeContext);
    useScreenAnalytics('group-tutoring');
    // Scroll to the top when the component is opened
    useEffect(() => window.scrollTo({top: 0}), []);


    return <>
        <Helmet>
            <title>Group Tutoring • Profound Academy</title>
        </Helmet>

        <ProfileAppBar />
        <Box minHeight="100vh">
            <Content notionPage={localize(content)} />
        </Box>

        <Pricing />

        <Divider />
        <Footer />
    </>
}

export default memo(GroupTutoring);
