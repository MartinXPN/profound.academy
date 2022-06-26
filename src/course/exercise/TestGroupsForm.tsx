import {memo} from "react";
import {Button, IconButton, List, ListItem, Stack, TextField} from "@mui/material";

import {Controller, useFieldArray, useFormContext} from "react-hook-form";
import {number, object} from "zod";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";


export const testGroupSchema = object({
    count: number().min(0).max(100).int().nonnegative(),
    points: number().min(0).max(100).nonnegative(),
    pointsPerTest: number().min(0).max(100).nonnegative(),
});

function TestGroupView({namePrefix}: {namePrefix: string}) {
    const {control, formState: {errors}} = useFormContext();
    const getError = (path: string) => {
        if( path.includes('.') ) {
            const [rootName, index, fieldName] = path.split('.');
            // @ts-ignore
            return errors?.[rootName]?.[Number(index)]?.[fieldName];
        }
        return errors[path];
    }
    return <>
        <Stack direction="row" alignItems="top" alignContent="top" spacing={2}>
            <Controller name={`${namePrefix}count`} control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField variant="outlined" size="small" placeholder="4" type="number" fullWidth label="Number of tests"
                           onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                           error={Boolean(getError(`${namePrefix}count`))} helperText={getError(`${namePrefix}count`)?.message}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
            )}/>
            <Controller name={`${namePrefix}points`} control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField variant="outlined" size="small" placeholder="10" type="number" fullWidth label="Subtask points"
                           onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                           error={Boolean(getError(`${namePrefix}points`))} helperText={getError(`${namePrefix}points`)?.message}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
            )}/>
            <Controller name={`${namePrefix}pointsPerTest`} control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField variant="outlined" size="small" placeholder="10" type="number" fullWidth label="Points per test"
                           onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                           error={Boolean(getError(`${namePrefix}pointsPerTest`))} helperText={getError(`${namePrefix}pointsPerTest`)?.message}
                           inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
            )}/>
        </Stack>
    </>
}

const TestGroup = memo(TestGroupView);


function TestGroupsForm() {
    const {control, watch} = useFormContext();
    const { fields, append, remove } = useFieldArray({control, name: 'testGroups'});
    const watchFieldArray = watch('testGroups');
    const controlledFields = fields.map((field, index) => {
        return {...field, ...watchFieldArray[index]};
    });

    const addTestGroup = () => append({count: 0, points: 0, pointsPerTest: 0});


    return <>
        <List>
            {controlledFields && controlledFields.map((item, index) => (
                <ListItem key={item.id} secondaryAction={<IconButton edge="end" title="Delete" onClick={() => remove(index)}><CloseIcon /></IconButton>}>
                    <TestGroup namePrefix={`testGroups.${index}.`} />
                </ListItem>
            ))}
            <Button key="add" sx={{textTransform: 'none', marginLeft: 2}} startIcon={<AddIcon/>} onClick={() => addTestGroup()}>Add subtask</Button>
        </List>
    </>
}

export default memo(TestGroupsForm);
