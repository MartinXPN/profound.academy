import React, {memo} from "react";
import Content from "../course/Content";
import ProfileAppBar from "../user/ProfileAppBar";
import Footer from "./Footer";
import {Divider} from "@mui/material";

function StaticContent({notionPage}: {notionPage: string}) {
    return <>
        <ProfileAppBar />
        <Content notionPage={notionPage} />
        <Divider />
        <Footer />
    </>
}

export default memo(StaticContent);
