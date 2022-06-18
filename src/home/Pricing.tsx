import {memo, ReactNode} from "react";
import {Button, Card, CardActions, CardContent, Stack, Grid, Typography, Box} from "@mui/material";
import {Check} from "@mui/icons-material";

function Benefit({name}: {name: string}) {
    return <>
        <Stack direction="row" alignItems="center" gap={1}>
            <Check /> <Typography variant="body1">{name}</Typography>
        </Stack>
    </>
}

function Plan({name, price, children}: {name: string, price: string, children: ReactNode}) {
    return <>
        <Card sx={{ width: 240, borderRadius: 8, padding: 4 }}>
            <CardContent>
                <Typography variant="h5" textAlign="center">{name}</Typography>
                <Typography variant="h6" textAlign="center">{price}</Typography>
                <Box marginBottom={2} />

                {children}
            </CardContent>
            <CardActions>
                <Grid container justifyContent="center">
                    <Button size="small" color="primary" variant="contained">Get started</Button>
                </Grid>
            </CardActions>
        </Card>
    </>
}

function Pricing() {
    return <>
        <Typography variant="h1" fontSize={32} textAlign="center" marginTop={10}>
            Picking the best plan for you
        </Typography>

        <Grid container justifyContent="center" alignContent="center" alignItems="center"
            spacing={4} paddingY={4} marginBottom={10}>
            {/*Free*/}
            <Grid item>
            <Plan name="Free" price="$0/month">
                <Benefit name="Participate in courses" />
                <Benefit name="Access side quests" />
                <Benefit name="Community of learners" />
            </Plan>
            </Grid>

            {/*Pro*/}
            <Grid item>
            <Plan name="Pro" price="$299/month">
                <Benefit name="Group tutoring" />
                <Benefit name="Certificates" />
                <Benefit name="Weekly meetings" />
                <Benefit name="Personal guidance" />
            </Plan>
            </Grid>
        </Grid>
    </>
}

export default memo(Pricing);
