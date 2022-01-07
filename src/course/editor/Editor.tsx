import React, {useCallback, useContext, useEffect, useState} from "react";
import Code from "./Code";  // needs to be before getModeForPath so that Ace is loaded
import Console from "./Console";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist';
import { IconButton } from "@mui/material";
import {Remove, Add} from "@mui/icons-material";
import {useStickyState} from "../../util";
import {TestCase} from "../../models/courses";
import {onRunResultChanged, onSubmissionResultChanged, submitSolution} from "../../services/submissions";
import {AuthContext} from "../../App";
import {SubmissionResult} from "../../models/submissions";
import {onCodeChanged, saveCode} from "../../services/codeDrafts";
import {TextSelection} from "../../models/codeDrafts";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {SplitPane} from "react-multi-split-pane";
import {styled} from "@mui/material/styles";
import {Language, LANGUAGES} from "../../models/language";


export const Settings = styled('div')({
    position: 'absolute',
    top: 0,
    right: 0,
});

export const CodeView = styled('div')({
    position: 'relative',
    height: '100%',
    width: '100%',
});

export const ConsoleView = styled('div')({
    height: '100%',
    width: '100%',
    backgroundColor: '#d9d9d9',
    overflowY: 'auto',
});


function Editor({disableCodeSync, userId}: {disableCodeSync?: boolean, userId?: string}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const currentUserId = userId ?? auth.currentUserId;
    const isMyCode = currentUserId === auth.currentUserId;

    const [code, setCode] = useStickyState<string>('', `code-${currentUserId}-${exercise?.id}`);
    const [selection, setSelection] = useState<TextSelection>({start: { row: 0, column: 0 }, end: { row: 0, column: 0 }});
    const [theme, setTheme] = useStickyState('tomorrow', `editorTheme-${currentUserId}`);
    const [language, setLanguage] = useStickyState<Language | null>(course?.preferredLanguage ?? null, `${course?.id}-language-${currentUserId}`);
    const [fontSize, setFontSize] = useStickyState(14, `fontSize-${auth?.currentUser?.uid}`);
    const [splitPos, setSplitPos] = useStickyState<number[] | null>(null, `consoleSplitPos-${auth?.currentUserId}`);

    const [submissionResult, setSubmissionResult] = useStickyState<SubmissionResult | null>(null, `submissionRes-${currentUserId}-${exercise?.id}`);
    const [submitted, setSubmitted] = useState(false);

    const filename = `main.${language.extension}`;
    const editorLanguage = getModeForPath(filename).name;
    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));

    const onSplitChanged = useCallback((newSplit) => {
        console.log('split:', newSplit);
        setSplitPos(newSplit);
    }, [setSplitPos]);
    const onSelectionChanged = useCallback((newSelection: TextSelection) => {
        isMyCode && setSelection(newSelection);
    }, [isMyCode]);


    useEffect(() => {
        if( !auth.currentUserId || !auth.currentUser || !course || !exercise || disableCodeSync )
            return;

        const timeOutId = setTimeout(() => {
            const extension = language.extension;
            const projectCode = {[`main.${extension}`]: code};
            if( JSON.stringify(projectCode).length > 32000 ) {
                console.log('source code too big');
                return;
            }

            saveCode(course.id, exercise.id, auth.currentUserId!, language.languageCode,
                auth.currentUser?.displayName ?? undefined, auth.currentUser?.photoURL ?? undefined,
                projectCode, selection).then(() => console.log('successfully saved the code'));
        }, 500);
        return () => clearTimeout(timeOutId);
    }, [auth.currentUser, auth.currentUserId, code, language, selection, course, exercise, disableCodeSync]);

    useEffect(() => {
        if( !course || !exercise || !currentUserId || isMyCode )
            return;

        return onCodeChanged(course.id, exercise.id, currentUserId, (codeDraft) => {
            if( !codeDraft )
                return;

            codeDraft.selection && setSelection(codeDraft.selection);
            setLanguage(typeof codeDraft.language === 'string' ? LANGUAGES[codeDraft.language] : codeDraft.language);
            setCode(codeDraft.code?.[filename] ?? 'No code here...');
        })
    }, [currentUserId, auth.currentUserId, course, exercise, isMyCode, filename, setCode, setLanguage]);

    const onEvaluate = useCallback(async (mode: 'run' | 'submit', tests?: TestCase[]) => {
        if( !auth.currentUserId || !auth.currentUser || !course || !exercise )
            return;

        // if the code > 64 KB (2 bytes per character)
        console.log('code length:', JSON.stringify(code).length);
        if( JSON.stringify(code).length > 32000 ) {
            setSubmissionResult({
                isBest: false, time: 0, score: 0, memory: 0,
                status: 'Compilation error',
                compileOutputs: 'Source code exceeds the allowed 64KB limit',
            });
            return;
        }

        setSubmitted(true);
        const submissionId = mode === 'submit'
            ? await submitSolution(auth.currentUserId, course.id, exercise.id, code, language, false, tests)
            : await submitSolution(auth.currentUserId, course.id, exercise.id, code, language, true, tests);

        const onResultChanged = mode === 'submit' ? onSubmissionResultChanged: onRunResultChanged;
        return onResultChanged(auth.currentUserId, submissionId, (result) => {
            setSubmissionResult(result);
            if(result)
                setSubmitted(false);
        });
    }, [auth.currentUserId, auth.currentUser, course, exercise, code, language, setSubmissionResult]);
    const handleSubmit = useCallback(async () => onEvaluate('submit'), [onEvaluate]);
    const handleRun = useCallback(async (tests) => onEvaluate('run', tests), [onEvaluate]);


    return <>
        <SplitPane split="horizontal" defaultSizes={splitPos ?? [3, 1]} onDragFinished={onSplitChanged}>
            <CodeView>
                <Code theme={theme} language={editorLanguage} fontSize={fontSize}
                      readOnly={!isMyCode}
                      setCode={setCode} code={code}
                      onSelectionChanged={onSelectionChanged} selection={!isMyCode ? selection : undefined}/>
                <Settings>
                    <IconButton aria-label="decrease" onClick={decreaseFontSize} size="large"><Remove fontSize="small" /></IconButton>
                    <IconButton aria-label="increase" onClick={increaseFontSize} size="large"><Add fontSize="small" /></IconButton>
                </Settings>
            </CodeView>

            <ConsoleView>
                <Console
                    onSubmitClicked={handleSubmit}
                    onRunClicked={handleRun}
                    isProcessing={submitted}
                    submissionResult={submissionResult} />
            </ConsoleView>
        </SplitPane>
    </>
}

export default Editor;
