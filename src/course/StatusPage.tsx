import React, {memo, useContext} from "react";
import {Stack} from "@mui/material";
import OutlinedButton from "../common/OutlinedButton";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import {useStickyState} from "../util";
import {CourseSubmissionsTable} from "./SubmissionsTable";
import RankingTable from "./RankingTable";
import Box from "@mui/material/Box";


function StatusPage() {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const [currentTab, setCurrentTab] = useStickyState<'submissions' | 'ranking' | 'upsolving'>('submissions', `status-${course?.id}`);

    const showRanking = course && auth.currentUserId && (course.instructors.includes(auth.currentUserId) || course.rankingVisibility === 'public');
    const showUpsolving = course && course.freezeAt.toDate().getTime() < new Date().getTime();
    if( !course )
        return <></>
    return <>
        <Box overflow="auto" width="100%" height="100%">
            <Stack justifyContent="center" direction="row">
                <OutlinedButton selected={currentTab === 'submissions'} onClick={() => setCurrentTab('submissions')}>Submissions</OutlinedButton>
                {showRanking && <OutlinedButton selected={currentTab === 'ranking'} onClick={() => setCurrentTab('ranking')}>Ranking</OutlinedButton>}
                {showUpsolving && <OutlinedButton selected={currentTab === 'upsolving'} onClick={() => setCurrentTab('upsolving')}>Upsolving ranking</OutlinedButton>}
            </Stack>

            {currentTab === 'submissions' && <CourseSubmissionsTable rowsPerPage={5} course={course} />}
            {currentTab === 'ranking' && <RankingTable metric="score"/>}
            {currentTab === 'upsolving' && <RankingTable metric="upsolveScore"/>}
        </Box>
    </>
}

export default memo(StatusPage);
