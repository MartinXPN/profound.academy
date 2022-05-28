import React, {useCallback, useContext, useEffect, useState} from "react";
import {Avatar, Badge, Button, darken, IconButton, Paper, Stack, TextField, Typography} from "@mui/material";
import {styled} from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import {Edit} from "@mui/icons-material";
import {AuthContext} from "../App";
import {FileUploader} from "react-drag-drop-files";
import {User} from "models/users";
import {onUserInfoChanged, updateUserInfo, uploadProfilePicture} from "../services/users";
import {Helmet} from "react-helmet-async";


const UserInfoRoot = styled('div')(({theme}) => ({
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    marginTop: '4em',
}));

const UserInfoContents = styled('div')({
    width: 600,
    minHeight: 150,
    flex: 'left',
    display: 'flex',
    flexDirection: 'row',
    gap: '3em',
});

const EditImageButton = styled(IconButton)(({theme}) => ({
    background: theme.palette.background.default,
    '&:hover': {
        background: darken(theme.palette.background.default, 0.2),
    },
    filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.2))',
}));

const UploadBackground = styled(Paper)(() => ({
    width: 150,
    height: 150,
    border: '2px solid lightgray',
    gridColumn: 1,
    gridRow: 1,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '50%',
    background: 'rgba(50,50,50,0.50)',
}));

const fileTypes = ['jpeg', 'jpg', 'png', 'webp'];

function UserImage({user}: {user: User}) {
    const auth = useContext(AuthContext);
    const [state, setState] = useState<'open' | 'editing' | 'uploading'>('open');
    const onEditClicked = () => setState('editing');
    const onCancelClicked = () => setState('open');
    const handleChange = useCallback(async (file: File) => {
        setState('uploading');
        await uploadProfilePicture(user.id, file);
        setState('open');
    }, [user.id]);

    return <Stack direction="column">
        <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            invisible={auth.currentUserId !== user.id}
            badgeContent={<>{state === 'open' &&
                <EditImageButton color="inherit" onClick={onEditClicked}>
                    <Edit />
                </EditImageButton>}
            </>
            }>

            {state === 'open' && <Avatar
                src={user.imageUrl}
                sx={{width: 150, height: 150, border: '2px solid lightgray'}} />}

            {state !== 'open' && <FileUploader
                handleChange={handleChange}
                minSize={0.01}
                maxSize={1}
                name="file"
                types={fileTypes}>

                <div style={{display: 'grid'}}>
                    <Avatar
                        src={user.imageUrl}
                        sx={{width: 150, height: 150, border: '2px solid lightgray', gridColumn: 1, gridRow: 1}} />
                    <UploadBackground>
                        {state === 'editing'
                        ? <>
                            <Typography color="common.white" align="center">Drag & Drop here</Typography>
                            <Typography color="common.white" align="center">Or click to select</Typography>
                        </>
                        : <>
                            <CircularProgress />
                        </>}
                    </UploadBackground>
                </div>
            </FileUploader>}
        </Badge>
        {state === 'editing' && <Button color="inherit" variant="text" onClick={onCancelClicked}>Cancel</Button>}
    </Stack>
}

function UserName({user}: {user: User}) {
    const auth = useContext(AuthContext);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user.displayName);
    useEffect(() => setName(user.displayName), [user.displayName]);

    const onEditClicked = () => setEditing(true);
    const onCancelClicked = () => setEditing(false);
    const onSaveClicked = async () => {
        await updateUserInfo(user.id, name);
        setEditing(false);
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.target.value);
    };


    return <Stack direction="row" sx={{paddingTop: '10px'}}>
        {!editing && <Typography variant="h5" sx={{fontWeight: 600}}>{user.displayName}</Typography>}
        {editing && <TextField required variant="outlined" label="First & Last name" size="medium" value={name} onChange={handleChange} sx={{fontWeight: 600}} />}
        {auth.currentUserId === user.id && <>
            {!editing && <IconButton color="inherit" onClick={onEditClicked}><Edit /></IconButton>}
            {editing && <>
                <Button variant="outlined" onClick={onSaveClicked}>Save</Button>
                <Button variant="outlined" onClick={onCancelClicked}>Cancel</Button>
            </>}
        </>}
    </Stack>
}


function UserInfo({userId}: {userId: string}) {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => onUserInfoChanged(userId, user => setUser(user)), [userId]);

    return <>
        <Helmet>
            <title>{user?.displayName ?? 'Profound Academy'}</title>
            <meta property="og:title" content={user?.displayName} />
            <meta property="og:image" content={user?.imageUrl} />
            <meta property="og:image:alt" content={user?.displayName} />
        </Helmet>

        <UserInfoRoot>
            <UserInfoContents>
                {user ? <>
                    <UserImage user={user} />
                    <Stack spacing={2} sx={{flex: 1}}>
                        <UserName user={user} />
                        <Typography>Trophies and badges coming soon...</Typography>
                    </Stack>
                </> :
                <Box sx={{width: 150, height: 150, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    <CircularProgress/>
                </Box>
                }
            </UserInfoContents>
        </UserInfoRoot>
    </>
}

export default UserInfo;
