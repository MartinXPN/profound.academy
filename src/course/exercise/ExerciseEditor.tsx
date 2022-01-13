import React, {memo, useContext, useEffect, useState} from "react";
import {CurrentExerciseContext} from "../Course";
import {Course, EXERCISE_TYPES} from '../../models/courses';
import {Autocomplete, Button, Stack, TextField} from "@mui/material";
import LocalizedFields from "./LocalizedFields";
import Box from "@mui/material/Box";
import {LANGUAGES} from "../../models/language";
import ExecutionParameters from "./ExecutionParameters";
import AutocompleteSearch from "../../common/AutocompleteSearch";
import {getCourses, searchCourses} from "../../services/courses";


function ExerciseEditor({cancelEditing}: {
    cancelEditing: () => void
}) {
    const {exercise} = useContext(CurrentExerciseContext);
    const [order, setOrder] = useState<number>(exercise?.order ?? 0);
    const [exerciseType, setExerciseType] = useState<keyof typeof EXERCISE_TYPES>(exercise?.exerciseType ?? EXERCISE_TYPES.testCases.id);
    const [unlockContent, setUnlockContent] = useState<string[]>(exercise?.unlockContent ?? []);
    const [allowedLanguages, setAllowedLanguages] = useState<(keyof typeof LANGUAGES)[]>(exercise?.allowedLanguages ?? []);

    const isFormReady = () => true;
    const onSubmit = () => {console.log('onSubmit')};
    const onCancel = () => {console.log('onCancel'); cancelEditing();};
    const onUnlockContentChanged = (unlockContent: Course[]) => setUnlockContent(unlockContent.map(c => c.title));

    const [nameToExerciseType, setNameToExerciseType] = useState<{ [key: string]: string }>({});
    useEffect(() => {
        const nameToId = {};
        for( const [id, name] of Object.entries(EXERCISE_TYPES) ) {
            // @ts-ignore
            nameToId[name.displayName] = id;
        }
        setNameToExerciseType(nameToId);
    }, []);
    const [nameToLanguageId, setNameToLanguageId] = useState<{ [key: string]: keyof typeof LANGUAGES }>({});
    useEffect(() => {
        const nameToLanguageId = {};
        for( const [id, language] of Object.entries(LANGUAGES) ) {
            // @ts-ignore
            nameToLanguageId[language.displayName] = id;
        }
        setNameToLanguageId(nameToLanguageId);
    }, []);


    if( !exercise )
        return <></>
    return <Box m={1}>
        <Stack direction="row" spacing={1} marginTop={4} justifyContent="center" alignItems="center" alignContent="center">
            <TextField required label="ID" variant="outlined" value={exercise.id} size="small" sx={{flex: 1, marginRight: 3}} inputProps={{readOnly: true}}/>
            <Button onClick={onSubmit} size="large" variant="outlined" disabled={!isFormReady()}>Save</Button>
            <Button onClick={onCancel} size="large" variant="outlined">Cancel</Button>
        </Stack>

        <LocalizedFields />
        <br/><br/>
        <TextField required variant="outlined" placeholder="1.01" type="number" fullWidth
                   label="Order (level is the number before decimal dot, the rest is the order withing level)"
                   value={order} onChange={e => setOrder(Number(e.target.value))}
                   helperText="Exercise is not visible to students until the order is defined"
                   inputProps={{ 'aria-label': 'controlled', inputMode: 'numeric', pattern: '[0-9.]*' }} sx={{flex: 1}}/>
        <br/><br/>

        <Stack direction="row" spacing={1}>
            <Autocomplete sx={{ width: 200 }} autoHighlight autoSelect disableClearable
                value={EXERCISE_TYPES[exerciseType].displayName}
                options={Object.keys(nameToExerciseType)}
                onChange={(event, value: string | null) => value && setExerciseType(nameToExerciseType[value])}
                renderInput={(params) => <TextField {...params} label="Exercise type"/>}
            />


            { /* @ts-ignore */}
            <AutocompleteSearch<Course>
                label="Unlock Content" placeholder="Courses..."
                search={searchCourses} idsToValues={getCourses}
                optionToId={option => option.id}
                optionToLabel={option => option.title ?? ''}
                optionToImageUrl={option => option.img}
                initialIds={exercise?.unlockContent}
                onChange={onUnlockContentChanged}
                sx={{flex: 1}} />

        </Stack>

        {(exerciseType === 'testCases' || exerciseType === 'code') && <>
            <Stack marginTop={4} spacing={4} marginBottom={10} direction="column">
                <Autocomplete sx={{ width: 200 }} multiple autoHighlight autoSelect disableCloseOnSelect disableClearable
                    value={allowedLanguages.map(l => LANGUAGES[l].displayName)}
                    onChange={(event, values: string[] | null) => values && setAllowedLanguages(values.map(v => nameToLanguageId[v]))}
                    options={Object.keys(nameToLanguageId)}
                    renderInput={(params) => <TextField {...params} label="Allowed languages" />}
                />

                <ExecutionParameters
                    initialParams={{
                        dirty: true,
                        values: {
                            memoryLimit: exercise?.memoryLimit,
                            timeLimit: exercise?.timeLimit,
                        }
                    }}
                    setParams={() => {}} />
            </Stack>
        </>}
    </Box>;
}

export default memo(ExerciseEditor);
