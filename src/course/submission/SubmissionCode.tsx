import React, {useContext, useState} from "react";
import useAsyncEffect from "use-async-effect";
import {CircularProgress, Paper, Stack, Typography} from "@mui/material";
import {SubmissionResult} from "models/submissions";
import {getSubmissionCode} from "../../services/submissions";
import {AuthContext} from "../../App";
import {LANGUAGES} from "models/language";
import SubmissionTestsStatus from "./SubmissionTestsStatus";
import {LazyCode} from "../../common/notion/LazyCode";


function SubmissionCode({submission}: {submission: SubmissionResult}) {
    const auth = useContext(AuthContext);

    const [submissionCode, setSubmissionCode] = useState<string | null>(null);

    useAsyncEffect(async () => {
        const userId = auth?.currentUser?.uid;
        if( !userId )
            return;

        try {
            const code = await getSubmissionCode(submission.userId, submission.id);
            console.log('Got submission code:', code);
            // TODO: support multi-file submissions (now just get the first value)
            setSubmissionCode(code[Object.keys(code)[0]]);
        }
        catch (e) {
            setSubmissionCode('# You are not allowed to view the submission');
        }

    }, [submission]);

    const language = LANGUAGES[submission.language].extension;
    console.log('language:', language);

    return (<>
        <Typography variant="body2" color="text.secondary" noWrap>Submission &nbsp; • &nbsp; {submission.id}</Typography>
        {submissionCode
            ? <LazyCode language={language} content={submissionCode} />
            : <CircularProgress color="inherit"/>
        }
        <SubmissionTestsStatus submission={submission} />
    </>);
}

export default SubmissionCode;
