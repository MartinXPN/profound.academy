import useAsyncEffect from "use-async-effect";
import {getUserInfo} from "../services/users";
import React, {useState} from "react";
import {User} from "../models/users";
import {Avatar, Stack, Typography} from "@mui/material";
import {styled} from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";


const UserInfoRoot = styled('div')(({theme}) => ({
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
    margin: '4em',
}));

const UserInfoContents = styled('div')({
    width: 600,
    minHeight: 150,
    flex: 'left',
    display: 'flex',
    flexDirection: 'row',
    gap: '3em',
});



function UserInfo({userId}: {userId: string}) {
    const [user, setUser] = useState<User | null>(null);
    useAsyncEffect(async () => {
        const user = await getUserInfo(userId);
        setUser(user);
    }, [userId]);

    return <>
        <UserInfoRoot>
            <UserInfoContents>
                {user ? <>
                    <Avatar src={user.imageUrl} sx={{width: 150, height: 150, border: '2px solid lightgray'}}/>
                    <Stack spacing={2}>
                        <Typography variant="h5" sx={{fontWeight: 600}}>{user.displayName ?? 'Name'}</Typography>
                        <Typography>Trophies and badges coming soon...</Typography>
                    </Stack>
                </> : <>
                    <Box sx={{width: 150, height: 150, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <CircularProgress/>
                    </Box>
                </>}
            </UserInfoContents>
        </UserInfoRoot>
    </>
}

export default UserInfo;
