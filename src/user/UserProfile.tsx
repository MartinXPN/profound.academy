import React, {useState} from "react";
import {useParams} from "react-router-dom";
import ActivityHeatmap from "./ActivityHeatmap";
import CourseList from "../course/CourseList";
import ProfileAppBar from "./ProfileAppBar";
import UserInfo from "./UserInfo";
import Button from "@mui/material/Button";
import {Box, Theme, Typography} from "@mui/material";
import {styled} from "@mui/styles";
import SubmissionsTable from "../course/SubmissionsTable";

const RoundButton = styled(Button)(({theme}: {theme: Theme}) => ({
    margin: theme.spacing(1),
    borderRadius: 50,
    size: 'large',
}));

function UserProfile() {
    const {userId} = useParams<{ userId: string }>();
    const [currentTab, setCurrentTab] = useState('overview');
    console.log(userId);

    return <>
        <ProfileAppBar />

        <UserInfo userId={userId} />
        <Box display="flex" justifyContent="center" alignItems="center">
            <RoundButton variant={currentTab === 'overview' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('overview')}>Overview</RoundButton>
            <RoundButton variant={currentTab === 'status' ? 'contained' : 'outlined'} onClick={() => setCurrentTab('status')}>Status</RoundButton>
        </Box>

        {currentTab === 'overview' && <>
            <CourseList variant="userCourses" title="Curriculum" userId={userId} />
            <CourseList variant="completedCourses" title="Completed" userId={userId} />
            <ActivityHeatmap userId={userId} />
            <br/><br/><br/><br/>
        </>}
        {currentTab === 'status' && <>
            <SubmissionsTable mode="user" userId={userId}/>
        </>}
    </>
}

export default UserProfile;
