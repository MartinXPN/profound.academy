import React, {Component, useRef} from "react";
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import {Course, Exercise} from "../models/courses";
import {useOnScreen} from '../util';
import {onCourseSubmissionsChanged, onSubmissionsChanged, onUserSubmissionsChanged} from "../services/submissions";
import {SubmissionResult} from "../models/submissions";
import moment from "moment/moment";
import SubmissionBackdrop from "./SubmissionBackdrop";
import {statusToColor} from "./colors";
import {RouteComponentProps, withRouter} from "react-router-dom";

interface Column {
    id: '#' | 'userDisplayName' | 'createdAt' | 'status' | 'time' | 'memory' | 'language';
    label: string;
    minWidth?: number;
    align?: 'right';
    format?: (value: any) => string;
}

const columns: Column[] = [
    { id: '#', label: '#', minWidth: 20 },
    { id: 'userDisplayName', label: 'User', minWidth: 100 },
    { id: 'createdAt', label: 'Date', minWidth: 100, format: (value) => moment(value.toDate()).format('YYYY MMM Do, HH:mm:ss') },
    { id: 'status', label: 'Status', minWidth: 50 },
    { id: 'time', label: 'Time (s)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(2) : '' },
    { id: 'memory', label: 'Memory (MB)', minWidth: 50, align: 'right', format: (value: number) => value ? value.toFixed(1): '' },
    { id: 'language', label: 'Language', minWidth: 50 },
];


function Bottom({hasMore, loadMore}: {hasMore: boolean, loadMore: () => void}) {
    const ref = useRef();
    const isVisible = useOnScreen(ref);

    if( hasMore && isVisible )
        loadMore();

    // @ts-ignore
    return <div ref={ref} style={{ paddingBottom: '5em' }}>{isVisible && hasMore &&
        <Box sx={{ textAlign: 'center', width: '100%', margin: '1em' }}>
            <CircularProgress />
        </Box>
    }
    </div>
}

interface Props extends RouteComponentProps<any> {
    rowsPerPage: number;
    course?: Course;
    exercise?: Exercise;
    userId?: string;
    mode: 'all' | 'best' | 'user' | 'course';
}

interface State {
    page: number;
    hasMore: boolean;
    displayedSubmission?: SubmissionResult;
    pageSubmissions: SubmissionResult[][];
    updateSubscriptions: (() => void)[],
}

class SubmissionsTableC extends Component<Props, State> {
    state: State = {page: 0, hasMore: true, pageSubmissions: [], updateSubscriptions: []};

    componentWillUnmount() {
        console.log('unsubscribing from all the submission listeners');
        for( const unsubscribe of this.state.updateSubscriptions )
            unsubscribe();
    }

    onSubmissionClicked = (submission: SubmissionResult) => this.setState({displayedSubmission: submission});
    onCloseSubmission = () => this.setState({displayedSubmission: undefined});
    onUserClicked = (userId: string) => this.props.history.push(`/users/${userId}`);

    loadNextPage = async () => {
        const page = this.state.page;
        const startAfterId = page === 0 || !this.state.pageSubmissions[page - 1]
            ? null
            : this.state.pageSubmissions[page - 1].at(-1)?.id;

        // do not load if we already have a listener and set dummy listener right after check
        if( this.state.updateSubscriptions[page] )
            return;
        this.setState({updateSubscriptions: [...this.state.updateSubscriptions, () => {}]});

        console.log('startAfter:', startAfterId, 'for page:', this.state.page);

        const onChanged = (submissions: SubmissionResult[], more: boolean) => {
            console.log('onChanged:', submissions, page, `(now ${this.state.page})`, more);
            const currentSubscriptions = [...this.state.pageSubmissions];
            currentSubscriptions[page] = submissions;
            this.setState({pageSubmissions: currentSubscriptions});

            if( page === this.state.page )
                this.setState({hasMore: more, page: page + 1});
        };

        if( this.props.mode === 'user' && this.props.userId ) {
            const unsubscribe = await onUserSubmissionsChanged(this.props.userId, startAfterId ?? null, this.props.rowsPerPage, onChanged);
            const subscriptions = [...this.state.updateSubscriptions];
            subscriptions[page] = unsubscribe;
            this.setState({updateSubscriptions: subscriptions});
        }
        else if( this.props.mode === 'course' && this.props.course ) {
            const unsubscribe = await onCourseSubmissionsChanged(this.props.course.id, startAfterId ?? null, this.props.rowsPerPage, onChanged);
            const subscriptions = [...this.state.updateSubscriptions];
            subscriptions[page] = unsubscribe;
            this.setState({updateSubscriptions: subscriptions});
        }
        else if( (this.props.mode === 'all' || this.props.mode === 'best') && this.props.course && this.props.exercise ) {
            const unsubscribe = await onSubmissionsChanged(this.props.course.id, this.props.exercise.id, this.props.mode, startAfterId ?? null, this.props.rowsPerPage, onChanged);
            const subscriptions = [...this.state.updateSubscriptions];
            subscriptions[page] = unsubscribe;
            this.setState({updateSubscriptions: subscriptions});
        }
    };


    render() {
        const {hasMore, displayedSubmission, pageSubmissions} = this.state;
        let orderNumber = 1;
        return (
            <Paper style={{width: '100%'}}>
                {displayedSubmission && <SubmissionBackdrop submission={displayedSubmission} onClose={this.onCloseSubmission} />}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}>
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pageSubmissions.map((submissions, _page) => submissions.map((row, _index) =>
                                <TableRow hover role="checkbox" tabIndex={-1} key={row.id} onClick={() => this.onSubmissionClicked(row)}>
                                    {columns.map((column) => {
                                        if( column.id === '#' )
                                            return <TableCell key={column.id} align={column.align}>{orderNumber++}</TableCell>;

                                        const value = row[column.id];
                                        if( column.id === 'userDisplayName' )
                                            return <TableCell key={column.id} align={column.align} sx={{"&:focus,&:hover": {cursor: 'pointer'}}} onClick={() => this.onUserClicked(row.userId)}>{value}</TableCell>

                                        // @ts-ignore
                                        const style = column.id === 'status' ? {color: statusToColor(value)} : {};
                                        return (
                                            <TableCell key={column.id} align={column.align} style={style}>
                                                {column.format ? column.format(value) : value}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Bottom hasMore={hasMore} loadMore={this.loadNextPage} />
            </Paper>
        );
    }
}


export default withRouter(SubmissionsTableC);
