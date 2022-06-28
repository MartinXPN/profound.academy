import {memo, useContext} from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import OutlinedButton from "../common/OutlinedButton";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import {useStickyState} from "../common/stickystate";
import {CourseSubmissionsTable} from "./submission/SubmissionsTable";
import Ranking from "./ranking/Ranking";
import Dashboard from "./Dashboard";
import Content from "../common/notion/Content";
import {Link} from "react-router-dom";
import {Edit} from "@mui/icons-material";
import {LocalizeContext} from "../common/Localization";


function StatusPage() {
    const auth = useContext(AuthContext);
    const {localize} = useContext(LocalizeContext);
    const {course} = useContext(CourseContext);
    const [currentTab, setCurrentTab] = useStickyState<'description' | 'dashboard' | 'submissions' | 'ranking' | 'lastWeeksProgress' | 'upsolving' | 'edit'>('description', `status-${auth.currentUserId}-${course?.id}`);

    const showDashboard = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);
    const showRanking = course && auth.currentUserId && (course.instructors.includes(auth.currentUserId) || course.rankingVisibility === 'public');
    const showEdit = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);

    if( !course )
        return <></>
    return <>
        <Box overflow="auto" width="100%" height="100%">
            <Grid container justifyContent="center">
                <OutlinedButton selected={currentTab === 'description'} onClick={() => setCurrentTab('description')}>Description</OutlinedButton>
                {showDashboard && <OutlinedButton selected={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')}>Dashboard</OutlinedButton>}
                {auth.isSignedIn && <OutlinedButton selected={currentTab === 'submissions'} onClick={() => setCurrentTab('submissions')}>Submissions</OutlinedButton>}
                {showRanking && <OutlinedButton selected={currentTab === 'ranking'} onClick={() => setCurrentTab('ranking')}>Ranking</OutlinedButton>}
                {showEdit && <OutlinedButton selected={currentTab === 'edit'} endIcon={<Edit />} component={Link} to="../edit">Edit</OutlinedButton>}
            </Grid>

            {currentTab === 'description' && <Box mb={20}><Content notionPage={localize(course.introduction)} /></Box>}
            {currentTab === 'dashboard' && <Dashboard />}
            {currentTab === 'submissions' && <CourseSubmissionsTable rowsPerPage={20} course={course} />}
            {currentTab === 'ranking' && <Ranking />}
        </Box>
    </>
}

export default memo(StatusPage);
