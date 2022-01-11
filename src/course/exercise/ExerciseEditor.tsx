import React, {memo, useContext, useEffect, useState} from "react";
import {CurrentExerciseContext} from "../Course";
import {Course, EXERCISE_TYPES} from '../../models/courses';
import {Autocomplete, Button, Stack, TextField} from "@mui/material";
import LocalizedFields from "./LocalizedFields";
import Box from "@mui/material/Box";
import CourseSearch from "../CourseSearch";


function ExerciseEditor({cancelEditing}: {
    cancelEditing: () => void
}) {
    const {exercise} = useContext(CurrentExerciseContext);
    const [order, setOrder] = useState<number>(exercise?.order ?? 0);
    // @ts-ignore
    const [exerciseType, setExerciseType] = useState<string>(exercise?.exerciseType ?? EXERCISE_TYPES.testCases.id);
    const [unlockContent, setUnlockContent] = useState<string[]>(exercise?.unlockContent ?? []);

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
        <TextField required variant="outlined" placeholder="1.01" type="number"
                   fullWidth
                   label="Order (level is the number before decimal dot, the rest is the order withing level)"
                   value={order} onChange={e => setOrder(Number(e.target.value))}
                   helperText="Exercise is not visible to students until the order is defined"
                   inputProps={{ 'aria-label': 'controlled', inputMode: 'numeric', pattern: '[0-9.]*' }} sx={{flex: 1}}/>
        <br/><br/>

        <Stack direction="row" spacing={1}>
            <Autocomplete
                sx={{ width: 200 }}
                autoHighlight
                autoSelect
                disableClearable
                value={EXERCISE_TYPES[exerciseType].displayName}
                onChange={(event, value: string | null) => value && setExerciseType(nameToExerciseType[value])}
                options={Object.keys(nameToExerciseType)}
                renderInput={(params) => <TextField {...params} label="Exercise type"/>}
            />

            <CourseSearch initialCourseIds={exercise?.unlockContent} sx={{flex: 1}} onChange={onUnlockContentChanged} />

        </Stack>
    </Box>;
}

export default memo(ExerciseEditor);
