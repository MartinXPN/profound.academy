import React, {memo} from "react";
import Content from "../common/notion/Content";
import ProfileAppBar from "../user/ProfileAppBar";
import Footer from "./Footer";
import {Divider} from "@mui/material";
import Box from "@mui/material/Box";

function StaticContent({notionPage}: {notionPage: string}) {
    return <>
        <ProfileAppBar />
        {/* Fix the issue of notion content overflowing the page by 32px */}
        <Box paddingRight="32px">
            <Content notionPage={notionPage} />
        </Box>
        <Divider />
        <Footer />
    </>
}

export default memo(StaticContent);
