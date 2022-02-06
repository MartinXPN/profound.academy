import React, { memo } from "react";
import {Autocomplete, Stack, TextField, Typography} from "@mui/material";
import {Controller, useFormContext} from "react-hook-form";
import {LANGUAGES} from "../../models/language";
import {COMPARISON_MODES} from "../../models/courses";


function TestCasesForm() {
    const {control, watch, formState: {errors}} = useFormContext();
    const nameToLanguageId = (name: string) => Object.keys(LANGUAGES).find(key => LANGUAGES[key].displayName === name);
    const comparisonMode = watch('comparisonMode');


    return <>
        <Stack direction="row" spacing={1}>
            <Controller name="allowedLanguages" control={control} render={({field}) => (
                <Autocomplete
                    sx={{ width: 200 }} ref={field.ref} multiple autoHighlight autoSelect disableCloseOnSelect disableClearable
                    value={field.value.map((l: string) => LANGUAGES[l].displayName)}
                    onChange={(event, values: string[] | null) => values && field.onChange(values.map(v => nameToLanguageId(v)!))}
                    options={Object.keys(LANGUAGES).map(key => LANGUAGES[key].displayName)}
                    renderInput={(params) => (
                        <TextField {...params} label="Allowed languages"
                                   error={Boolean(errors.allowedLanguages)}
                            // @ts-ignore
                                   helperText={errors.allowedLanguages?.message}/>
                    )} />
            )} />

            <Controller name="comparisonMode" control={control} render={({field: {onChange, ...field}}) => <>
                <Autocomplete
                    sx={{ width: 200 }} autoHighlight autoSelect disableClearable {...field}
                    onChange={(event, value) => onChange(value)}
                    options={COMPARISON_MODES}
                    renderInput={(params) => (
                        <TextField
                            {...params} label="Checker" error={Boolean(errors.comparisonMode)}
                            helperText={field.value === 'whole'
                                ? 'Compare whole output with the target'
                                : field.value === 'token'
                                    ? 'Token-by-token comparison'
                                    : 'Need to implement a custom checker'} />
                    )}/>
            </>} />

            {comparisonMode === 'token' && <>
                <Controller name="floatPrecision" control={control} render={({field: {ref, onChange, ...field}}) => (
                    <TextField required variant="outlined" placeholder="0.001" type="number" label="Float precision"
                               onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                               error={Boolean(errors.floatPrecision)} helperText={errors.floatPrecision?.message}
                               inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}} inputRef={ref} {...field} sx={{flex: 1}}/>
                )}/>
            </>}
        </Stack>

        <Typography variant="h6" marginBottom={2} marginTop={8}>Execution Parameters (per test-case)</Typography>
        <Stack direction="row" spacing={1}>
            <Controller name="memoryLimit" control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField
                    required variant="outlined" placeholder="512" type="number" label="Memory limit (MB)"
                    onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                    error={Boolean(errors.memoryLimit)} helperText={errors.memoryLimit?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>

            <Controller name="timeLimit" control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField
                    required variant="outlined" placeholder="2" type="number" label="Time limit (s)"
                    onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                    error={Boolean(errors.timeLimit)} helperText={errors.timeLimit?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>

            <Controller name="outputLimit" control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField
                    required variant="outlined" placeholder="1" type="number" label="Output limit (MB)"
                    onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                    error={Boolean(errors.outputLimit)} helperText={errors.outputLimit?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>
        </Stack>
    </>
}

export default memo(TestCasesForm);
