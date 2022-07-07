import {memo, lazy, Suspense} from "react";
import {Container, Typography, useMediaQuery} from "@mui/material";
import Box from "@mui/material/Box";
import DiscordInvite from "./DiscordInvite";
import Feature, {MediaFeature} from "./Feature";
import {useTheme} from "@mui/material/styles";
const Product = lazy(() => import('../assets/Product'));
const Moon = lazy(() => import('../assets/Moon'));


function Header({onCoursesClicked}: {onCoursesClicked: () => void}) {
    const theme = useTheme();
    const largeScreen = useMediaQuery(theme.breakpoints.up('md'));

    return <>
        <Box bgcolor="secondary.main" position="relative" height={1000} maxHeight="calc(100vh - 64px)" minHeight={800} marginBottom={4}>
            <MediaFeature
                title={
                    <Typography variant="h1" color="white" fontWeight="bold" marginY={2}>
                        In-depth interactive courses
                    </Typography>
                }
                description={
                    <Typography variant="h3" color="white" fontSize={18} marginTop={2} marginBottom={4}>
                        Explore tailored programming courses that guide your learning journey from beginner to the advanced level.
                    </Typography>
                }
                media={<Suspense fallback={<></>}><Product width={largeScreen ? '100%' : 300} height={largeScreen ? '100%' : 300} /></Suspense>}
                mediaPosition="right"
                action="Explore Courses" onButtonClicked={onCoursesClicked} />

            <Container maxWidth="xl">
                <Box marginLeft={10} position="absolute" bottom={0} width={600} sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Suspense fallback={<></>}><Moon /></Suspense>
                </Box>
            </Container>
        </Box>
    </>
}


function LandingPage({onCoursesClicked, onPricingClicked}: {
    onCoursesClicked: () => void, onPricingClicked: () => void,
}) {

    return <>
        <Header onCoursesClicked={onCoursesClicked} />

        <Feature title="Learn Through Practice"
                 description={"Each concept in the courses is explained through many hands-on exercises that help you master the topic. The curriculum is fully hands-on and interactive, so you make progress by solving various challenges instead of only consuming content. \
                 \n\n• Realtime feedback for each task.\n• No installation - write code right in the browser."}
                 media="/demo/practice.mp4" mediaPosition="left"/>

        <Feature title="Free Tailored Courses"
                 description="Sign up for courses of different levels and start learning for free!
                 Study Python, Javascript, and many others by taking a free course.
                 Courses contain exercises of different difficulty levels to keep you engaged and motivated."
                 media="/demo/courses.mp4" mediaPosition="right"
                 action="Explore Courses" onButtonClicked={onCoursesClicked} to="#courses" />

        <Feature title="Group Tutoring"
                 description="Sign up for group tutoring sessions to get the benefit of a more regular practice.
                 Learn programming consistently through weekly meetings and personalized guidance.
                 Meetings take place at the time you pick, while you have the flexibility to participate in 2-3 weekly sessions."
                 media="/demo/group-tutoring.mp4" mediaPosition="left"
                 action="Sign up for group tutoring" onButtonClicked={onPricingClicked} to="/group-tutoring" />

        <DiscordInvite />

        <Feature title="Profound Academy for Individuals"
                 description="With Profound Academy, students have the flexibility of learning at their own pace.
                 Each concept is explained with a supplementary exercise, where the platform provides instant feedback for each submission.
                 Every exercise can be submitted with a single click, providing instant feedback on the correctness of a solution."
                 media="/demo/individual.jpg" mediaPosition="right"
                 action="Explore Courses" onButtonClicked={onCoursesClicked} />

        <Feature title="Profound Academy for Teachers"
                 description="Teachers can create courses within several clicks, while the platform automatically checks for solution correctness.
                 Contests can help with organizing the screening process for a course or to motivate students and increase their engagement.
                 Please contact us so that we can best help you get started."
                 media="/demo/teacher.jpg" mediaPosition="left" />

        <Feature title="Profound Academy for Institutions"
                 description="Institutions can get the courses and competitions created by us to teach their students without creating every course from scratch.
                 All the content is customizable, so the tutors can adjust the courses to their needs.
                 Please contact us so that we can best help you get started."
                 media="/demo/institution.jpg" mediaPosition="right" />
    </>
}

export default memo(LandingPage);
