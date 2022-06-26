import {useCallback, useContext, useEffect, useState} from "react";
import Code from "./Code";  // needs to be before getModeForPath so that Ace is loaded
import Console from "./Console";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist';
import {useStickyState} from "../../common/stickystate";
import {TestCase} from "models/exercise";
import {onRunResultChanged, onRunTestResultsChanged, onSubmissionResultChanged, onSubmissionTestResultsChanged, submitSolution} from "../../services/submissions";
import {AuthContext} from "../../App";
import {SubmissionResult} from "models/submissions";
import {onCodeChanged, saveCode} from "../../services/codeDrafts";
import {TextSelection} from "models/codeDrafts";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {SplitPane} from "react-multi-split-pane";
import {Language, LANGUAGES} from "models/language";
import Box from "@mui/material/Box";
import Settings from "./Settings";
import {TestResult} from "../../../functions/src/models/submissions";


function Editor({disableCodeSync, userId}: {disableCodeSync?: boolean, userId?: string}) {
    const auth = useContext(AuthContext);
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const currentUserId = userId ?? auth.currentUserId;
    const isMyCode = currentUserId === auth.currentUserId;

    const [code, setCode] = useStickyState<string>('', `code-${currentUserId}-${exercise?.id}`);
    const [selection, setSelection] = useState<TextSelection>({start: { row: 0, column: 0 }, end: { row: 0, column: 0 }});
    const [theme, setTheme] = useStickyState('tomorrow', `editorTheme-${currentUserId}`);
    const [language, setLanguage] = useStickyState<Language | null>(null, `${course?.id}-${exercise?.id}-language-${currentUserId}`);
    const [fontSize, setFontSize] = useStickyState(14, `fontSize-${auth?.currentUser?.uid}`);
    const [splitPos, setSplitPos] = useStickyState<number[] | null>(null, `consoleSplitPos-${auth?.currentUserId}`);

    const [submissionResult, setSubmissionResult] = useStickyState<SubmissionResult | null>(null, `submissionRes-${currentUserId}-${exercise?.id}`);
    const [submissionTestResults, setSubmissionTestResults] = useStickyState<TestResult[] | null>(null, `submissionTestsRes-${currentUserId}-${exercise?.id}`);
    const [submitted, setSubmitted] = useState(false);
    if( language === null && exercise && exercise.allowedLanguages && exercise?.allowedLanguages.length > 0 )
        setLanguage(LANGUAGES[exercise?.allowedLanguages[0]]);

    const filename = `main.${language?.extension ?? 'txt'}`;
    const editorLanguage = getModeForPath(filename).name;
    const decreaseFontSize = useCallback(() => setFontSize(Math.max(fontSize - 1, 5)), [fontSize, setFontSize]);
    const increaseFontSize = useCallback(() => setFontSize(Math.min(fontSize + 1, 30)), [fontSize, setFontSize]);

    const onSplitChanged = useCallback((newSplit: number[]) => {
        console.log('split:', newSplit);
        setSplitPos(newSplit);
    }, [setSplitPos]);
    const onSelectionChanged = useCallback((newSelection: TextSelection) => {
        isMyCode && setSelection(newSelection);
    }, [isMyCode]);


    useEffect(() => {
        if( !auth.currentUserId || !auth.currentUser || !course || !exercise || disableCodeSync || !code )
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
    }, [course, exercise, currentUserId, isMyCode, filename, setCode, setLanguage]);

    const onEvaluate = useCallback(async (mode: 'run' | 'submit', tests?: TestCase[]) => {
        setSubmissionResult(null);
        setSubmissionTestResults(null);
        if( !auth.currentUserId || !auth.currentUser || !course || !exercise )
            return;

        // if the code > 64 KB (2 bytes per character)
        console.log('code length:', JSON.stringify(code).length);
        if( JSON.stringify(code).length > 32000 ) {
            setSubmissionResult({
                id: '', isBest: false, time: 0, score: 0, memory: 0, returnCode: 0, status: 'Compilation error',
                compileResult: {
                    status: 'Compilation error', time: 0, score: 0, memory: 0, returnCode: 0,
                    message: 'Source code exceeds the allowed 64KB limit',
                },
            });
            setSubmissionTestResults(null);
            return;
        }

        setSubmitted(true);
        const submissionId = mode === 'submit'
            ? await submitSolution(auth.currentUserId, course.id, exercise.id, code, language, false, tests)
            : await submitSolution(auth.currentUserId, course.id, exercise.id, code, language, true, tests);

        const onResultChanged = mode === 'submit' ? onSubmissionResultChanged: onRunResultChanged;
        const onTestResultsChanged = mode === 'submit' ? onSubmissionTestResultsChanged : onRunTestResultsChanged;

        const unsubscribeResult = onResultChanged(auth.currentUserId, submissionId, result => {
            setSubmissionResult(result);
            if(result && result.status !== 'Checking')
                setSubmitted(false);
        });
        // Do not get results per test case when submitting (only when running the program)
        const unsubscribeTestResults = mode === 'submit' ? () => {} : onTestResultsChanged(auth.currentUserId, submissionId, setSubmissionTestResults);
        return () => {
            unsubscribeResult();
            unsubscribeTestResults();
        }
    }, [auth.currentUserId, auth.currentUser, course, exercise, code, language, setSubmissionResult, setSubmissionTestResults]);
    const handleSubmit = useCallback(async () => onEvaluate('submit'), [onEvaluate]);
    const handleRun = useCallback(async (tests: TestCase[]) => onEvaluate('run', tests), [onEvaluate]);


    return <>
        <SplitPane split="horizontal" defaultSizes={splitPos ?? [3, 1]} onDragFinished={onSplitChanged}>
            <Box width="100%" height="100%" position="relative">
                <Code theme={theme} language={editorLanguage} fontSize={fontSize}
                      readOnly={!isMyCode}
                      setCode={setCode} code={code}
                      onSelectionChanged={onSelectionChanged} selection={!isMyCode ? selection : undefined}/>

                <Box top={0} right={0} position="absolute">
                    <Settings increaseFontSize={increaseFontSize} decreaseFontSize={decreaseFontSize}
                              theme={theme} setTheme={setTheme}
                              language={language?.languageCode ?? 'txt'} setLanguage={(id) => setLanguage(LANGUAGES[id])}/>
                </Box>
            </Box>

            <Box width="100%" height="100%" sx={{backgroundColor: '#e0e0e0', overflowY: 'auto'}}>
                <Console
                    onSubmitClicked={handleSubmit}
                    onRunClicked={handleRun}
                    isProcessing={submitted}
                    submissionResult={submissionResult}
                    testResults={submissionTestResults} />
            </Box>
        </SplitPane>
    </>
}

export default Editor;
