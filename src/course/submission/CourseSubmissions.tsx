import {memo, useContext, useState} from "react";
import {CourseSubmissionsTable} from "./SubmissionsTable";
import {CourseContext} from "../Course";
import {Grid} from "@mui/material";
import OutlinedButton from "../../common/OutlinedButton";
import {AuthContext} from "../../App";
import {useScreenAnalytics} from "../../analytics";

function CourseSubmissions({rowsPerPage}: {rowsPerPage: number}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const [currentTab, setCurrentTab] = useState<'all' | 'my'>('all');
    useScreenAnalytics(`course-submissions-${course?.id}`);

    if( !course || !auth.currentUserId )
        return <></>
    return <>
        <Grid container justifyContent="center">
            <OutlinedButton selected={currentTab === 'my'} onClick={() => setCurrentTab('my')}>My</OutlinedButton>
            <OutlinedButton selected={currentTab === 'all'} onClick={() => setCurrentTab('all')}>All</OutlinedButton>
        </Grid>

        <CourseSubmissionsTable
            rowsPerPage={rowsPerPage}
            course={course}
            userId={auth.currentUserId}
            mode={currentTab} />
    </>
}

export default memo(CourseSubmissions);
