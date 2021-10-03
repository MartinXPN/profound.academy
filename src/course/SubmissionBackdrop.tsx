import {useContext, useState} from "react";
import useAsyncEffect from "use-async-effect";
import { Backdrop, CircularProgress, ClickAwayListener, Paper } from "@mui/material";
import createStyles from '@mui/styles/createStyles';
import { Theme } from "@mui/material/styles";
import makeStyles from '@mui/styles/makeStyles';
import {SubmissionResult} from "../models/submissions";
import {getSubmissionCode} from "../services/submissions";
import {AuthContext} from "../App";
import Code from "./editor/Code";
import {LANGUAGES} from "../models/language";
import {getModeForPath} from "ace-builds/src-noconflict/ext-modelist";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        backdrop: {
            zIndex: theme.zIndex.drawer + 1,
            color: '#fff',
        },
        content: {
            position: 'relative',
            height: '90%',
            width: '70%',
        },
    }),
);

function SubmissionBackdrop({submission, onClose}: {submission: SubmissionResult, onClose: () => void}) {
    const classes = useStyles();
    const auth = useContext(AuthContext);

    const [open, setOpen] = useState(true);
    const [submissionCode, setSubmissionCode] = useState<string | null>(null);
    const handleClose = () => {
        setOpen(false);
        onClose();
    }

    useAsyncEffect(async () => {
        const userId = auth?.currentUser?.uid;
        if( !userId ) {
            handleClose();
            return;
        }
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

    const language = LANGUAGES[submission.language];
    const editorLanguage = getModeForPath(`main.${language.extension}`).name;

    return (<>
        <Backdrop className={classes.backdrop} open={open}>
            <ClickAwayListener onClickAway={handleClose}>
                {!submissionCode
                    ?
                    <CircularProgress color="inherit"/>
                    :
                    <Paper className={classes.content}>
                        <Code theme="tomorrow" fontSize={14}
                              language={editorLanguage}
                              readOnly
                              code={submissionCode} />
                    </Paper>
                }
            </ClickAwayListener>
        </Backdrop>
    </>);
}

export default SubmissionBackdrop;
