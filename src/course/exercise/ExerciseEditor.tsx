import React, {memo, useCallback, useContext, useEffect, useState} from "react";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {COMPARISON_MODES, Course, Exercise, EXERCISE_TYPES} from 'models/courses';
import {Alert, Autocomplete, Button, FormControlLabel, Snackbar, Stack, Switch, TextField} from "@mui/material";
import LocalizedFields, {FieldSchema, fieldSchema} from "./LocalizedFields";
import Box from "@mui/material/Box";
import {LANGUAGE_KEYS} from "models/language";
import AutocompleteSearch from "../../common/AutocompleteSearch";
import {getCourses, searchCourses} from "../../services/courses";
import {getExercisePrivateFields, updateExercise} from "../../services/exercises";
import { reEvaluateSubmissions } from "../../services/submissions";

import {Controller, useForm, FormProvider} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {infer as Infer, object, string, array, enum as zodEnum, literal, number, boolean, union} from "zod";
import CodeForm from "./CodeForm";
import TextAnswerForm from "./TextAnswerForm";
import CheckboxesForm from "./CheckboxesForm";
import MultipleChoiceForm from "./MultipleChoiceForm";
import useAsyncEffect from "use-async-effect";
import {AlertColor} from "@mui/material/Alert/Alert";


const baseSchema = {
    localizedFields: array(fieldSchema).nonempty(),
    isPublic: boolean(),
    level: number().positive().int(),
    levelOrder: number().nonnegative().int(),
    score: number().min(0).max(1000).int(),
    allowedAttempts: number().min(1).max(100).int(),
    unlockContent: array(string().min(20).max(35)),
} as const;
const codeSchema = object({
    ...baseSchema,
    exerciseType: literal('code'),
    allowedLanguages: array(zodEnum(LANGUAGE_KEYS)).nonempty(),
    memoryLimit: number().min(10).max(1000),
    timeLimit: number().min(0.001).max(30),
    outputLimit: number().min(0.001).max(10),
    floatPrecision: number().min(0.00000000000001).max(0.1),
    comparisonMode: zodEnum(COMPARISON_MODES),
    testCases: array(object({
        input: string().max(10000),
        target: string().max(10000),
    })).max(25),
});
const textSchema = object({
    ...baseSchema,
    exerciseType: literal('textAnswer'),
    question: string().min(3).max(300),
    answer: string().min(1).max(300),
});
const checkboxesSchema = object({
    ...baseSchema,
    exerciseType: literal('checkboxes'),
    question: string().min(3).max(300),
    answer: string().max(200),
    options: array(string().min(1).max(200)).nonempty(),
});
const multipleChoiceSchema = object({
    ...baseSchema,
    exerciseType: literal('multipleChoice'),
    question: string().min(3).max(300),
    answer: string().min(1).max(200),
    options: array(string().min(1).max(200)).nonempty(),
});

const schema = union([codeSchema, textSchema, checkboxesSchema, multipleChoiceSchema]);
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
    const [snackbar, setSnackbar] = useState<{message: string, severity: AlertColor} | null>(null);
    const handleCloseSnackbar = () => setSnackbar(null);

    const getDefaultFieldValues = useCallback(() => {
        const level = exercise?.order ? Math.trunc(exercise.order) : 1;
        const levelOrder = exercise?.order ? parseInt((exercise.order - level).toFixed(3).substring(2)) : 0;
        return {
            localizedFields: getExerciseLocalizedFields(exercise, 'enUS'),
            isPublic: Boolean(exercise &&  exercise.order && exercise.order >= 1),
            level: level,
            levelOrder: levelOrder,
            score:  exercise?.score ?? 100,
            allowedAttempts: exercise?.allowedAttempts ?? 100,
            exerciseType: exercise?.exerciseType ?? 'code',
            unlockContent: exercise?.unlockContent ?? [],
            allowedLanguages: exercise?.allowedLanguages ?? [],
            memoryLimit: exercise?.memoryLimit ?? 512,
            timeLimit: exercise?.timeLimit ?? 1,
            outputLimit: exercise?.outputLimit ?? 1,
            floatPrecision: exercise?.floatPrecision ?? 0.0001,
            testCases: exercise?.testCases ?? [],
            comparisonMode: exercise?.comparisonMode ?? 'token',
            question: exercise?.question,
            options: exercise?.options,
        }
    }, [exercise]);

    const formMethods = useForm<Schema>({
        mode: 'onChange',
        resolver: zodResolver(schema),
        // @ts-ignore
        defaultValues: getDefaultFieldValues(),
    });
    const {control, watch, handleSubmit, formState: {errors, isValid, isDirty}, reset, setValue} = formMethods;
    errors && Object.keys(errors).length && console.log('errors:', errors);
    const isPublic = watch('isPublic');

    const exerciseType: keyof typeof EXERCISE_TYPES = watch('exerciseType');
    const onExerciseTypeChanged = (newType: keyof typeof EXERCISE_TYPES) => {
        if (newType !== 'code' && newType !== 'textAnswer' && newType !== 'checkboxes' && newType !== 'multipleChoice')
            throw Error(`Wrong exercise type: ${newType}`);

        setValue('exerciseType', newType, {shouldTouch: true});
        exerciseTypeChanged(newType);
    }
    const nameToExerciseType = (name: string) => Object.keys(EXERCISE_TYPES).find(key => EXERCISE_TYPES[key].displayName === name);

    // @ts-ignore
    useEffect(() => reset(getDefaultFieldValues()), [exercise, getDefaultFieldValues, reset]);
    useAsyncEffect(async () => {
        if( course?.id && exercise?.id && exercise?.exerciseType
            && ['textAnswer', 'checkboxes', 'multipleChoice'].includes(exercise.exerciseType as string) ) {
            const fields = await getExercisePrivateFields(course.id, exercise.id);

            if( fields?.answer )
                setValue('answer', fields.answer, {shouldTouch: true});
        }
    }, [exercise]);
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
            // @ts-ignore
            data.allowedLanguages, data.memoryLimit, data.timeLimit, data.outputLimit, data.floatPrecision, data.comparisonMode, data.testCases,
            // @ts-ignore
            data.question, data.answer, data.options,
        );
        setSnackbar({message: 'Successfully saved the changes!', severity: 'success'});
    };
    const onReEvaluate = async () => {
        if( !course?.id || !exercise?.id )
            return;
        setSnackbar({message: 'Resubmitting all the submissions. Please wait...', severity: 'success'});
        await reEvaluateSubmissions(course.id, exercise.id);
        setSnackbar({message: 'Done! Go to All submissions for more information', severity: 'success'});
    };

    if( !exercise )
        return <></>
    return <>
        <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)}>
        <Box m={1} marginBottom={16}>
            <Stack direction="row" spacing={1} marginTop={4} marginBottom={2} justifyContent="right" alignItems="center" alignContent="center">
                <Button size="medium" variant="outlined" color="warning" disabled={!isValid || isDirty} onClick={onReEvaluate}>Re-evaluate submissions</Button>
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

                {isPublic && <>
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
                              renderInput={(params) => (
                                  <TextField
                                      {...params} label="Exercise type"
                                      error={Boolean(errors.exerciseType)} helperText={errors.exerciseType?.message} />
                              )}/>
            )} />
            <br/>

            {exerciseType === 'code' && <CodeForm />}
            {exerciseType === 'textAnswer' && <TextAnswerForm />}
            {exerciseType === 'checkboxes' && <CheckboxesForm />}
            {exerciseType === 'multipleChoice' && <MultipleChoiceForm />}
        </Box>
        </form>
        </FormProvider>

        <Snackbar open={!!snackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity={snackbar?.severity} sx={{ width: '100%' }}>
                {snackbar?.message}
            </Alert>
        </Snackbar>
    </>
}

export default memo(ExerciseEditor);
