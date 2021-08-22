import React, {useState} from "react";
import Code from "./Code";
import {Button, createStyles, IconButton, makeStyles, Theme, Typography} from "@material-ui/core";
import {Send, Done, Remove, Add} from "@material-ui/icons";
import {useStickyState} from "../../util";


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
        }
    }),
);


function Editor() {
    const classes = useStyles();
    const [code, setCode] = useState('');
    const [theme, setTheme] = useState('tomorrow');
    const [language, setLanguage] = useState('python');
    const [fontSize, setFontSize] = useStickyState(14, 'fontSize');

    const decreaseFontSize = () => setFontSize(Math.max(fontSize - 1, 5));
    const increaseFontSize = () => setFontSize(Math.min(fontSize + 1, 30));

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
                <Typography>Submission results and outputs will appear here...</Typography>
                <div className={classes.submissionRoot}>
                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        className={classes.button}
                        endIcon={<Send />}>Send</Button>

                    <Button
                        variant="contained"
                        color="primary"
                        size='small'
                        className={classes.button}
                        endIcon={<Done />}>Submit</Button>
                </div>
            </div>
        </div>
    )
}

export default Editor;
