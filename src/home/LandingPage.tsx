import {memo} from "react";
import {Button, Grid, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import DiscordInvite from "./DiscordInvite";
import {ReactComponent as Product} from "../assets/product.svg";
import {ReactComponent as Moon} from "../assets/moon-stars.svg";
import Feature from "./Feature";
import practice from '../assets/practice.png';

function Header({onCoursesClicked}: {onCoursesClicked: () => void}) {
    return <>
        <Box bgcolor="secondary.main" position="relative" height={1000} maxHeight="calc(100vh - 64px)">
        <Grid container justifyContent="center" padding={8} sx={{display: 'flex'}}>
            <Grid item width="50%" padding={6}>
                <Typography variant="h1" color="white" fontSize={50} fontWeight="bold" marginY={2}>
                    In-depth hands-on interactive courses
                </Typography>
                <Typography variant="h2" color="white" fontSize={18} marginY={2}>
                    Explore tailored courses that guide your programming journey from beginner to the advanced level.
                </Typography>

                <Button onClick={onCoursesClicked} size="large" color="primary" variant="contained" sx={{textTransform: 'none', my: 2}}>Explore Courses</Button>
            </Grid>

            <Grid item width="50%">
                <Product />
            </Grid>
        </Grid>

        <Box marginLeft={10} position="absolute" bottom={-3} width={600}>
            <Moon />
        </Box>
        </Box>
    </>
}


function LandingPage({error, onCoursesClicked, onPricingClicked}: {
    error?: string, onCoursesClicked?: () => void, onPricingClicked?: () => void,
}) {

    return <>
        {!!error && <Typography variant="h6" color="error">{error}</Typography>}
        {onCoursesClicked && <Header onCoursesClicked={onCoursesClicked} />}

        <Feature title="Learn Through Practice"
                 description="Each concept in the courses is explained through many exercises that help you master the topics.
                 Everything is hands-on and interactive, so you make progress by solving various challenges instead of only consuming content."
                 media={practice}
                 mediaPosition="left"/>

        <Feature title="Group Tutoring"
                 description="Sign up for group tutoring sessions to get the benefit of a more regular practice.
                 Meetings take place at the time you pick. You can participate in 2-3 weekly sessions."
                 media={practice} mediaPosition="right"
                 action="Sign up for group tutoring" onButtonClicked={onPricingClicked} />

        <Feature title="Free Tailored Courses"
                 description="Sign up for courses of different levels and start learning for free!
                 Courses contain exercises of different difficulty levels to keep you engaged and motivated."
                 media={practice} mediaPosition="left"
                 action="Explore Courses" onButtonClicked={onCoursesClicked} />

        <DiscordInvite />

        <Feature title="Profound Academy for Individuals"
                 description="With Profound Academy students have the flexibility of learning at their own pace.
                 Each concept is explained with a supplementary exercise, where the platform provides instant feedback for each submission.
                 Every exercise can be submitted with a single click, providing instant feedback on the correctness of a solution."
                 media={practice} mediaPosition="right"
                 action="Explore Courses" onButtonClicked={onCoursesClicked} />

        <Feature title="Profound Academy for Teachers"
                 description="Teachers can create courses within several clicks, while the platform automatically checks for solution correctness.
                 Contests can help with organizing the screening process for a course or to motivate students and increase their engagement.
                 Please contact us so that we can best help you get started."
                 media={practice} mediaPosition="left" />

        <Feature title="Profound Academy for Institutions"
                 description="Institutions can get the courses and competitions created by us to teach their students without creating everything from scratch.
                 All the content is customizable, so the tutors can adjust the courses to their needs.
                 Please contact us so that we can best help you get started."
                 media={practice} mediaPosition="right" />
    </>
}

export default memo(LandingPage);
