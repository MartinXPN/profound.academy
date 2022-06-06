import {memo, useContext, useState} from "react";
import {SubmissionResult} from "models/submissions";
import useAsyncEffect from "use-async-effect";
import SubmissionView from "./SubmissionView";
import {Column} from "./SubmissionsTable";
import {lastExerciseId} from "../Course";
import {useNavigate} from "react-router-dom";
import {AuthContext} from "../../App";

function SubmissionsPage({startAfterId, loadSubmissions, columns, startIndex, onMoreLoaded}: {
    startAfterId: string | null,
    loadSubmissions: (startAfterId: string | null, onChange: (submissions: SubmissionResult[], more: boolean) => void) => Promise<() => void>
    columns: Column[],
    startIndex: number,
    onMoreLoaded: (lastId: string) => void,
}) {
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const [submissions, setSubmissions] = useState<SubmissionResult[]>([]);

    useAsyncEffect(async () => {
        return await loadSubmissions(startAfterId, (submissions, more) => {
            setSubmissions(submissions);
            more && submissions.length > 0 && onMoreLoaded(submissions[submissions.length - 1].id);
        });
    }, unsubscribe => unsubscribe && unsubscribe(), [startAfterId]);

    const onUserClicked = (userId: string) => navigate(`/users/${userId}`);
    const onExerciseClicked = (courseId: string, exerciseId: string) => navigate(`/${courseId}/${exerciseId}`);
    const onCourseClicked = (courseId: string) => {
        const lastEx = lastExerciseId(auth.currentUserId, courseId);
        if( lastEx )    navigate(`/${courseId}/${lastEx}`);
        else            navigate(`/${courseId}`);
    };

    let orderNumber = startIndex;
    return <>
        {submissions.map((row, _index) =>
            <SubmissionView
                submission={row}
                displayColumns={columns}
                onCourseClicked={onCourseClicked}
                onExerciseClicked={onExerciseClicked}
                onUserClicked={onUserClicked}
                orderNumber={orderNumber++} />
        )}
    </>
}

export default memo(SubmissionsPage);
