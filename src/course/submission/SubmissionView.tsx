import React, {memo, useContext, useState} from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickableTableCell from "../../common/ClickableTableCell";
import {Collapse, Stack, Typography} from "@mui/material";
import SmallAvatar from "../../common/SmallAvatar";
import {LANGUAGES} from "models/language";
import {statusToColor} from "../colors";
import {SubmissionResult} from "models/submissions";
import {LocalizeContext} from "../../common/Localization";
import {Column} from "./SubmissionsTable";
import SubmissionCode from "./SubmissionCode";
import {TransitionGroup} from "react-transition-group";
import SubmissionTestsStatus from "./SubmissionTestsStatus";
import OutlinedButton from "../../common/OutlinedButton";
import Grid from "@mui/material/Grid";

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
        <TableRow hover role="checkbox" tabIndex={-1} key={submission.id} onClick={onSubmissionClicked}
                  sx={{...(showCode && {'& td': {border: 0}})}}>
            {displayColumns.map((column) => {
                if( column.id === '#' )
                    return <ClickableTableCell key={column.id} align={column.align}>
                        <Stack direction="row" alignItems="center" alignContent="center">
                            {showCode ? <ArrowDropDownIcon/> : <ArrowRightIcon />}
                            {orderNumber}
                        </Stack>
                    </ClickableTableCell>;

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


        {showCode && <TableRow key={submission.id + 'code'}>
            <TableCell colSpan={displayColumns.length}>
                <TransitionGroup appear={showCode}>
                    <Collapse>
                        <Typography variant="body2" color="text.secondary" noWrap align="left">Submission &nbsp; • &nbsp; {submission.id}</Typography>
                        <SubmissionCode submission={submission}/>
                        <SubmissionTestsStatus submission={submission} />
                        <Grid container direction="column" alignItems="center" justifyContent="center" sx={{marginBottom: 2}}>
                            <OutlinedButton size="small" selected={false} onClick={() => setShowCode(false)} startIcon={<KeyboardArrowUpIcon />} sx={{paddingRight: 2}}>Collapse</OutlinedButton>
                        </Grid>
                    </Collapse>
                </TransitionGroup>
            </TableCell>
        </TableRow>}
    </>
}

export default memo(SubmissionView);
