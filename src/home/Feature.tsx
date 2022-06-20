import {memo, ReactNode} from "react";
import {Box, Button, Card, CardMedia, Grid, Typography} from "@mui/material";

export function MediaFeature({content, media, mediaPosition, action, onButtonClicked}: {
    content: ReactNode,
    media: ReactNode, mediaPosition: 'left' | 'right',
    action?: string, onButtonClicked?: () => void,
}) {
    const contentPart = <>
        <Box marginX={4}>
            {content}
            {action && <Button onClick={onButtonClicked} size="large" variant="contained" sx={{textTransform: 'none'}}>{action}</Button>}
        </Box>
    </>
    return <>
        <Grid container justifyContent="center" padding={8}>
            <Grid item width="50%">
                {mediaPosition === 'left' ? media : contentPart}
            </Grid>

            <Grid item width="50%">
                {mediaPosition === 'right' ? media : contentPart}
            </Grid>
        </Grid>
    </>
}


function Feature({title, description, media, mediaPosition, action, onButtonClicked}: {
    title: string, description: string,
    media: string, mediaPosition: 'left' | 'right',
    action?: string, onButtonClicked?: () => void,
}) {
    const mediaPart = <>
        <Card raised sx={{borderRadius: 8}}>
            <CardMedia component="img" alt={title} image={media} loading="lazy" height="100%" width="100%" />
        </Card>
    </>
    const contentPart = <>
        <Typography variant="h2" fontWeight="bold" marginBottom={2}>{title}</Typography>
        <Typography variant="body1" marginBottom={2}>{description}</Typography>
    </>
    return <>
        <MediaFeature content={contentPart} media={mediaPart} mediaPosition={mediaPosition}
                      action={action} onButtonClicked={onButtonClicked} />
    </>
}

export default memo(Feature);
