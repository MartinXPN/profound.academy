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
        tests: {
            float: 'left',
            borderRadius: '5em',
            padding: '8px',
        },
        button: {
            margin: theme.spacing(1),
            float: 'right',
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
            width: '100%',
            backgroundColor: '#d9d9d9',
            overflowY: 'auto',
            padding: '10px',
        },
        submissionRoot: {
            width: '100%',
            overflow: 'hidden',
        },
        content: {
            width: '100%',
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
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [code, setCode] = useState('');
    const [theme, setTheme] = useStickyState('tomorrow', `editorTheme-${auth?.currentUser?.uid}`);
    const [language, setLanguage] = useStickyState(props.course.preferredLanguage, `${props.course.id}-language-${auth?.currentUser?.uid}`);
    const [fontSize, setFontSize] = useStickyState(14, `fontSize-${auth?.currentUser?.uid}`);

    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | undefined>(undefined);
    const [submitted, setSubmitted] = useState(false);

    const editorLanguage = getModeForPath(`main.${language.extension}`).name;
    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));
    const onSubmitClicked = async (testRun: boolean) => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        setSubmitted(true);
        const submissionId = await submitSolution(auth.currentUser.uid, auth.currentUser.displayName, props.course.id, props.exercise.id, code, language, testRun);
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
                <Code theme={theme} language={editorLanguage} fontSize={fontSize} setCode={setCode}/>
                <div className={classes.settings}>
                    <IconButton aria-label="decrease" onClick={decreaseFontSize}><Remove fontSize="small" /></IconButton>
                    <IconButton aria-label="increase" onClick={increaseFontSize}><Add fontSize="small" /></IconButton>
                </div>
            </div>
            <div className={classes.console}>
                <div className={classes.submissionRoot}>
                    <Typography className={classes.tests}>Test Cases: </Typography>
                    {props.exercise.testCases.map((test, index) =>
                        <Button variant="text" id={`${index}`} className={classes.tests}><Typography>{index + 1}</Typography></Button>
                    )}
                    <IconButton id="add-test" className={classes.tests}><Add /></IconButton>

                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        className={classes.button}
                        onClick={() => onSubmitClicked(false)}
                        endIcon={<Done />}>Submit</Button>

                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        className={classes.button}
                        onClick={() => onSubmitClicked(true)}
                        endIcon={<Send />}>Run</Button>
                </div>

                <div className={classes.content}>

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
                    <Typography>Run the program to see the output, Submit to evaluate</Typography>}
                </div>

            </div>
        </div>
    )
}

export default Editor;
