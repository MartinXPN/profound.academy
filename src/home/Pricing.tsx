import {memo, ReactNode, useContext, useEffect, useState} from "react";
import {Button, Card, CardActions, CardContent, Stack, Grid, Typography, Box, TextField} from "@mui/material";
import {Check} from "@mui/icons-material";
import {SignIn} from "../user/Auth";
import {AuthContext} from "../App";
import {useStickyState} from "../common/stickystate";
import {preRegister} from "../services/users";

function Benefit({name}: {name: string}) {
    return <>
        <Stack direction="row" alignItems="center" gap={1}>
            <Check color="primary" /> <Typography variant="body1">{name}</Typography>
        </Stack>
    </>
}

function Plan({name, price, children, isSubscribed, onStartClicked}: {
    name: string, price: string, children: ReactNode, isSubscribed: boolean, onStartClicked: () => void,
}) {
    return <>
        <Card sx={{ width: 240, borderRadius: 8, padding: 4 }}>
            <CardContent>
                <Typography variant="h4" textAlign="center">{name}</Typography>
                <Typography variant="h6" textAlign="center">{price}</Typography>
                <Box marginBottom={2} />
                {children}
            </CardContent>

            <CardActions>
                <Grid container justifyContent="center">
                    {isSubscribed
                        ? <Button variant="outlined" disabled>Current plan</Button>
                        : <Button color="primary" variant="contained" onClick={onStartClicked}>Get started</Button>}
                </Grid>
            </CardActions>
        </Card>
    </>
}

function Pricing() {
    const auth = useContext(AuthContext);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showProInstructions, setShowProInstructions] = useState(false);
    const [email, setEmail] = useStickyState<string | null>(null, `pro-email-${auth.currentUserId}`);
    const [preRegisteredEmail, setPreRegisteredEmail] = useStickyState<string | null>(null, `pro-pre-registered-${auth.currentUserId}`);

    // Default user email
    useEffect(() => {
        if( !auth.isSignedIn )
            setShowProInstructions(false);

        if( email === null && auth.currentUser !== null )
            setEmail(auth.currentUser.email);
    }, [auth, email, setEmail]);

    const handleStartFreePlan = () => {
        setShowSignIn(true);
        setTimeout(() => window.scrollTo({ behavior: 'smooth', top: window.scrollY + 200 }), 100);
    }
    const handleStartProPlan = () => {
        if( auth.isSignedIn )   setShowProInstructions(true);
        else                    setShowSignIn(true);
        setTimeout(() => window.scrollTo({ behavior: 'smooth', top: window.scrollY + 200 }), 100);
    }
    const handlePreRegisterPro = async () => {
        if( !auth.currentUserId )
            return;
        setPreRegisteredEmail(email);
        await preRegister(auth.currentUserId, email);
    }

    return <>
        <Typography variant="h2" textAlign="center" marginTop={10}>
            Picking the best plan for you
        </Typography>

        <Grid container justifyContent="center" alignContent="center" alignItems="top"
            spacing={4} paddingTop={2} marginBottom={2}>
            {/*Free*/}
            <Grid item>
            <Plan name="Free" price="$0/month" isSubscribed={auth.isSignedIn} onStartClicked={handleStartFreePlan}>
                <Benefit name="Participate in courses" />
                <Benefit name="Access side quests" />
                <Benefit name="Community of learners" />
            </Plan>
            </Grid>

            {/*Pro*/}
            <Grid item>
            <Plan name="Pro" price="$299/month" isSubscribed={false} onStartClicked={handleStartProPlan}>
                <Benefit name="Group tutoring" />
                <Benefit name="Certificates" />
                <Benefit name="Weekly meetings" />
                <Benefit name="Personal guidance" />
            </Plan>
            </Grid>
        </Grid>

        {!auth.isSignedIn && showSignIn && <SignIn />}
        {showProInstructions && <>
            <Grid container direction="column" justifyContent="center" alignContent="center" padding={4}>
                <Grid item><Typography variant="h4" marginBottom={1}>Pre-register for the Pro plan to get:</Typography></Grid>
                <Grid item><Typography>• Group tutoring sessions 3 times a week (each 1.5-2 hours).</Typography></Grid>
                <Grid item><Typography>• Almost individual support (group sizes don't exceed 10 people).</Typography></Grid>
                <Grid item><Typography>• First session is completely free.</Typography></Grid>
                <Grid item><Typography>• Pre-registered users will get a 30% discount for the first month.</Typography></Grid>
                <Grid item><Typography>• Group tutoring sessions start this August.</Typography></Grid>
                <Grid item>
                    <Grid container direction="row" justifyContent="center" alignContent="center" alignItems="center" spacing={2} marginY={2}>
                        <Grid item flex={1} minWidth={300}>
                            <TextField fullWidth type="email"
                                       placeholder="john.smith@gmail.com" label="Sign up with your preferred email"
                                       onChange={event => setEmail(event.target.value)} value={email}/>
                        </Grid>
                        <Grid item>
                            {preRegisteredEmail === email
                                ? <Stack direction="row" alignItems="center" gap={1}>
                                    <Check color="primary" /> <Typography variant="body1">Pre-Registered</Typography>
                                </Stack>
                                : <Button variant="contained" onClick={handlePreRegisterPro}>Pre-Register</Button>}
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </>}
        <Box marginBottom={12} />
    </>
}

export default memo(Pricing);
