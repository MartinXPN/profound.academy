import React from "react";
import {useParams} from "react-router-dom";
import ActivityHeatmap from "../home/ActivityHeatmap";
import CourseList from "../home/CourseList";
import ProfileAppBar from "./ProfileAppBar";

function UserProfile() {
    const {userId} = useParams<{ userId: string }>();
    console.log(userId);

    return <>
        <ProfileAppBar />

        <CourseList/>
        <ActivityHeatmap userId={userId} />
    </>
}

export default UserProfile;
