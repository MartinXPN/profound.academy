import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {COMPARISON_MODES, Course, Exercise, EXERCISE_TYPES} from '../../models/courses';
import {Alert, Autocomplete, Button, FormControlLabel, Snackbar, Stack, Switch, TextField} from "@mui/material";
import LocalizedFields, {FieldSchema, fieldSchema} from "./LocalizedFields";
import Box from "@mui/material/Box";
import {LANGUAGES} from "../../models/language";
import AutocompleteSearch from "../../common/AutocompleteSearch";
import {getCourses, searchCourses, updateExercise} from "../../services/courses";

import {Controller, useForm, FormProvider} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {infer as Infer, object, string, array, enum as zodEnum, number, boolean} from "zod";
import TestCasesForm from "./TestCasesForm";
import CodeForm from "./CodeForm";
import TextAnswerForm from "./TextAnswerForm";
import CheckboxesForm from "./CheckboxesForm";
import MultipleChoiceForm from "./MultipleChoiceForm";


// @ts-ignore
const EXERCISE_TYPE_NAMES: readonly [string, ...string[]] = Object.keys(EXERCISE_TYPES);
// @ts-ignore
const LANGUAGE_NAMES: readonly [string, ...string[]] = Object.keys(LANGUAGES);
const schema = object({
    localizedFields: array(fieldSchema).nonempty(),
    isPublic: boolean(),
    level: number().nonnegative().int(),
    levelOrder: number().nonnegative().int(),
    score: number().min(0).max(1000).int(),
    allowedAttempts: number().min(1).max(100).int(),
    exerciseType: zodEnum(EXERCISE_TYPE_NAMES),
    unlockContent: array(string().min(20).max(35)),
    allowedLanguages: array(zodEnum(LANGUAGE_NAMES)).nonempty(),
    memoryLimit: number().min(10).max(1000),
    timeLimit: number().min(0.001).max(30),
    outputLimit: number().min(0.001).max(10),
    floatPrecision: number().min(0.00000000000001).max(0.1),
    comparisonMode: zodEnum(COMPARISON_MODES),
});
type Schema = Infer<typeof schema>;


const getExerciseLocalizedFields = (exercise: Exercise | null, defaultLocale?: string) => {
    if( !exercise ) {
        if (defaultLocale)
            return [{locale: defaultLocale, title: '', notionId: ''}]
        return []
    }

    const fields: FieldSchema[] = [];
    if( typeof exercise.title === 'string' ) {
        if( typeof exercise.pageId !== 'string' )
            throw Error('Locale-dependent fields exercise title and pageId are not of the same type (string)');

        fields.push({locale: defaultLocale ?? 'enUS', title: exercise.title, notionId: exercise.pageId});
    }
    else if( typeof exercise.title === 'object' && typeof exercise.pageId === 'object' ) {
        for( const locale of Object.keys(exercise.title) )
            fields.push({locale: locale, title: exercise.title[locale], notionId: exercise.pageId[locale]});
    }
    else throw Error('Unsupported exercise title/pageId types');

    return fields;
}


function ExerciseEditor({cancelEditing, exerciseTypeChanged}: {
    cancelEditing: () => void,
    exerciseTypeChanged: (exerciseType: keyof typeof EXERCISE_TYPES) => void,
}) {
    const {course} = useContext(CourseContext);
    const {exercise} = useContext(CurrentExerciseContext);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const handleCloseSnackbar = () => setOpenSnackbar(false);

    const getDefaultFieldValues = useCallback(() => {
        const level = exercise?.order ? Math.trunc(exercise.order) : 0;
        const levelOrder = exercise?.order ? parseInt((exercise.order - level).toFixed(3).substring(2)) : 0;
        return {
            localizedFields: getExerciseLocalizedFields(exercise, 'enUS'),
            isPublic: exercise &&  exercise.order && exercise.order > 0,
            level: level,
            levelOrder: levelOrder,
            score:  exercise?.score ?? 100,
            allowedAttempts: exercise?.allowedAttempts ?? 100,
            exerciseType: exercise?.exerciseType ?? 'testCases',
            unlockContent: exercise?.unlockContent ?? [],
            allowedLanguages: exercise?.allowedLanguages ?? [],
            memoryLimit: exercise?.memoryLimit ?? 512,
            timeLimit: exercise?.timeLimit ?? 1,
            outputLimit: exercise?.outputLimit ?? 1,
            floatPrecision: exercise?.floatPrecision ?? 0.0001,
            comparisonMode: exercise?.comparisonMode ?? 'token',
        }
    }, [exercise]);

    const formMethods = useForm<Schema>({
        mode: 'onChange',
        resolver: zodResolver(schema),
        // @ts-ignore
        defaultValues: getDefaultFieldValues(),
    });
    const {control, watch, handleSubmit, formState: {errors, isValid}, reset, setValue} = formMethods;
    errors && Object.keys(errors).length && console.log('errors:', errors);
    const isPublic = watch('isPublic');

    // @ts-ignore
    const exerciseType: keyof typeof EXERCISE_TYPES = watch('exerciseType');
    const onExerciseTypeChanged = (newType: keyof typeof EXERCISE_TYPES) => {
        setValue('exerciseType', newType as string, {shouldTouch: true});
        exerciseTypeChanged(newType);
    }
    const nameToExerciseType = (name: string) => Object.keys(EXERCISE_TYPES).find(key => EXERCISE_TYPES[key].displayName === name);

    // @ts-ignore
    useEffect(() => reset(getDefaultFieldValues()), [exercise, getDefaultFieldValues, reset]);
    const onCancel = () => cancelEditing();
    const onSubmit = async (data: Schema) => {
        if( !course || !exercise )
            return;
        console.log('submit!', data);

        const levelOrder = String(data.levelOrder).padStart(3, '0');
        const order = data.isPublic ? parseFloat(`${data.level}.${levelOrder}`) : 0;
        console.log('Order:', order);

        await updateExercise(
            course.id, exercise.id,
            data.localizedFields.reduce((map, field) => {map[field.locale] = field.title; return map;}, {} as {[key: string]: string}),
            data.localizedFields.reduce((map, field) => {map[field.locale] = field.notionId; return map;}, {} as {[key: string]: string}),
            order,
            data.score,
            data.allowedAttempts,
            data.exerciseType,
            data.unlockContent,
            data.allowedLanguages,
            data.memoryLimit, data.timeLimit, data.outputLimit,
            data.floatPrecision, data.comparisonMode,
        );
        setOpenSnackbar(true);
    };

    if( !exercise )
        return <></>
    return <>
        <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box m={1} marginBottom={16}>
            <Stack direction="row" spacing={1} marginTop={4} justifyContent="center" alignItems="center" alignContent="center">
                <TextField label="ID" variant="outlined" value={exercise.id} size="small" sx={{flex: 1, marginRight: 3}} inputProps={{readOnly: true}}/>
                <Button size="large" variant="outlined" type="submit" disabled={!isValid && false}>Save</Button>
                <Button size="large" variant="outlined" onClick={onCancel}>Cancel</Button>
            </Stack>

            <LocalizedFields />
            <br/><br/>

            <Stack direction="row" spacing={1} marginTop={2}>
                <Controller name="isPublic" control={control} render={({ field: {ref, value, onChange, ...field} }) => (
                    <FormControlLabel label="Public" labelPlacement="start" control={
                        <Switch checked={value === true}
                                onChange={(event) => onChange(event.target.checked)}
                                inputRef={ref} {...field} />
                    } />
                )} />

                {Boolean(isPublic) && <>
                    <Controller name="level" control={control} render={({ field: { ref, onChange, ...field } }) => (
                        <TextField required variant="outlined" placeholder="4" type="number" fullWidth
                                   label="Level"
                                   onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                                   error={Boolean(errors.level)} helperText={errors.level?.message}
                                   inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
                    )}/>

                    <Controller name="levelOrder" control={control} render={({ field: { ref, onChange, ...field } }) => (
                        <TextField required variant="outlined" placeholder="2" type="number" fullWidth
                                   label="Order within level"
                                   onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                                   error={Boolean(errors.levelOrder)} helperText={errors.levelOrder?.message}
                                   inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
                    )}/>
                </>}
            </Stack>

            <Stack direction="row" spacing={1} marginTop={2}>
                <Controller name="score" control={control} render={({ field: { ref, onChange, ...field } }) => (
                    <TextField required variant="outlined" placeholder="100" type="number" label="Score"
                               onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                               error={Boolean(errors.score)} helperText={errors.score?.message}
                               inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
                )}/>

                <Controller name="allowedAttempts" control={control} render={({ field: { ref, onChange, ...field } }) => (
                    <TextField required variant="outlined" placeholder="100" type="number" label="Allowed attempts"
                               onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                               error={Boolean(errors.allowedAttempts)} helperText={errors.allowedAttempts?.message}
                               inputProps={{ inputMode: 'numeric', pattern: '[0-9.]*' }} inputRef={ref} {...field} sx={{flex: 1}}/>
                )}/>

                <Controller name="unlockContent" control={control} render={({field}) => <>
                    {/* @ts-ignore */}
                    <AutocompleteSearch<Course>
                        label="Unlock Content" placeholder="Courses or contests..."
                        search={searchCourses} idsToValues={getCourses}
                        optionToId={option => option.id}
                        optionToLabel={option => option.title ?? ''}
                        optionToImageUrl={option => option.img}
                        initialIds={exercise?.unlockContent}
                        onChange={content => field.onChange(content.map(c => c.id))}
                        sx={{flex: 3}} />
                </>} />
            </Stack>

            <br/><br/><br/>
            <Controller name="exerciseType" control={control} render={({field}) => (
                <Autocomplete sx={{ width: 200 }} autoHighlight autoSelect disableClearable ref={field.ref}
                              value={EXERCISE_TYPES[field.value].displayName}
                              options={Object.keys(EXERCISE_TYPES).map(key => EXERCISE_TYPES[key].displayName)}
                              onChange={(event, value: string | null) => value && onExerciseTypeChanged(nameToExerciseType(value)!)}
                              renderInput={(params) => <TextField {...params} label="Exercise type"/>}/>
            )} />
            <br/>

            {exerciseType === 'code' && <CodeForm />}
            {exerciseType === 'testCases' && <TestCasesForm />}
            {exerciseType === 'textAnswer' && <TextAnswerForm />}
            {exerciseType === 'checkboxes' && <CheckboxesForm />}
            {exerciseType === 'multipleChoice' && <MultipleChoiceForm />}
        </Box>
        </form>
        </FormProvider>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                Successfully saved the changes!
            </Alert>
        </Snackbar>
    </>
}

export default memo(ExerciseEditor);
