import React, {useState} from "react";
import {useRouter} from "next/router";
import ProfileAppBar from "../../user/ProfileAppBar";
import UserInfo from "../../user/UserInfo";
import {Box} from "@mui/material";
import OutlinedButton from "../../common/OutlinedButton";
import CourseList from "../../course/CourseList";
import ActivityHeatmap from "../../user/ActivityHeatmap";
import {UserSubmissionsTable} from "../../course/submission/SubmissionsTable";

function UserProfile() {
    const router = useRouter();
    const {userId} = router.query;
    const [currentTab, setCurrentTab] = useState('overview');
    console.log(userId);

    if( !userId || typeof userId !== 'string')
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
        {currentTab === 'status' && <UserSubmissionsTable rowsPerPage={20} userId={userId}/>}
    </>
}

export default UserProfile;
