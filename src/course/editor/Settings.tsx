import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {Autocomplete, IconButton, Stack, TextField} from "@mui/material";
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

    const onSettingsClicked = useCallback(() => {
        setShowConfigs(!showConfigs)
    }, [showConfigs]);
    const onAwayClicked = useCallback(() => setShowConfigs(false), []);

    const [nameToThemeId, setNameToThemeId] = useState<{ [key: string]: keyof typeof themesByName }>({});
    useEffect(() => {
        const nameToThemeId = {};
        for( const [id, theme] of Object.entries(themesByName) ) {
            // @ts-ignore
            nameToThemeId[theme.caption] = id;
        }
        setNameToThemeId(nameToThemeId);
    }, []);

    const [nameToLanguageId, setNameToLanguageId] = useState<{ [key: string]: keyof typeof LANGUAGES }>({});
    useEffect(() => {
        const nameToLanguageId = {};
        for( const [id, language] of Object.entries(LANGUAGES) ) {
            if( exercise?.allowedLanguages?.includes(id) ) {
                // @ts-ignore
                nameToLanguageId[language.displayName] = id;
            }
        }
        setNameToLanguageId(nameToLanguageId);
    }, [exercise?.allowedLanguages]);


    return <>
        <ClickAwayListener onClickAway={onAwayClicked}>
        <Paper elevation={showConfigs ? 1 : 0} sx={!showConfigs ? {background: 'none', paddingTop: 1} : {paddingTop: 1}}>
        <Stack direction="row" alignItems="center" alignContent="center">
            <IconButton aria-label="decrease" onClick={decreaseFontSize} size="large"><Remove fontSize="small" /></IconButton>
            <IconButton aria-label="increase" onClick={increaseFontSize} size="large"><Add fontSize="small" /></IconButton>

            {showConfigs && <>
                <Autocomplete
                    id="theme"
                    sx={{ width: 200 }}
                    autoHighlight
                    autoSelect
                    disableClearable
                    value={themesByName[theme].caption}
                    onChange={(event, value: string | null) => value && setTheme(nameToThemeId[value])}
                    options={Object.keys(nameToThemeId)}
                    renderInput={(params) => <TextField {...params} label="Theme" size="small"/>}
                />

                <Autocomplete
                    id="language"
                    sx={{ width: 200 }}
                    autoHighlight
                    autoSelect
                    disableClearable
                    value={LANGUAGES[language].displayName}
                    onChange={(event, value: string | null) => value && setLanguage(nameToLanguageId[value])}
                    options={Object.keys(nameToLanguageId)}
                    renderInput={(params) => <TextField {...params} label="Language" size="small"/>}
                />
            </>}

            <IconButton aria-label="settings" onClick={onSettingsClicked} size="large"><SettingsIcon fontSize="small" /></IconButton>

        </Stack>
        </Paper>
        </ClickAwayListener>
    </>;
}

export default memo(Settings);
