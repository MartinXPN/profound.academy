import React, {memo, useCallback, useContext, useState} from "react";
import {Course} from "../models/courses";
import {AuthContext} from "../App";
import {Button, FormControlLabel, Stack, TextField, Typography, Switch} from "@mui/material";
import Box from "@mui/material/Box";
import {FileUploader} from "react-drag-drop-files";
import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import {styled} from "@mui/material/styles";
import Content from "./Content";
import {useHistory, useRouteMatch} from "react-router-dom";


const validateText = (value: string, minLength: number = 3, maxLength: number = 128) => {
    if( !value )                        return 'Id is required';
    if( value.length < minLength )      return `The length should be at least ${minLength}`;
    if( value.length > maxLength )      return `The length should be at most ${maxLength}`;
    return undefined;
};
const validateId = (value: string) => {
    const textValidation = validateText(value, 5, 30);
    if( textValidation )
        return textValidation;

    const validCharacters = new RegExp(/^[a-z0-9-]*$/);
    if( !validCharacters.test(value) )
        return 'Should only contain lowercase latin letters, numbers, and hyphens (-)';

    return undefined;
};

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
    const match = useRouteMatch();
    const auth = useContext(AuthContext);
    const [id, setId] = useState<{value?: string, error?: string}>({value: course?.id, error: undefined});
    const [isPublic, setIsPublic] = useState(course?.visibility === 'public');
    const [title, setTitle] = useState<{value?: string, error?: string}>({value: course?.title, error: undefined});
    const [details, setDetails] = useState<{value?: string, error?: string}>({value: course?.details, error: undefined});
    const [imageUrl, setImageUrl] = useState<string | undefined>(course?.img);
    const [authors, setAuthors] = useState<{value?: string, error?: string}>({value: course?.author, error: undefined});
    const [instructors, setInstructors] = useState<{value?: string[], error?: string}>({value: course?.instructors, error: undefined});
    const [revealDate, setRevealDate] = useState<Date | null>(course && course.revealsAt ? course.revealsAt.toDate() : new Date());
    const [freezeDate, setFreezeDate] = useState<Date | null>(course && course.freezeAt ? course.freezeAt.toDate() : new Date());
    const [allowViewingSolutions, setAllowViewingSolutions] = useState(course?.allowViewingSolutions);
    const [introId, setIntroId] = useState<{value?: string, error?: string}>({value: course?.introduction, error: undefined});


    const onIdChanged = (value: string) => setId({value: value, error: validateId(value)});
    const onTitleChanged = (value: string) => setTitle({value: value, error: validateText(value)});
    const onDetailsChanged = (value: string) => setDetails({value: value, error: validateText(value)});
    const onAuthorsChanged = (value: string) => setAuthors({value: value, error: validateText(value)});
    const onIntroIdChanged = (value: string) => setIntroId({value: value, error: validateText(value, 20, 35)});
    const handleImageChange = useCallback(async (file: File) => {
        console.log('uploading');
    }, []);

    const onSubmit = (data: any) => console.log(data);
    const onCancel = () => {
        console.log('cancel');
        const url = match.url.replace('/edit', '');
        history.push(url);
    }

    if( !auth.currentUserId )
        return <>
            <Typography>You need to sign in to edit a course</Typography>
            <Button onClick={onCancel} size="large" variant="outlined">Back</Button>
        </>
    if( course && !course.instructors.includes(auth.currentUserId))
        return <>
            <Typography>You are not in the instructor list of the course</Typography>
            <Button onClick={onCancel} size="large" variant="outlined">Back</Button>
        </>

    return <>
        <Box maxWidth="48em" marginLeft="auto" marginRight="auto" marginTop="2em" marginBottom="2em">
        <Stack direction="column" spacing={3}>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" alignContent="center">
                <Typography variant="h4" sx={{flex: 1}}>Course Editor</Typography>
                <Button onClick={onSubmit} size="large" variant="outlined">Save</Button>
                <Button onClick={onCancel} size="large" variant="outlined">Cancel</Button>
            </Stack>

            <Stack direction="row" justifyContent="center" alignItems="center" alignContent="center">
                <TextField required label="ID" variant="outlined" placeholder="ID of the course"
                           value={id.value} onChange={(e) => onIdChanged(e.target.value)}
                           error={!!id.error} helperText={id.error ?? null}
                           sx={{flex: 1}}
                           inputProps={{ 'aria-label': 'controlled' }} />

                <FormControlLabel
                    control={
                        <Switch checked={isPublic}
                                onChange={(event) => setIsPublic(event.target.checked)}
                                inputProps={{ 'aria-label': 'controlled' }} />
                    }
                    label="Public"
                    labelPlacement="start" />
            </Stack>

            <Stack direction="row" spacing={2}>
                <TextField required label="Title" variant="outlined" placeholder="Course Title"
                           sx={{flex: 1}}
                           value={title.value} onChange={(e) => onTitleChanged(e.target.value)}
                           error={!!title.error} helperText={title.error ?? null}
                           inputProps={{ 'aria-label': 'controlled' }} />

                <TextField required multiline label="Description" variant="outlined" placeholder="Details"
                           sx={{flex: 1}}
                           value={details.value} onChange={(e) => onDetailsChanged(e.target.value)}
                           error={!!details.error} helperText={details.error ?? null}
                           inputProps={{ 'aria-label': 'controlled' }} />
            </Stack>

            <Box width={300} height={180}>
                <FileUploader
                    handleChange={handleImageChange}
                    minSize={0.01}
                    maxSize={1}
                    name="file"
                    types={fileTypes}>

                    <div style={{display: 'grid'}}>
                        <img width={300} height={180} src={imageUrl} loading="lazy" style={{ objectFit: 'cover', gridColumn: 1, gridRow: 1}} />
                        <UploadBackground boxShadow={3}>
                            <Typography color="common.white" align="center">Drag & Drop here</Typography>
                            <Typography color="common.white" align="center">Or click to select</Typography>
                        </UploadBackground>
                    </div>
                </FileUploader>
            </Box>

            <Stack direction="row" spacing={2}>
                <TextField required label="Authors" variant="outlined" placeholder="Displayed name of the creator"
                           sx={{flex: 1}}
                           value={authors.value} onChange={(e) => onAuthorsChanged(e.target.value)}
                           error={!!authors.error} helperText={authors.error ?? null}
                           inputProps={{ 'aria-label': 'controlled' }} />

                {/* TODO: autocomplete with the users in the DB - write name, replace with a list of users*/}
                <TextField required label="Instructors" variant="outlined" placeholder="List of instructor-users"
                           sx={{flex: 1}}
                           // value={details.value} onChange={(e) => onDetailsChanged(e.target.value)}
                           // error={!!details.error} helperText={details.error ?? null}
                           inputProps={{ 'aria-label': 'controlled' }} />
            </Stack>

            <Stack direction="row" spacing={2}>
            <LocalizationProvider dateAdapter={AdapterMoment}>
                <DateTimePicker renderInput={params => <TextField {...params} />}
                                label="Course reveals for students at"
                                value={revealDate} onChange={setRevealDate}/>
                <DateTimePicker renderInput={params => <TextField {...params} />}
                                label="Rankings freeze at"
                                value={freezeDate} onChange={setFreezeDate}/>

                <Typography sx={{flex: 1}}/>
                <FormControlLabel
                    control={
                        <Switch checked={allowViewingSolutions}
                                onChange={(event) => setAllowViewingSolutions(event.target.checked)}
                                inputProps={{ 'aria-label': 'controlled' }} />
                    }
                    label="Allow viewing solutions"
                    labelPlacement="start" />
            </LocalizationProvider>
            </Stack>

            <TextField required label="Introduction Notion ID" variant="outlined" placeholder="Notion page ID"
                       value={introId.value} onChange={(e) => onIntroIdChanged(e.target.value)}
                       error={!!introId.error} helperText={introId.error ?? null}
                       inputProps={{ 'aria-label': 'controlled' }} />
            <br/><br/><br/>
            {introId.value && <Content notionPage={introId.value} />}

        </Stack>
        </Box>
    </>;
}

export default memo(CourseEditor);
