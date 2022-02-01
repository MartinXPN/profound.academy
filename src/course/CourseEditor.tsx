import React, {memo, useCallback, useContext, useState} from "react";
import {Course} from "../models/courses";
import {AuthContext} from "../App";
import {Button, FormControlLabel, Stack, TextField, Typography, Switch, Grid, Alert, Snackbar, MenuItem} from "@mui/material";
import Box from "@mui/material/Box";
import {FileUploader} from "react-drag-drop-files";
import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import {styled} from "@mui/material/styles";
import Content from "./Content";
import {useHistory} from "react-router-dom";
import {getUsers, searchUser, uploadPicture} from "../services/users";
import {doesExist, updateCourse} from "../services/courses";
import {User} from "../models/users";
import AutocompleteSearch from "../common/AutocompleteSearch";

import { Controller, useForm } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {boolean, infer as Infer, date, object, string, array, enum as zodEnum, ZodIssueCode} from "zod";
import {notionPageToId} from "../util";
import {Moment} from "moment";


const validIdCharacters = new RegExp(/^[a-z0-9-]*$/);
const existingCourseIds: {[key: string]: boolean} = {}
const schema = object({
    id: string().min(5).max(40)
        .superRefine(async (val, ctx) => {
            if( !val )
                return ctx.addIssue({code: ZodIssueCode.custom, message: 'ID is required to create a course'})
            if( !validIdCharacters.test(val) )
                return ctx.addIssue({code: ZodIssueCode.custom, message: 'Should only contain lowercase latin letters, numbers, and hyphens (-)'})
            if( val in existingCourseIds ) {
                if( existingCourseIds[val] )
                    ctx.addIssue({code: ZodIssueCode.custom, message: 'Course with this ID already exists'});
                return;
            }
            existingCourseIds[val] = await doesExist(val);
            if( existingCourseIds[val] )
                return ctx.addIssue({code: ZodIssueCode.custom, message: 'Course with this ID already exists'})
        }),
    img: string().url(),
    revealsAt: date(),
    freezeAt: date(),
    visibility: zodEnum(['public', 'unlisted', 'private']),
    rankingVisibility: zodEnum(['public', 'private']),
    allowViewingSolutions: boolean(),
    title: string().min(3).max(128),
    author: string().min(3).max(128),
    details: string().min(3).max(128),
    introduction: string().min(20).max(35),
    instructors: array(string()),
});
type Schema = Infer<typeof schema>;


const UploadBackground = styled(Box)({
    width: 300,
    height: 180,
    gridColumn: 1,
    gridRow: 1,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(50,50,50,0.50)',
});
const fileTypes = ['jpeg', 'jpg', 'png', 'webp'];



function CourseEditor({course}: {course?: Course | null}) {
    const history = useHistory();
    const auth = useContext(AuthContext);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const {control, watch, handleSubmit, formState: { errors }, setValue} = useForm<Schema>({
        mode: 'onChange',
        resolver: zodResolver(schema)
    });
    const introId = watch('introduction', course?.introduction);
    const onSubmit = async (data: Schema) => {
        console.log('submit!', data)
        await updateCourse(
            data.id, data.img,
            data.revealsAt, data.freezeAt,
            data.visibility, data.rankingVisibility, data.allowViewingSolutions,
            data.title, data.author, data.instructors, data.details, data.introduction
        );

        history.push(`/${data.id}`);
        setOpenSnackbar(true);
    }
    const onCancel = () => history.goBack();

    const onInstructorsChanged = (users: User[]) => setValue('instructors', users.map(u => u.id));
    const handleImageChange = useCallback(async (file: File) => {
        if( !auth.currentUserId )
            return;
        console.log('uploading...');
        const imageUrl = await uploadPicture(auth.currentUserId, file);
        console.log('got image url:', imageUrl);
        setValue('img', imageUrl, {shouldTouch: true});
    }, [auth.currentUserId, setValue]);
    const handleCloseSnackbar = () => setOpenSnackbar(false);

    if( !auth.currentUserId )
        return <>
            <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center" marginTop="5em" marginBottom="5em">
                <Typography>You need to sign in to edit a course</Typography>
                <Button onClick={onCancel} size="large" variant="outlined">Go Back</Button>
            </Grid>
        </>
    if( course && !course.instructors.includes(auth.currentUserId))
        return <>
            <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center" marginTop="5em" marginBottom="5em">
                <Typography>You are not in the instructor list of the course</Typography>
                <Button onClick={onCancel} size="large" variant="outlined">Go Back</Button>
            </Grid>
        </>

    return <>
        <form onSubmit={handleSubmit(onSubmit)} key={course?.id ?? 'new-course'}>
        <Box maxWidth="48em" marginLeft="auto" marginRight="auto" marginTop="2em" marginBottom="2em">
        <Stack direction="column" spacing={3}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" alignContent="center">
                <Typography variant="h4" sx={{flex: 1}}>Course Editor</Typography>
                <Button type="submit" size="large" variant="outlined">Save</Button>
                <Button onClick={onCancel} size="large" variant="outlined">Cancel</Button>
            </Stack>

            <Stack direction="row" justifyContent="top" alignItems="top" alignContent="top" spacing={2}>
                <Controller name="id" control={control} defaultValue={course?.id} render={({ field: { ref, ...field } }) => (
                    <TextField required label="ID" variant="outlined" placeholder="ID of the course"
                               error={Boolean(errors.id)} helperText={errors.id?.message}
                               inputRef={ref} {...field} inputProps={{ readOnly: Boolean(course) }} sx={{flex: 1}}  />
                )} />

                <Controller name="visibility" control={control} defaultValue={course?.visibility ?? 'private'} render={({ field: { ref, ...field } }) => (
                    <TextField select label="Visibility" variant="outlined" inputRef={ref} {...field}>
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="unlisted">Unlisted</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                    </TextField>
                )} />
            </Stack>

            <Stack direction="row" spacing={2}>
                <Controller name="title" control={control} defaultValue={course?.title} render={({ field: { ref, ...field } }) => (
                    <TextField required label="Title" variant="outlined" placeholder="Course Title"
                               error={Boolean(errors.title)} helperText={errors.title?.message}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>

                <Controller name="details" control={control} defaultValue={course?.details} render={({ field: { ref, ...field } }) => (
                    <TextField required multiline label="Description" variant="outlined" placeholder="Details"
                               error={Boolean(errors.details)} helperText={errors.details?.message}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>
            </Stack>

            <Controller name="img" control={control} defaultValue={course?.img} render={({field}) => <>
                <Box width={300} height={180}>
                    <FileUploader
                        handleChange={handleImageChange}
                        minSize={0.01}
                        maxSize={1}
                        name="file"
                        types={fileTypes}>

                        <div style={{display: 'grid'}}>
                            {field.value && <img width={300} height={180} src={field.value} loading="lazy" style={{ objectFit: 'cover', gridColumn: 1, gridRow: 1}}  alt="Course background"/>}
                            <UploadBackground boxShadow={3}>
                                <Typography color="common.white" align="center">Drag & Drop here</Typography>
                                <Typography color="common.white" align="center">Or click to select</Typography>
                                <Typography color="common.white" align="center" variant="body2">(Course Background)</Typography>
                            </UploadBackground>
                        </div>
                    </FileUploader>
                </Box>
                {errors.img && <Typography variant="body2" color="error">Background image is required</Typography>}
            </>}/>

            <Stack direction="row" spacing={2}>
                <Controller name="author" control={control} defaultValue={course?.author} render={({ field: { ref, ...field } }) => (
                    <TextField required label="Authors" variant="outlined" placeholder="Displayed name of the creator"
                               error={Boolean(errors.author)} helperText={errors.author?.message}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>

                <Controller name="instructors" control={control} defaultValue={course?.instructors} render={() => <>
                    { /* @ts-ignore */}
                    <AutocompleteSearch<User>
                    label="Instructors" placeholder="Instructor users..."
                    search={searchUser} idsToValues={getUsers}
                    optionToId={option => option.id}
                    optionToLabel={option => option.displayName ?? ''}
                    optionToImageUrl={option => option.imageUrl}
                    initialIds={course?.instructors}
                    onChange={onInstructorsChanged}
                    sx={{flex: 1}} />
                </>} />
            </Stack>


            <Stack direction="row" spacing={2}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <Controller name="revealsAt" control={control} defaultValue={course?.revealsAt ? course.revealsAt.toDate() : new Date()} render={({ field }) => (
                    <DateTimePicker label="Course reveals for students at" value={field.value} inputRef={field.ref}
                                    renderInput={params => <TextField {...params} />}
                                    onChange={(newDate: Moment | null) => newDate && setValue('revealsAt', newDate.toDate(), {shouldTouch: true})} />
                )}/>
                <Controller name="freezeAt" control={control} defaultValue={course?.freezeAt ? course.freezeAt.toDate() : new Date()} render={({ field }) => (
                    <DateTimePicker label="Rankings freeze at" value={field.value} inputRef={field.ref}
                                    renderInput={params => <TextField {...params} />}
                                    onChange={(newDate: Moment | null) => newDate && setValue('freezeAt', newDate.toDate(), {shouldTouch: true})} />
                )}/>

                <Typography sx={{flex: 1}}/>
                <Controller name="rankingVisibility" control={control} defaultValue={course?.rankingVisibility ?? 'private'} render={({ field }) => (
                    <FormControlLabel label="Is ranking visible" labelPlacement="start" control={
                        <Switch checked={field.value === 'public'} inputRef={field.ref}
                                onChange={(event) => setValue('rankingVisibility', event.target.checked ? 'public' : 'private', {shouldTouch: true})}/>
                        } />
                )} />
            </LocalizationProvider>
            </Stack>

            <Stack direction="row" spacing={2}>
                <Controller name="introduction" control={control} defaultValue={course?.introduction} render={({ field: { ref, onChange, ...field } }) => (
                    <TextField required label="Introduction Notion Page" variant="outlined" placeholder="Notion page Page"
                               error={Boolean(errors.introduction)} helperText={errors.introduction?.message}
                               onChange={e => onChange(notionPageToId(e.target.value))}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>

                <Controller name="allowViewingSolutions" control={control} defaultValue={course?.allowViewingSolutions ?? false} render={({ field: { ref, ...field } }) => (
                    <FormControlLabel label="Allow viewing solutions" labelPlacement="start" control={
                        <Switch inputRef={ref} {...field} />
                    } />
                )} />
            </Stack>

            <br/><br/><br/>
            {introId && <Content notionPage={introId} />}
        </Stack>
        </Box>
        </form>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                Successfully saved the changes!
            </Alert>
        </Snackbar>
    </>;
}

export default memo(CourseEditor);
