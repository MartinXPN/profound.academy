import {memo, useContext, useState} from "react";
import {ExerciseSubmissionsTable} from "./SubmissionsTable";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {Grid} from "@mui/material";
import OutlinedButton from "../../common/OutlinedButton";
import {AuthContext} from "../../App";
import {useScreenAnalytics} from "../../analytics";

function ExerciseSubmissions({rowsPerPage}: {rowsPerPage: number}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const [currentTab, setCurrentTab] = useState<'all' | 'best' | 'my'>('all');
    useScreenAnalytics(`exercise_submissions_${exercise?.id}`);

    if( !course || !exercise || !auth.currentUserId )
        return <></>
    return <>
        <Grid container justifyContent="center">
            <OutlinedButton selected={currentTab === 'all'} onClick={() => setCurrentTab('all')}>All</OutlinedButton>
            <OutlinedButton selected={currentTab === 'best'} onClick={() => setCurrentTab('best')}>Best</OutlinedButton>
            <OutlinedButton selected={currentTab === 'my'} onClick={() => setCurrentTab('my')}>My</OutlinedButton>
        </Grid>

        <ExerciseSubmissionsTable
            rowsPerPage={rowsPerPage}
            course={course}
            exercise={exercise}
            userId={auth.currentUserId}
            mode={currentTab} />
    </>
}

export default memo(ExerciseSubmissions);
