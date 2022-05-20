import React, {memo, useContext, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import ClickableTableCell from "../../common/ClickableTableCell";
import {Stack} from "@mui/material";
import SmallAvatar from "../../common/SmallAvatar";
import {LANGUAGES} from "models/language";
import {statusToColor} from "../colors";
import {SubmissionResult} from "models/submissions";
import {LocalizeContext} from "../../common/Localization";
import {Column} from "./SubmissionsTable";
import SubmissionCode from "./SubmissionCode";

function SubmissionView({submission, orderNumber, displayColumns, onUserClicked, onCourseClicked, onExerciseClicked}: {
    submission: SubmissionResult,
    orderNumber: number,
    displayColumns: Column[],
    onUserClicked: (userId: string) => void,
    onCourseClicked: (courseId: string) => void,
    onExerciseClicked: (courseId: string, exerciseId: string) => void,
}) {
    const {localize} = useContext(LocalizeContext);
    const [showCode, setShowCode] = useState(false);
    const onSubmissionClicked = () => {
        setShowCode(!showCode);
    };

    return <>
        <TableRow hover role="checkbox" tabIndex={-1} key={submission.id} onClick={onSubmissionClicked}>
            {displayColumns.map((column) => {
                if( column.id === '#' )
                    return <TableCell key={column.id} align={column.align}>{orderNumber}</TableCell>;

                const value = submission[column.id];
                if( column.id === 'userDisplayName' )
                    return <ClickableTableCell key={column.id} align={column.align} onClick={() => onUserClicked(submission.userId)}>
                        <Stack direction="row" alignItems="center" alignContent="center">
                            <SmallAvatar src={submission.userImageUrl} />
                            {value}
                        </Stack>
                    </ClickableTableCell>
                if( column.id === 'courseTitle' )
                    return <ClickableTableCell key={column.id} align={column.align} onClick={() => onCourseClicked(submission.course.id)}>{submission.courseTitle}</ClickableTableCell>
                if( column.id === 'exerciseTitle' )
                    return <ClickableTableCell key={column.id} align={column.align} onClick={() => onExerciseClicked(submission.course.id, submission.exercise.id)}>
                        {localize(submission.exerciseTitle)}
                    </ClickableTableCell>

                if( column.id === 'language' && typeof value === 'string' )
                    return <TableCell key={column.id} align={column.align}>{LANGUAGES[value].displayName}</TableCell>
                // @ts-ignore
                const style = column.id === 'status' ? {color: statusToColor(value)} : {};
                return (
                    <TableCell key={column.id} align={column.align} style={style}>
                        {column.format ? column.format(value) : value}
                    </TableCell>
                );
            })}
        </TableRow>
        {showCode && <TableRow>
            <TableCell colSpan={displayColumns.length}>
                <SubmissionCode submission={submission}/>
            </TableCell>
        </TableRow>}
    </>
}

export default memo(SubmissionView);
