import {memo} from "react";
import Content from "../common/notion/Content";
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
