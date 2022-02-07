import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {Autocomplete, LinearProgress, Stack, TextField, Typography} from "@mui/material";
import {Controller, useFormContext} from "react-hook-form";
import {LANGUAGES} from "../../models/language";
import {COMPARISON_MODES} from "../../models/courses";
import {styled} from "@mui/material/styles";
import Box from "@mui/material/Box";
import {FileUploader} from "react-drag-drop-files";
import {updateTestCases} from "../../services/courses";
import {CourseContext, CurrentExerciseContext} from "../Course";

const UploadBackground = styled(Box)({
    width: '100%',
    height: 200,
    gridColumn: 1,
    gridRow: 1,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(50,50,50,0.35)',
    borderRadius: 4,
});
const fileTypes = ['zip'];



function TestCasesForm() {
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const {control, watch, formState: {errors}} = useFormContext();
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setProgress(0);
        setError(null);
    }, [exercise?.id]);

    const nameToLanguageId = (name: string) => Object.keys(LANGUAGES).find(key => LANGUAGES[key].displayName === name);
    const comparisonMode = watch('comparisonMode');

    const handleUpload = useCallback( async (file: File) => {
        if( !course || !exercise )
            return;
        console.log('upload:', file.name);
        await updateTestCases(course.id, exercise.id, file, progress => setProgress(progress));
    }, [course, exercise]);



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
        <Stack direction="row" spacing={1} marginBottom={8}>
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

        <Box justifyContent="center" justifyItems="center" justifySelf="center">
            <FileUploader
                handleChange={handleUpload}
                minSize={0.001}
                maxSize={100}
                name="file"
                types={fileTypes}>

                <UploadBackground boxShadow={3}>
                    <Typography color="common.white" align="center">Test cases (.zip)</Typography>
                    <Typography color="common.white" align="center" variant="body2">Drag & Drop here or click to select</Typography>
                    <br/>
                    {(0 < progress  && progress < 100) && <Box width="100%"><LinearProgress variant="determinate" value={progress} /></Box>}
                    {progress === 100 && <>
                        <Typography sx={{color: 'success.main', fontWeight: 'bold'}}>Upload complete!</Typography>
                        <Typography color="common.white" align="center" variant="body2">Generating test cases from the uploaded file in the background...</Typography>
                    </>}
                    {progress !== 100 && <>
                        <Typography color="common.white" align="center" variant="body2">
                            The folder should be structured as a list of test cases (00.in.txt 00.ans.txt 01.in.txt etc)
                        </Typography>
                    </>}
                    {error && <Typography color="error">{error}</Typography>}
                </UploadBackground>
            </FileUploader>
        </Box>

    </>
}

export default memo(TestCasesForm);
