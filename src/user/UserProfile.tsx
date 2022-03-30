import React, {useState} from "react";
import {useParams} from "react-router-dom";
import ActivityHeatmap from "./ActivityHeatmap";
import CourseList from "../course/CourseList";
import ProfileAppBar from "./ProfileAppBar";
import UserInfo from "./UserInfo";
import {Box} from "@mui/material";
import {UserSubmissionsTable} from "../course/submission/SubmissionsTable";
import OutlinedButton from "../common/OutlinedButton";


function UserProfile() {
    const {userId} = useParams<{ userId: string }>();
    const [currentTab, setCurrentTab] = useState('overview');
    console.log(userId);

    if( !userId )
        return <></>
    return <>
        <ProfileAppBar />

        <UserInfo userId={userId} />
        <Box display="flex" justifyContent="center" alignItems="center">
            <OutlinedButton selected={currentTab === 'overview'} onClick={() => setCurrentTab('overview')}>Overview</OutlinedButton>
            <OutlinedButton selected={currentTab === 'status'} onClick={() => setCurrentTab('status')}>Status</OutlinedButton>
        </Box>

        {currentTab === 'overview' && <>
            <CourseList variant="userCourses" title="Curriculum" userId={userId} />
            <CourseList variant="completedCourses" title="Completed" userId={userId} />
            <ActivityHeatmap userId={userId} />
            <br/><br/><br/><br/>
        </>}
        {currentTab === 'status' && <UserSubmissionsTable rowsPerPage={5} userId={userId}/>}
    </>
}

export default UserProfile;
