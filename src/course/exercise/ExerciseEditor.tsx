import React, {memo, useContext} from "react";
import {CurrentExerciseContext} from "../Course";
import {Button, Stack, TextField} from "@mui/material";
import LocalizedFields from "./LocalizedFields";
import Box from "@mui/material/Box";

function ExerciseEditor({cancelEditing}: {
    cancelEditing: () => void
}) {
    const {exercise} = useContext(CurrentExerciseContext);
    const isFormReady = () => true;
    const onSubmit = () => {console.log('onSubmit')};
    const onCancel = () => {console.log('onCancel'); cancelEditing();};


    if( !exercise )
        return <></>

    return <>
        <Stack direction="row" spacing={1} m={1} marginTop={4} justifyContent="center" alignItems="center" alignContent="center">
            <TextField required label="ID" variant="outlined" value={exercise.id} size="small" sx={{flex: 1, marginRight: 3}} inputProps={{readOnly: true}}/>
            <Button onClick={onSubmit} size="large" variant="outlined" disabled={!isFormReady()}>Save</Button>
            <Button onClick={onCancel} size="large" variant="outlined">Cancel</Button>
        </Stack>

        <Box m={1}>
            <LocalizedFields />
        </Box>
    </>;
}

export default memo(ExerciseEditor);
