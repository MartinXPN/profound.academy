import Header from "../header/Header";
import React, {useContext} from "react";
import {AuthContext} from "../App";
import ActivityHeatmap from "./ActivityHeatmap";
import CourseList from "./CourseList";

function Home() {
    const auth = useContext(AuthContext);

    return <>
        <Header/>
        {auth?.currentUserId && <ActivityHeatmap userId={auth.currentUserId} />}
        {auth.currentUserId && <CourseList variant="userCourses" title="My Curriculum" userId={auth.currentUserId}/>}
        <CourseList variant="allCourses" title="All Courses" />
    </>
}

export default Home;
