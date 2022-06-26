import {memo, useCallback, useContext, useState} from "react";
import {IconButton, MenuItem, Stack, TextField} from "@mui/material";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import {Add, Remove} from "@mui/icons-material";
import SettingsIcon from '@mui/icons-material/Settings';
import {themesByName} from 'ace-builds/src-noconflict/ext-themelist';
import {LANGUAGES} from "models/language";
import Paper from "@mui/material/Paper";
import {CurrentExerciseContext} from "../Course";

function Settings({increaseFontSize, decreaseFontSize, theme, setTheme, language, setLanguage}: {
    increaseFontSize: () => void,
    decreaseFontSize: () => void,
    theme: keyof typeof themesByName,
    setTheme: (theme: keyof typeof themesByName) => void,
    language: keyof typeof LANGUAGES,
    setLanguage: (language: keyof typeof LANGUAGES) => void,
}) {
    const {exercise} = useContext(CurrentExerciseContext);
    const [showConfigs, setShowConfigs] = useState(false);

    const onSettingsClicked = useCallback(() => setShowConfigs(!showConfigs), [showConfigs]);
    const onAwayClicked = useCallback(() => setShowConfigs(false), []);

    return <>
        <ClickAwayListener onClickAway={onAwayClicked}>
        <Paper elevation={showConfigs ? 1 : 0} sx={{paddingTop: 1, zIndex: 2400, ...(!showConfigs && {background: 'none'})}}>
        <Stack direction="row" alignItems="center" alignContent="center">
            <IconButton aria-label="decrease" onClick={decreaseFontSize} size="large"><Remove fontSize="small" /></IconButton>
            <IconButton aria-label="increase" onClick={increaseFontSize} size="large"><Add fontSize="small" /></IconButton>

            {showConfigs && <>
                <TextField select label="Theme" size="small" variant="outlined"
                           value={theme} onChange={e => setTheme(e.target.value)}
                           SelectProps={{MenuProps: { disablePortal: true }}}
                           sx={{ width: 200 }}>
                    {Object.keys(themesByName).map(id => <MenuItem key={id} value={id}>{themesByName[id].caption}</MenuItem>)}
                </TextField>

                <TextField select label="Language" size="small" variant="outlined"
                           value={language} onChange={event => setLanguage(event.target.value as keyof typeof LANGUAGES)}
                           SelectProps={{MenuProps: { disablePortal: true }}}
                           sx={{ width: 200 }}>
                    {exercise?.allowedLanguages?.map(id => <MenuItem key={id} value={id}>{LANGUAGES[id].displayName}</MenuItem>)}
                </TextField>
            </>}

            <IconButton aria-label="settings" onClick={onSettingsClicked} size="large"><SettingsIcon fontSize="small" /></IconButton>
        </Stack>
        </Paper>
        </ClickAwayListener>
    </>;
}

export default memo(Settings);
