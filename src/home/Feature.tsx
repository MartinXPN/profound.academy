import {memo} from "react";
import {Box, Card, CardMedia, Grid, Typography} from "@mui/material";

function Feature({title, description, media, mediaPosition}: {
    title: string, description: string, media: string, mediaPosition: 'left' | 'right',
}) {
    const mediaPart = <>
        <Card raised sx={{borderRadius: 8}}>
            <CardMedia component="img" alt={title} image={media} height="100%" width="100%" />
        </Card>
    </>
    const contentPart = <>
        <Box marginX={4}>
            <Typography variant="h1" fontSize={32} fontWeight="bold" marginBottom={2}>{title}</Typography>
            <Typography variant="body1">{description}</Typography>
        </Box>
    </>
    return <>
        <Grid container justifyContent="center" padding={8}>
            <Grid item width="50%">
                {mediaPosition === 'left' ? mediaPart : contentPart}
            </Grid>

            <Grid item width="50%">
                {mediaPosition === 'right' ? mediaPart : contentPart}
            </Grid>
        </Grid>
    </>
}

export default memo(Feature);
