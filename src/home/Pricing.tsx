import {memo, ReactNode, useContext, useState} from "react";
import {Button, Card, CardActions, CardContent, Stack, Grid, Typography, Box} from "@mui/material";
import {Check} from "@mui/icons-material";
import {SignIn} from "../user/Auth";
import {AuthContext} from "../App";
import useAsyncEffect from "use-async-effect";
import {subscribe} from "../services/subscriptions";
import CircularProgress from "@mui/material/CircularProgress";

function Benefit({name}: {name: string}) {
    return <>
        <Stack direction="row" alignItems="center" gap={1}>
            <Check color="primary" /> <Typography variant="body1">{name}</Typography>
        </Stack>
    </>
}

function Plan({name, price, buttonText, children, isSubscribed, onStartClicked, purchaseInProgress}: {
    name: string, price: string, buttonText: string, children: ReactNode,
    isSubscribed: boolean, onStartClicked: () => void, purchaseInProgress?: boolean
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
                        : purchaseInProgress
                            ? <CircularProgress color="inherit"  />
                            : <Button color="primary" variant="contained" onClick={onStartClicked}>{buttonText}</Button>
                    }
                </Grid>
            </CardActions>
        </Card>
    </>
}

function Pricing() {
    const auth = useContext(AuthContext);
    const [showSignIn, setShowSignIn] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [startingPayment, setStartingPayment] = useState(false);

    useAsyncEffect(async () => {
        if( !auth.isSignedIn )
            return setUserRole(null);

        await auth.currentUser?.getIdToken(true);
        const token = await auth.currentUser?.getIdTokenResult();
        setUserRole(token?.claims?.stripeRole ?? null);
    }, [auth]);

    const handleStartFreePlan = () => {
        setShowSignIn(true);
        setTimeout(() => window.scrollTo({ behavior: 'smooth', top: window.scrollY + 200 }), 100);
    }
    const handleStartStudentPlan = async () => {
        if( !auth.isSignedIn || !auth.currentUserId )
            return setShowSignIn(true);

        setStartingPayment(true);
        await subscribe(
            auth.currentUserId, 'price_1LLihSCi2K53POQ28mnKKo6n', window.location.origin,
            (redirectUrl) => {
                window.location.assign(redirectUrl);
                setStartingPayment(false);
            },
            (error) => {
                console.warn('Stripe error', error);
                setStartingPayment(false);
            }
        );
    }

    return <>
        <Typography variant="h2" textAlign="center" marginTop={10}>
            Picking the best plan for you
        </Typography>

        <Grid container justifyContent="center" alignContent="center" alignItems="top"
            spacing={4} paddingTop={2} marginBottom={2}>
            {/* Free plan */}
            <Grid item>
            <Plan name="Free" price="$0/month" buttonText="Get Started"
                  isSubscribed={auth.isSignedIn && userRole !== 'student'}
                  onStartClicked={handleStartFreePlan}>
                <Benefit name="Participate in courses" />
                <Benefit name="Access side quests" />
                <Benefit name="Community of learners" />
                <Benefit name="Learn at your own pace" />
            </Plan>
            </Grid>

            {/* Student plan */}
            <Grid item>
            <Plan name="Student" price="$199/month" buttonText="Start Free trial"
                  isSubscribed={userRole === 'student'}
                  onStartClicked={handleStartStudentPlan}
                  purchaseInProgress={startingPayment}>
                <Benefit name="Group tutoring" />
                <Benefit name="Certificates" />
                <Benefit name="Weekly meetings" />
                <Benefit name="Personal guidance" />
            </Plan>
            </Grid>
        </Grid>

        {!auth.isSignedIn && showSignIn && <SignIn />}
        <Box marginBottom={12} />
    </>
}

export default memo(Pricing);
