import React, {memo, useContext} from "react";
import {Stack} from "@mui/material";
import OutlinedButton from "../common/OutlinedButton";
import {AuthContext} from "../App";
import {CourseContext} from "./Course";
import {styled} from "@mui/styles";
import {useStickyState} from "../util";
import SubmissionsTable from "./SubmissionsTable";
import RankingTable from "./RankingTable";

const Container = styled('div')({
    overflow: 'auto',
    height: '100%',
    width: '100%',
});

function StatusPage() {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const [currentTab, setCurrentTab] = useStickyState<'submissions' | 'ranking' | 'upsolving'>('submissions', `status-${course?.id}`);

    const showRanking = course && auth.currentUserId && (course.instructors.includes(auth.currentUserId) || course.rankingVisibility === 'public');
    const showUpsolving = course && course.freezeAt.toDate().getTime() < new Date().getTime();
    if( !course )
        return <></>
    return <>
        <Container>

            <Stack justifyContent="center" direction="row">
                <OutlinedButton selected={currentTab === 'submissions'} onClick={() => setCurrentTab('submissions')}>Submissions</OutlinedButton>
                {showRanking && <OutlinedButton selected={currentTab === 'ranking'} onClick={() => setCurrentTab('ranking')}>Ranking</OutlinedButton>}
                {showUpsolving && <OutlinedButton selected={currentTab === 'upsolving'} onClick={() => setCurrentTab('upsolving')}>Upsolving ranking</OutlinedButton>}
            </Stack>

            {currentTab === 'submissions' && <SubmissionsTable course={course} mode="course" />}
            {currentTab === 'ranking' && <RankingTable metric="score"/>}
            {currentTab === 'upsolving' && <RankingTable metric="upsolveScore"/>}
        </Container>
    </>
}

export default memo(StatusPage);
