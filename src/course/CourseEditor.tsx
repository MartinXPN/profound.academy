import {memo, useCallback, useContext, useEffect, useState} from "react";
import {Course} from "models/courses";
import {AuthContext} from "../App";
import {Button, FormControlLabel, Stack, TextField, Typography, Switch, Grid, Alert, Snackbar, MenuItem, Collapse, ListItemIcon, ListItemText, ListItemButton, Container} from "@mui/material";
import {GroupAdd} from "@mui/icons-material";
import Box from "@mui/material/Box";
import {FileUploader} from "react-drag-drop-files";
import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import {styled} from "@mui/material/styles";
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
import {useScreenAnalytics} from "../analytics";
import LocalizedFields, {FieldSchema, fieldSchema} from "../common/LocalizedFields";
import {LocalizeContext} from "../common/Localization";


const schema = object({
    localizedFields: array(fieldSchema).nonempty(),
    img: string().url(),
    revealsAt: date(),
    freezeAt: date(),
    visibility: zodEnum(['public', 'unlisted', 'private']),
    rankingVisibility: zodEnum(['public', 'private']),
    allowViewingSolutions: boolean(),
    author: string().min(3).max(128),
    instructors: array(string().min(25).max(30)),

    // private fields
    invitedEmails: array(string().email()).max(1000),
    mailSubject: string().min(3).max(1000).optional(),
    mailText: string().min(10).max(5000).optional(),
});
type Schema = Infer<typeof schema>;

const getCourseLocalizedFields = (course: Course | null, defaultLocale?: string) => {
    if( !course ) {
        if (defaultLocale)
            return [{locale: defaultLocale, title: '', notionId: ''}]
        return []
    }

    const fields: FieldSchema[] = [];
    if( typeof course.title === 'string' ) {
        if( typeof course.introduction !== 'string' )
            throw Error('Locale-dependent fields course title and introduction are not of the same type (string)');

        fields.push({locale: defaultLocale ?? 'enUS', title: course.title, notionId: course.introduction});
    }
    else if( typeof course.title === 'object' && typeof course.introduction === 'object' ) {
        for( const locale of Object.keys(course.title) )
            fields.push({locale: locale, title: course.title[locale], notionId: course.introduction[locale]});
    }
    else throw Error('Unsupported exercise title/pageId types');

    return fields;
}


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
    const {localize} = useContext(LocalizeContext);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [invitesOpen, setInvitesOpen] = useState(false);
    const [privateFields, setPrivateFields] = useState<CoursePrivateFields | null>(null);
    useScreenAnalytics(`course-editor-${course?.id}`);

    const onInviteUsersClicked = () => setInvitesOpen(open => !open)

    const getDefaultFieldValues = useCallback(() => {
        return {
            localizedFields: getCourseLocalizedFields(course ?? null, 'enUS'),
            img: course?.img,
            revealsAt: course?.revealsAt ? course.revealsAt.toDate() : new Date(),
            freezeAt: course?.freezeAt ? course.freezeAt.toDate() : new Date(),
            visibility: course?.visibility ?? 'private',
            rankingVisibility: course?.rankingVisibility ?? 'private',
            allowViewingSolutions: course?.allowViewingSolutions ?? false,
            author: course?.author,
            instructors: course?.instructors,

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
    const {control, handleSubmit, formState: { errors, isValid }, setValue, reset} = formMethods;
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
        const title = data.localizedFields.reduce((map, field) => {map[field.locale] = field.title; return map;}, {} as {[key: string]: string});
        const introduction = data.localizedFields.reduce((map, field) => {map[field.locale] = field.notionId; return map;}, {} as {[key: string]: string});
        const id = course?.id ?? await genCourseId(localize(title));

        console.log('submit!', id, data)
        await updateCourse(
            auth.currentUserId,
            id, data.img,
            data.revealsAt, data.freezeAt,
            data.visibility, data.rankingVisibility, data.allowViewingSolutions,
            title, introduction,
            data.author, data.instructors,
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
        <Container maxWidth="md" sx={{marginY: 2}}>

        <Stack direction="column" spacing={3}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" alignContent="center">
                <Typography variant="h4" sx={{flex: 1}}>Course Editor</Typography>

                <Controller name="visibility" control={control} render={({ field: { ref, ...field } }) => (
                    <TextField select label="Visibility" variant="outlined" inputRef={ref} {...field} size="small" sx={{minWidth: 150}}>
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="unlisted">Unlisted</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                    </TextField>
                )} />

                <Button size="large" variant="outlined" type="submit" disabled={!isValid}>Save</Button>
                <Button size="large" variant="outlined" onClick={onCancel}>Cancel</Button>
            </Stack>

            <LocalizedFields />

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
            </LocalizationProvider>
            </Stack>

            <Stack direction="row" spacing={2}>
                <Controller name="rankingVisibility" control={control} render={({ field }) => (
                    <FormControlLabel label="Is ranking visible" labelPlacement="start" control={
                        <Switch checked={field.value === 'public'} inputRef={field.ref}
                                onChange={e => field.onChange(e.target.checked ? 'public' : 'private')} />
                    } />
                )} />

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
        </Stack>
        </Container>
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
