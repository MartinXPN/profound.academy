import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {Autocomplete, Badge, IconButton, LinearProgress, Link, MenuItem, Stack, TextField, Typography} from "@mui/material";
import {Controller, useFieldArray, useFormContext} from "react-hook-form";
import {LANGUAGES} from "models/language";
import {COMPARISON_MODES} from "models/exercise";
import {styled} from "@mui/material/styles";
import Box from "@mui/material/Box";
import {FileUploader} from "react-drag-drop-files";
import {updateTestCases} from "../../services/exercises";
import {CourseContext, CurrentExerciseContext} from "../Course";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import HighlightOffTwoToneIcon from "@mui/icons-material/HighlightOffTwoTone";
import ToggleButton from "@mui/material/ToggleButton";
import {Add} from "@mui/icons-material";
import TestGroupsForm from "./TestGroupsForm";

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



function CodeForm() {
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const {control, watch, formState: {errors}} = useFormContext();
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [selectedTest, setSelectedTest] = useState<number | null>(null);

    useEffect(() => {
        setProgress(0);
        setError(null);
    }, [exercise?.id]);
    const onTestSelected = useCallback((newTest: number | null) => setSelectedTest(newTest === selectedTest ? null : newTest), [selectedTest]);

    const nameToLanguageId = (name: string) => Object.keys(LANGUAGES).find(key => LANGUAGES[key].displayName === name);
    const comparisonMode = watch('comparisonMode');
    const { fields, append, remove } = useFieldArray({control, name: 'testCases'});
    const watchTests = watch('testCases');
    const tests = fields.map((field, index) => {
        return {...field, ...watchTests[index]};
    });
    const removeTest = (index: number) => {
        setSelectedTest(1 <= index && index < tests.length ? index - 1 : null);
        remove(index);
    }
    const addTest = () => {
        setSelectedTest(tests.length);
        append({input: '', target: ''});
    }

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
                    sx={{ width: 200 }} ref={field.ref} multiple autoHighlight disableCloseOnSelect disableClearable
                    value={field.value.map((l: string) => LANGUAGES[l].displayName)}
                    onChange={(event, values: string[] | null) => values && field.onChange(values.map(v => nameToLanguageId(v)!))}
                    options={Object.keys(LANGUAGES).map(key => LANGUAGES[key].displayName)}
                    renderInput={(params) => (
                        <TextField {...params} label="Allowed languages"
                                   error={Boolean(errors.allowedLanguages)} helperText={errors.allowedLanguages?.message}/>
                    )} />
            )} />

            <Controller name="comparisonMode" control={control} render={({ field: { ref, ...field } }) => (
                <TextField select label="Checker" variant="outlined" inputRef={ref} {...field} helperText={{
                    'whole': 'Compare whole output with the target',
                    'token': 'Split output and target into tokens before comparing',
                    'custom': 'Need to implement a custom checker',
                }[field.value as typeof COMPARISON_MODES[number]]}>

                    <MenuItem value="whole">Exact match</MenuItem>
                    <MenuItem value="token">Token-by-token match</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                </TextField>
            )} />

            {comparisonMode === 'token' && <>
                <Controller name="floatPrecision" control={control} render={({field: {ref, onChange, ...field}}) => (
                    <TextField required variant="outlined" placeholder="0.001" type="number" label="Float precision"
                               onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                               error={Boolean(errors.floatPrecision)} helperText={errors.floatPrecision?.message}
                               inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}} inputRef={ref}
                               {...field} sx={{flex: 1, minWidth: 100}} />
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

        <Typography variant="h6" marginBottom={2} marginTop={8}>Test cases (public and private)</Typography>
        <Stack direction="row" alignItems="center" alignContent="center">
            <Typography marginRight={1}>Public tests: </Typography>
            <ToggleButtonGroup size="small">
                {tests.map((test, index) => {
                    return (<div key={index.toString()}>
                        <Badge invisible={selectedTest !== index} badgeContent={
                            <HighlightOffTwoToneIcon
                                fontSize="small" sx={{ color: '#515151', "&:focus,&:hover": {cursor: 'pointer'}}}
                                onClick={() => removeTest(index)}/>
                        }>
                            <ToggleButton value={index} id={`${index}`}
                                          onClick={() => onTestSelected(index)}
                                          color={(!Boolean(errors.testCases?.[index]?.input) && !Boolean(errors.testCases?.[index]?.target)) ? 'standard' : 'error'}
                                          sx={{paddingLeft: 3, paddingRight: 3}}
                                          selected={true}>
                                <Typography>{index + 1}</Typography>
                            </ToggleButton>
                        </Badge>
                    </div>)}
                )}
            </ToggleButtonGroup>
            <IconButton sx={{padding: '12px'}} onClick={addTest} size="large"><Add /></IconButton>
        </Stack>
        {selectedTest !== null && 0 <= selectedTest && selectedTest < tests.length && tests.map((test, index) => index === selectedTest && <>
            <Stack spacing={1} hidden={selectedTest !== index}>
                <Controller name={`testCases.${index}.input`} control={control} render={({ field: { ref, ...field } }) => (
                    <TextField
                        multiline fullWidth variant="outlined" label="Input" placeholder="Start typing the input..."
                        error={Boolean(errors.testCases?.[index]?.input)} helperText={errors.testCases?.[index]?.input?.message}
                        inputRef={ref} {...field} />
                )}/>

                <Controller name={`testCases.${index}.target`} control={control} render={({ field: { ref, ...field } }) => (
                    <TextField
                        multiline fullWidth variant="outlined" label="Expected output" placeholder="Start typing the expected output..."
                        error={Boolean(errors.testCases?.[index]?.target)} helperText={errors.testCases?.[index]?.target?.message}
                        inputRef={ref} {...field} />
                )}/>
            </Stack>
        </>)}
        <br/>

        <Box justifyContent="center" justifyItems="center" justifySelf="center">
            <FileUploader
                handleChange={handleUpload}
                maxSize={100}
                name="file"
                types={fileTypes}>

                <UploadBackground boxShadow={3}>
                    <Typography color="common.white" align="center">Private test cases (.zip)</Typography>
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

        <Typography marginTop="1em">Advanced scoring through subtasks:</Typography>
        <TestGroupsForm />


        <Typography align="center" marginTop="10em">
            An editor similar to <Link href="https://polygon.codeforces.com/" target="_blank" rel="noopener noreferrer">Codeforces-Polygon</Link> is coming soon...
        </Typography>
    </>
}

export default memo(CodeForm);
