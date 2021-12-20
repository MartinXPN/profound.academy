import React from "react";
import {useParams} from "react-router-dom";
import ActivityHeatmap from "../home/ActivityHeatmap";
import CourseList from "../home/CourseList";
import ProfileAppBar from "./ProfileAppBar";
import UserInfo from "./UserInfo";

function UserProfile() {
    const {userId} = useParams<{ userId: string }>();
    console.log(userId);

    return <>
        <ProfileAppBar />

        <UserInfo userId={userId} />
        <CourseList variant="userCourses" title="Curriculum" userId={userId} />
        <CourseList variant="completedCourses" title="Completed" userId={userId} />
        <ActivityHeatmap userId={userId} />
        <br/><br/><br/><br/>
    </>
}

export default UserProfile;
