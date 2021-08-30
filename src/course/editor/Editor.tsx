import React, {useContext, useState} from "react";
import Code from "./Code";
import {Button, CircularProgress, createStyles, IconButton, makeStyles, Theme, Typography} from "@material-ui/core";
import {Send, Done, Remove, Add} from "@material-ui/icons";
import {useStickyState} from "../../util";
import {Course, Exercise} from "../../models/courses";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist'
import {onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {AuthContext} from "../../App";
import {SubmissionResult} from "../../models/submissions";


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        button: {
            margin: theme.spacing(1),
        },
        code: {
            position: 'relative',
            height: '70%',
            width: '100%',
        },
        settings: {
            position: 'absolute',
            top: 0,
            right: 0,
        },
        console: {
            height: '30%',
            backgroundColor: '#d9d9d9',
            position: 'relative',
            overflowY: 'auto',
            padding: '10px',
        },
        submissionRoot: {
            position: 'absolute',
            top: 0,
            right: 0,
        },
        center: {
            width: '80%',
            margin: '10%',
            textAlign: 'center',
        },
    }),
);


interface EditorProps {
    course: Course;
    exercise: Exercise;
}

function Editor(props: EditorProps) {
    const filename = `main.${props.course.preferredLanguage.extension}`
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [code, setCode] = useState('');
    const [theme, setTheme] = useStickyState('tomorrow', 'editorTheme');
    const [language, setLanguage] = useStickyState(getModeForPath(filename).name, `${props.course.id}-language`);
    const [fontSize, setFontSize] = useStickyState(14, 'fontSize');

    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | undefined>(undefined);
    const [submitted, setSubmitted] = useState(false);

    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));
    const onSubmitClicked = async (testRun: boolean) => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        // TODO: provide the language here
        setSubmitted(true);
        const submissionId = await submitSolution(auth.currentUser.uid, props.course.id, props.exercise.id, code, 'C++11', testRun);
        const unsubscribe = onSubmissionResultChanged(submissionId, (result) => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });

        return () => unsubscribe();
    }

    return (
        <div style={{height: '100%'}}>
            <div className={classes.code}>
                <Code theme={theme} language={language} fontSize={fontSize} setCode={setCode}/>
                <div className={classes.settings}>
                    <IconButton aria-label="decrease" onClick={decreaseFontSize}><Remove fontSize="small" /></IconButton>
                    <IconButton aria-label="increase" onClick={increaseFontSize}><Add fontSize="small" /></IconButton>
                </div>
            </div>
            <div className={classes.console}>
                {submitted &&
                <div className={classes.center}>
                    <Typography>Running the program...</Typography>
                    <CircularProgress />
                </div>}

                {submissionResult &&
                <>
                    <Typography>{submissionResult.status} in {submissionResult.time} seconds</Typography>
                    {/*<Typography>{submissionResult.compileOutputs ?? ''}</Typography>*/}
                    <Typography style={{whiteSpace: 'pre'}}>{submissionResult.outputs ?? ''}</Typography>
                </>}

                {!submitted && !submissionResult &&
                <Typography>Send the program to see the output, Submit to evaluate</Typography>}

                <div className={classes.submissionRoot}>
                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        className={classes.button}
                        onClick={() => onSubmitClicked(true)}
                        endIcon={<Send />}>Send</Button>

                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        className={classes.button}
                        onClick={() => onSubmitClicked(false)}
                        endIcon={<Done />}>Submit</Button>
                </div>
            </div>
        </div>
    )
}

export default Editor;
