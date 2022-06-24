import {memo} from "react";
import Content from "../common/notion/Content";
import ProfileAppBar from "../user/ProfileAppBar";
import Footer from "./Footer";
import {Box, Divider} from "@mui/material";

function StaticContent({notionPage}: {notionPage: string}) {
    return <>
        <ProfileAppBar />
        <Box minHeight="100vh">
            <Content notionPage={notionPage} />
        </Box>
        <Divider />
        <Footer />
    </>
}

export default memo(StaticContent);
