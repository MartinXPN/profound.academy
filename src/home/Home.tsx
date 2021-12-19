import Header from "../header/Header";
import CourseList from "./CourseList";
import React, {useContext} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "./ActivityHeatmap";

function Home() {
    const auth = useContext(AuthContext);

    return <>
        <Header/>
        {auth?.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
        <CourseList/>
    </>
}

export default Home;
