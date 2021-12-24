import React, {useCallback, useContext, useEffect, useState} from "react";
import Code from "./Code";  // needs to be before getModeForPath so that Ace is loaded
import Console from "./Console";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist';
import { IconButton } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import {Remove, Add} from "@mui/icons-material";
import {useStickyState} from "../../util";
import {TestCase} from "../../models/courses";
import {onRunResultChanged, onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {AuthContext} from "../../App";
import {SubmissionResult} from "../../models/submissions";
import {saveCode} from "../../services/codeDrafts";
import {TextSelection} from "../../models/codeDrafts";
import {CourseContext, CurrentExerciseContext} from "../Course";


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
    },
});


function Editor() {
    const classes = useStyles();
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);

    const [code, setCode] = useStickyState('', `code-${auth?.currentUser?.uid}-${exercise?.id}`);
    const [selection, setSelection] = useState<TextSelection>({start: { row: 0, column: 0 }, end: { row: 0, column: 0 }});
    const [theme, setTheme] = useStickyState('tomorrow', `editorTheme-${auth?.currentUser?.uid}`);
    const [language, setLanguage] = useStickyState(course?.preferredLanguage, `${course?.id}-language-${auth?.currentUser?.uid}`);
    const [fontSize, setFontSize] = useStickyState(14, `fontSize-${auth?.currentUser?.uid}`);

    const [submissionResult, setSubmissionResult] = useStickyState<SubmissionResult | null>(null, `submissionRes-${auth?.currentUser?.uid}-${exercise?.id}`);
    const [submitted, setSubmitted] = useState(false);

    const editorLanguage = getModeForPath(`main.${language.extension}`).name;
    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));

    useEffect(() => {
        if( !auth.currentUserId || !auth.currentUser || !course || !exercise )
            return;

        const timeOutId = setTimeout(() => {
            const extension = language.extension;
            const projectCode = {[`main.${extension}`]: code};

            saveCode(course.id, exercise.id, auth.currentUserId!, auth.currentUser!.displayName!, language, projectCode, selection)
                .then(() => console.log('successfully saved the code'));
        }, 500);
        return () => clearTimeout(timeOutId);
    }, [auth.currentUser, auth.currentUserId, code, language, selection, course, exercise]);


    const onEvaluate = useCallback(async (mode: 'run' | 'submit', tests?: TestCase[]) => {
        if( !auth.currentUserId || !auth.currentUser || !course || !exercise )
            return;

        setSubmitted(true);
        const submissionId = mode === 'submit'
            ? await submitSolution(auth.currentUserId, auth.currentUser.displayName, course.id, exercise.id, code, language, false, tests)
            : await submitSolution(auth.currentUserId, auth.currentUser.displayName, course.id, exercise.id, code, language, true, tests);

        const onResultChanged = mode === 'submit' ? onSubmissionResultChanged: onRunResultChanged;
        return onResultChanged(auth.currentUserId, submissionId, (result) => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });
    }, [auth.currentUserId, auth.currentUser, course, exercise, code, language, setSubmissionResult]);
    const handleSubmit = useCallback(async () => onEvaluate('submit'), [onEvaluate]);
    const handleRun = useCallback(async (tests) => onEvaluate('run', tests), [onEvaluate]);


    return (
        <div style={{height: '100%'}}>
            <div className={classes.code}>
                <Code theme={theme} readOnly={false} language={editorLanguage} fontSize={fontSize}
                      setCode={setCode} code={code} onSelectionChanged={setSelection}/>
                <div className={classes.settings}>
                    <IconButton aria-label="decrease" onClick={decreaseFontSize} size="large"><Remove fontSize="small" /></IconButton>
                    <IconButton aria-label="increase" onClick={increaseFontSize} size="large"><Add fontSize="small" /></IconButton>
                </div>
            </div>

            <div className={classes.console}>
                <Console
                    onSubmitClicked={handleSubmit}
                    onRunClicked={handleRun}
                    isProcessing={submitted}
                    submissionResult={submissionResult} />
            </div>
        </div>
    );
}

export default Editor;
