import {memo, useCallback, useContext, useEffect, useState} from "react";
import {Course} from "models/courses";
import {AuthContext} from "../App";
import {Button, FormControlLabel, Stack, TextField, Typography, Switch, Grid, Alert, Snackbar, MenuItem, Collapse, ListItemIcon, ListItemText, ListItemButton} from "@mui/material";
import {GroupAdd} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {FileUploader} from "react-drag-drop-files";
import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import {styled} from "@mui/material/styles";
import Content from "../common/notion/Content";
import {useNavigate} from "react-router-dom";
import {getUsers, searchUser, uploadPicture} from "../services/users";
import {genCourseId, onCoursePrivateFieldsChanged, sendCourseInviteEmails, updateCourse, updateCoursePrivateFields} from "../services/courses";
import {User} from "models/users";
import AutocompleteSearch from "../common/AutocompleteSearch";

import {Controller, useForm, FormProvider} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {boolean, infer as Infer, date, object, string, array, enum as zodEnum} from "zod";
import {Moment} from "moment";
import CourseInvitations from "./CourseInvitations";
import {CoursePrivateFields} from "models/lib/courses";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import { notionPageToId } from "../services/notion";
import {useScreenAnalytics} from "../analytics";


const schema = object({
    img: string().url(),
    revealsAt: date(),
    freezeAt: date(),
    visibility: zodEnum(['public', 'unlisted', 'private']),
    rankingVisibility: zodEnum(['public', 'private']),
    allowViewingSolutions: boolean(),
    title: string().min(3).max(128),
    author: string().min(3).max(128),
    introduction: string().min(20).max(35),
    instructors: array(string().min(25).max(30)),

    // private fields
    invitedEmails: array(string().email()).max(1000),
    mailSubject: string().min(3).max(1000).optional(),
    mailText: string().min(10).max(5000).optional(),
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
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [invitesOpen, setInvitesOpen] = useState(false);
    const [privateFields, setPrivateFields] = useState<CoursePrivateFields | null>(null);
    useScreenAnalytics(`course_editor_${course?.id}`);

    const onInviteUsersClicked = () => setInvitesOpen(open => !open)

    const getDefaultFieldValues = useCallback(() => {
        return {
            img: course?.img,
            revealsAt: course?.revealsAt ? course.revealsAt.toDate() : new Date(),
            freezeAt: course?.freezeAt ? course.freezeAt.toDate() : new Date(),
            visibility: course?.visibility ?? 'private',
            rankingVisibility: course?.rankingVisibility ?? 'private',
            allowViewingSolutions: course?.allowViewingSolutions ?? false,
            title: course?.title,
            author: course?.author,
            instructors: course?.instructors,
            introduction: course?.introduction,

            invitedEmails: privateFields?.invitedEmails ?? [],
            mailSubject: privateFields?.mailSubject ?? undefined,
            mailText: privateFields?.mailText ?? undefined,
        }
    }, [course, privateFields]);

    const formMethods = useForm<Schema>({
        mode: 'onChange',
        resolver: zodResolver(schema),
        defaultValues: getDefaultFieldValues(),
    });
    const {control, watch, handleSubmit, formState: { errors, isValid }, setValue, reset} = formMethods;
    const introId = watch('introduction', course?.introduction);
    errors && Object.keys(errors).length && console.log('errors:', errors);
    useEffect(() => reset(getDefaultFieldValues()), [course, reset, privateFields, getDefaultFieldValues]);
    useEffect(() => {
        if( !course?.id )
            return;
        return onCoursePrivateFieldsChanged(course.id, privateFields => {
            setPrivateFields(privateFields);
        });
    }, [course, reset]);

    const onSubmit = async (data: Schema, navigateToCourse: boolean) => {
        if( !auth.currentUserId )
            return;
        const id = course?.id ?? await genCourseId(data.title);

        console.log('submit!', id, data)
        await updateCourse(
            auth.currentUserId,
            id, data.img,
            data.revealsAt, data.freezeAt,
            data.visibility, data.rankingVisibility, data.allowViewingSolutions,
            data.title, data.author, data.instructors, data.introduction
        );
        console.log('updated the course:', id);
        // needs to happen sequentially for the instructor to have permission to update private fields
        await updateCoursePrivateFields(id, data.invitedEmails, undefined, data.mailSubject, data.mailText);

        if( navigateToCourse )
            navigate(`/${id}`);
        setOpenSnackbar(true);
        return id;
    }
    const onCancel = () => navigate(-1);
    const onSendInvites = async () => {
        console.log('onSendInvites');
        await handleSubmit(async data => {
            const courseId = await onSubmit(data, false);
            if( !courseId )
                return;
            await sendCourseInviteEmails(courseId);
            if( course?.id !== courseId )
                navigate(`/${courseId}/edit`);
        })();
    }

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
        <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(data => onSubmit(data, true))}>
        <Box maxWidth="48em" marginLeft="auto" marginRight="auto" marginTop="2em" marginBottom="2em">
        <Stack direction="column" spacing={3}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" alignContent="center">
                <Typography variant="h4" sx={{flex: 1}}>Course Editor</Typography>
                <Button size="large" variant="outlined" type="submit" disabled={!isValid}>Save</Button>
                <Button size="large" variant="outlined" onClick={onCancel}>Cancel</Button>
            </Stack>

            <Stack direction="row" justifyContent="top" alignItems="top" alignContent="top" spacing={2}>
                <Controller name="title" control={control} render={({ field: { ref, ...field } }) => (
                    <TextField required label="Title" variant="outlined" placeholder="Course Title"
                               error={Boolean(errors.title)} helperText={errors.title?.message}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>

                <Controller name="visibility" control={control} render={({ field: { ref, ...field } }) => (
                    <TextField select label="Visibility" variant="outlined" inputRef={ref} {...field}>
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="unlisted">Unlisted</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                    </TextField>
                )} />
            </Stack>

            <Controller name="img" control={control} render={({field}) => <>
                <Box width={300} height={180}>
                    <FileUploader
                        handleChange={handleImageChange}
                        minSize={0.0001}
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
                <Controller name="author" control={control} render={({ field: { ref, ...field } }) => (
                    <TextField required label="Authors" variant="outlined" placeholder="Displayed name of the creator"
                               error={Boolean(errors.author)} helperText={errors.author?.message}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>

                <Controller name="instructors" control={control} render={({field}) => <>
                    { /* @ts-ignore */}
                    <AutocompleteSearch<User>
                        label="Instructors" placeholder="Instructor users..."
                        search={searchUser} idsToValues={getUsers}
                        optionToId={option => option.id}
                        optionToLabel={option => option.displayName ?? ''}
                        optionToImageUrl={option => option.imageUrl}
                        initialIds={course?.instructors}
                        onChange={users => field.onChange(users.map(u => u.id))}
                        sx={{flex: 1}} />
                </>} />
            </Stack>


            <Stack direction="row" spacing={2}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <Controller name="revealsAt" control={control} render={({ field }) => (
                    <DateTimePicker label="Course reveals for students at" value={field.value} inputRef={field.ref}
                                    renderInput={params => <TextField {...params} />}
                                    onChange={(newDate: Moment | null) => newDate && field.onChange(newDate.toDate())} />
                )}/>
                <Controller name="freezeAt" control={control} render={({ field }) => (
                    <DateTimePicker label="Rankings freeze at" value={field.value} inputRef={field.ref}
                                    renderInput={params => <TextField {...params} />}
                                    onChange={(newDate: Moment | null) => newDate && field.onChange(newDate.toDate())} />
                )}/>

                <Typography sx={{flex: 1}}/>
                <Controller name="rankingVisibility" control={control} render={({ field }) => (
                    <FormControlLabel label="Is ranking visible" labelPlacement="start" control={
                        <Switch checked={field.value === 'public'} inputRef={field.ref}
                                onChange={e => field.onChange(e.target.checked ? 'public' : 'private')} />
                        } />
                )} />
            </LocalizationProvider>
            </Stack>

            <Stack direction="row" spacing={2}>
                <Controller name="introduction" control={control} render={({ field: { ref, onChange, ...field } }) => (
                    <TextField required label="Introduction Notion Page" variant="outlined" placeholder="Notion page Page"
                               error={Boolean(errors.introduction)} helperText={errors.introduction?.message}
                               onChange={e => onChange(notionPageToId(e.target.value))}
                               inputRef={ref} {...field} sx={{flex: 1}} />
                )}/>

                <Controller name="allowViewingSolutions" control={control} render={({ field: { ref, ...field } }) => (
                    <FormControlLabel label="Allow viewing solutions" labelPlacement="start" control={
                        <Switch inputRef={ref} {...field} />
                    } />
                )} />
            </Stack>

            <>
                <ListItemButton onClick={onInviteUsersClicked}>
                    <ListItemIcon>
                        <GroupAdd />
                    </ListItemIcon>
                    <ListItemText primary="Invite users" />
                    {invitesOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={invitesOpen}>
                    <CourseInvitations onSendInvites={onSendInvites} />
                </Collapse>
            </>

            <br/>
            {introId && <Content notionPage={introId} />}
        </Stack>
        </Box>
        </form>
        </FormProvider>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                Successfully saved the changes!
            </Alert>
        </Snackbar>
    </>;
}

export default memo(CourseEditor);
