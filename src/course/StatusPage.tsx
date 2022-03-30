import React, {memo, useContext} from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import OutlinedButton from "../common/OutlinedButton";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import {useStickyState} from "../util";
import {CourseSubmissionsTable} from "./submission/SubmissionsTable";
import RankingTable from "./ranking/RankingTable";
import moment from "moment";
import Dashboard from "./Dashboard";


function StatusPage() {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const [currentTab, setCurrentTab] = useStickyState<'dashboard' | 'submissions' | 'ranking' | 'lastWeeksProgress' | 'upsolving'>('submissions', `status-${course?.id}`);

    const showDashboard = course && auth.currentUserId && course.instructors.includes(auth.currentUserId);
    const showRanking = course && auth.currentUserId && (course.instructors.includes(auth.currentUserId) || course.rankingVisibility === 'public');
    const showUpsolving = course && course.freezeAt.toDate().getTime() < new Date().getTime();
    const showLastWeekProgress = showRanking && !showUpsolving && course && new Date().getTime() - course.revealsAt.toDate().getTime() > 24 * 60 * 1000; // at least one day has passed

    if( !course )
        return <></>
    return <>
        <Box overflow="auto" width="100%" height="100%">
            <Grid container justifyContent="center">
                {showDashboard && <OutlinedButton selected={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')}>Dashboard</OutlinedButton>}
                <OutlinedButton selected={currentTab === 'submissions'} onClick={() => setCurrentTab('submissions')}>Submissions</OutlinedButton>
                {showLastWeekProgress && <OutlinedButton selected={currentTab === 'lastWeeksProgress'} onClick={() => setCurrentTab('lastWeeksProgress')}>Last week</OutlinedButton>}
                {showRanking && <OutlinedButton selected={currentTab === 'ranking'} onClick={() => setCurrentTab('ranking')}>Ranking</OutlinedButton>}
                {showUpsolving && <OutlinedButton selected={currentTab === 'upsolving'} onClick={() => setCurrentTab('upsolving')}>Upsolving ranking</OutlinedButton>}
            </Grid>

            {currentTab === 'dashboard' && <Dashboard />}
            {currentTab === 'submissions' && <CourseSubmissionsTable rowsPerPage={5} course={course} />}
            {currentTab === 'ranking' && <RankingTable metric="score"/>}
            {currentTab === 'lastWeeksProgress' && <RankingTable metric={`score_${moment().format('YYYY_MM_WW')}`} showProgress/>}
            {currentTab === 'upsolving' && <RankingTable metric="upsolveScore"/>}
        </Box>
    </>
}

export default memo(StatusPage);
