import {memo, useCallback, useContext, useEffect, useState} from "react";
import {CourseContext, CurrentExerciseContext} from "../Course";
import {COMPARISON_MODES, Exercise, EXERCISE_TYPES} from 'models/exercise';
import {Alert, Button, FormControlLabel, MenuItem, Snackbar, Stack, Switch, TextField} from "@mui/material";
import LocalizedFields, {FieldSchema, fieldSchema} from "../../common/LocalizedFields";
import Box from "@mui/material/Box";
import {getExercisePrivateFields, updateExercise} from "../../services/exercises";
import { reEvaluateSubmissions } from "../../services/submissions";
import {newLevel, saveLevels} from "../../services/levels";

import {Controller, useForm, FormProvider} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {infer as Infer, object, string, array, enum as zodEnum, literal, number, boolean, union} from "zod";
import CodeForm from "./CodeForm";
import TextAnswerForm from "./TextAnswerForm";
import CheckboxesForm from "./CheckboxesForm";
import MultipleChoiceForm from "./MultipleChoiceForm";
import useAsyncEffect from "use-async-effect";
import {AlertColor} from "@mui/material/Alert/Alert";
import {testGroupSchema} from "./TestGroupsForm";
import {LANGUAGES} from "models/language";
import {LocalizeContext} from "../../common/Localization";
import LevelEditor, {AddLevel} from "./LevelEditor";
import {Level} from "models/levels";

const LANGUAGE_KEYS = Object.keys(LANGUAGES) as [keyof typeof LANGUAGES] as unknown as readonly [string, ...string[]];

const baseSchema = {
    localizedFields: array(fieldSchema).nonempty(),
    isPublic: boolean(),
    level: string().min(1).max(50), // levelId
    levelOrder: number().nonnegative(),
    score: number().min(0).max(1000).int(),
    allowedAttempts: number().min(1).max(100).int(),
    unlockContent: array(string().min(5).max(35)),
} as const;
const codeSchema = object({
    ...baseSchema,
    exerciseType: literal('code'),
    allowedLanguages: zodEnum(LANGUAGE_KEYS).array().nonempty(),
    memoryLimit: number().min(10).max(1000),
    timeLimit: number().min(0.001).max(30),
    outputLimit: number().min(0.001).max(10),
    floatPrecision: number().min(0.00000000000001).max(0.1),
    comparisonMode: zodEnum(COMPARISON_MODES),
    testCases: array(object({
        input: string().max(10000),
        target: string().max(10000),
    })).max(25),
    testGroups: array(testGroupSchema).optional(),
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
    const {localize} = useContext(LocalizeContext);
    const [levels, setLevels] = useState<Level[]>(course?.levels ?? []);
    const [snackbar, setSnackbar] = useState<{message: string, severity: AlertColor} | null>(null);
    const handleCloseSnackbar = () => setSnackbar(null);

    const getDefaultFieldValues = useCallback(() => {
        return {
            localizedFields: getExerciseLocalizedFields(exercise, 'enUS'),
            isPublic: Boolean(exercise &&  exercise.levelId !== 'drafts'),
            level: exercise?.levelId ?? 'drafts',
            levelOrder: exercise?.order ?? 0,
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
            testGroups: exercise?.testGroups,
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
    const level = watch('level');
    if( isPublic && level === 'drafts' )
        setValue('level', course?.levels?.at(-1)?.id ?? 'drafts');

    // Keep track of the available levels
    useEffect(() => setLevels(course?.levels ?? []), [JSON.stringify(course?.levels)]);
    const onAddLevel = () => {
        if( !course?.id )
            return;
        const created = {id: newLevel(course.id), title: 'New level', score: 0, exercises: 0};
        setLevels(levels => [...levels, created]);
    }
    const onSaveLevel = async (levelId: string, title: string | {[key: string]: string}) => {
        if( !course?.id )
            return;
        const newLevels = levels.map(l => l.id === levelId ? {id: levelId, title: title, score: 0, exercises: 0} : l);
        await saveLevels(course.id, newLevels);
    }

    const exerciseType = watch('exerciseType');
    const onExerciseTypeChanged = (newType: keyof typeof EXERCISE_TYPES) => {
        setValue('exerciseType', newType, {shouldTouch: true});
        exerciseTypeChanged(newType);
    }

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

    const onSubmit = async (data: Schema) => {
        if( !course || !exercise )
            return;
        console.log('submit!', data);

        await updateExercise(
            course.id, exercise.id,
            data.localizedFields.reduce((map, field) => {map[field.locale] = field.title; return map;}, {} as {[key: string]: string}),
            data.localizedFields.reduce((map, field) => {map[field.locale] = field.notionId; return map;}, {} as {[key: string]: string}),
            data.isPublic ? data.level : 'drafts',
            data.levelOrder,
            data.score,
            data.allowedAttempts,
            data.exerciseType,
            data.unlockContent,
            // @ts-ignore
            data.allowedLanguages, data.memoryLimit, data.timeLimit, data.outputLimit, data.floatPrecision, data.comparisonMode, data.testCases, data.testGroups,
            // @ts-ignore
            data.question, data.answer, data.options,
        );
        setSnackbar({message: 'Successfully saved the changes!', severity: 'success'});
    };
    const onReEvaluate = async () => {
        if( !course?.id || !exercise?.id )
            return;
        setSnackbar({message: 'Resubmitting all the submissions. Please wait...', severity: 'info'});
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
                <Button size="large" variant="outlined" onClick={cancelEditing}>Cancel</Button>
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
                    <Controller name="level" control={control} render={({ field: { ref, ...field } }) => (
                        <TextField
                            select required label="Level" variant="outlined" fullWidth
                            error={Boolean(errors.level)} helperText={errors.level?.message}
                            inputRef={ref} {...field} sx={{flex: 1}}
                            SelectProps={{renderValue: option => localize(levels.filter(l => l.id === option)[0]?.title ?? '')}}>
                            {levels.map((level, index) => <MenuItem key={level.id} value={level.id}>
                                <LevelEditor level={level} levelOrder={index + 1} onSaveLevel={title => onSaveLevel(level.id, title)} />
                            </MenuItem>)}

                            <MenuItem key="add-level"><AddLevel onAddLevel={onAddLevel} /></MenuItem>
                        </TextField>
                    )}/>

                    <Controller name="levelOrder" control={control} render={({ field: { ref, onChange, ...field } }) => (
                        <TextField
                            required variant="outlined" placeholder="2" type="number" fullWidth
                            label="Order within level"
                            onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                            error={Boolean(errors.levelOrder)} helperText={errors.levelOrder?.message}
                            inputProps={{inputMode: 'numeric', pattern: '[0-9]*'}} inputRef={ref}
                            {...field} sx={{flex: 1}}/>
                    )}/>
                </>}
            </Stack>

            <Stack direction="row" spacing={1} marginTop={2}>
                <Controller name="score" control={control} render={({ field: { ref, onChange, ...field } }) => (
                    <TextField
                        required variant="outlined" placeholder="100" type="number" label="Score"
                        onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                        error={Boolean(errors.score)} helperText={errors.score?.message}
                        inputProps={{inputMode: 'numeric', pattern: '[0-9.]*'}} inputRef={ref}
                        {...field} sx={{flex: 1}}/>
                )}/>

                <Controller name="allowedAttempts" control={control} render={({ field: { ref, onChange, ...field } }) => (
                    <TextField
                        required variant="outlined" placeholder="100" type="number" label="Allowed attempts"
                        onChange={e => e.target.value ? onChange(Number(e.target.value)) : onChange(e.target.value)}
                        error={Boolean(errors.allowedAttempts)} helperText={errors.allowedAttempts?.message}
                        inputProps={{inputMode: 'numeric', pattern: '[0-9.]*'}} inputRef={ref}
                        {...field} sx={{flex: 1}} />
                )}/>

                {/*TODO: Replace this with level-based side quest unlocking*/}
                {/*<Controller name="unlockContent" control={control} render={({field}) => <>*/}
                {/*    /!* @ts-ignore *!/*/}
                {/*    <AutocompleteSearch<Course>*/}
                {/*        label="Unlock Content" placeholder="Courses or contests..."*/}
                {/*        search={searchCourses} idsToValues={getCourses}*/}
                {/*        optionToId={option => option.id}*/}
                {/*        optionToLabel={option => option.title ?? ''}*/}
                {/*        optionToImageUrl={option => option.img}*/}
                {/*        initialIds={exercise?.unlockContent}*/}
                {/*        onChange={content => field.onChange(content.map(c => c.id))}*/}
                {/*        sx={{flex: 3}} />*/}
                {/*</>} />*/}
            </Stack>

            <br/><br/><br/>
            <Controller name="exerciseType" control={control} render={({ field: { ref, ...field } }) => (
                <TextField select label="Exercise type" variant="outlined" inputRef={ref} {...field}
                           value={exerciseType}
                           onChange={e => e.target.value && onExerciseTypeChanged(e.target.value as keyof typeof EXERCISE_TYPES)}
                           error={Boolean(errors.exerciseType)} helperText={<>{errors.exerciseType?.message}</>}
                           sx={{ width: 200 }}>
                    {Object.entries(EXERCISE_TYPES).map(([id, exerciseType]) => <MenuItem value={id}>{exerciseType.displayName}</MenuItem>)}
                </TextField>
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
