import React, {useContext, useState} from "react";
import Code from "./Code";  // needs to be before getModeForPath so that Ace is loaded
import Console from "./Console";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist';
import {IconButton, makeStyles} from "@material-ui/core";
import {Remove, Add} from "@material-ui/icons";
import {useStickyState} from "../../util";
import {Course, Exercise, TestCase} from "../../models/courses";
import {onRunResultChanged, onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {AuthContext} from "../../App";
import {SubmissionResult} from "../../models/submissions";


const useStyles = makeStyles({
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
});


function Editor({course, exercise}: {course: Course, exercise: Exercise}) {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const [code, setCode] = useStickyState('', `code-${auth?.currentUser?.uid}-${exercise.id}`);
    const [theme, setTheme] = useStickyState('tomorrow', `editorTheme-${auth?.currentUser?.uid}`);
    const [language, setLanguage] = useStickyState(course.preferredLanguage, `${course.id}-language-${auth?.currentUser?.uid}`);
    const [fontSize, setFontSize] = useStickyState(14, `fontSize-${auth?.currentUser?.uid}`);

    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | undefined>(undefined);
    const [submitted, setSubmitted] = useState(false);

    const editorLanguage = getModeForPath(`main.${language.extension}`).name;
    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));
    const onSubmitClicked = async () => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        setSubmitted(true);
        const submissionId = await submitSolution(auth.currentUser.uid, auth.currentUser.displayName, course.id, exercise.id, code, language, false, undefined);
        const unsubscribe = onSubmissionResultChanged(submissionId, (result) => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });

        return () => unsubscribe();
    }

    const onRunClicked = async (tests: TestCase[]) => {
        if( !auth || !auth.currentUser || !auth.currentUser.uid )
            return;

        setSubmitted(true);
        const runId = await submitSolution(auth.currentUser.uid, auth.currentUser.displayName, course.id, exercise.id, code, language, true, tests);
        const unsubscribe = onRunResultChanged(auth.currentUser.uid, runId, (result) => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });

        return () => unsubscribe();
    };

    return (
        <div style={{height: '100%'}}>
            <div className={classes.code}>
                <Code theme={theme} readOnly={false} language={editorLanguage} fontSize={fontSize} setCode={setCode} code={code}/>
                <div className={classes.settings}>
                    <IconButton aria-label="decrease" onClick={decreaseFontSize}><Remove fontSize="small" /></IconButton>
                    <IconButton aria-label="increase" onClick={increaseFontSize}><Add fontSize="small" /></IconButton>
                </div>
            </div>

            <div className={classes.console}>
                <Console
                    exercise={exercise}
                    onSubmitClicked={onSubmitClicked}
                    onRunClicked={onRunClicked}
                    isProcessing={submitted}
                    submissionResult={submissionResult} />
            </div>
        </div>
    );
}

export default Editor;
