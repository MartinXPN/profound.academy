import {memo, ReactNode} from "react";
import {Box, Button, Card, CardMedia, Container, Grid, Typography} from "@mui/material";

export function MediaFeature({title, description, media, mediaPosition, action, onButtonClicked}: {
    title: ReactNode, description: ReactNode,
    media: ReactNode, mediaPosition: 'left' | 'right',
    action?: string, onButtonClicked?: () => void,
}) {
    const buttonPart = <Button onClick={onButtonClicked} size="large" variant="contained" sx={{textTransform: 'none'}}>{action}</Button>;
    const contentPart = <Box marginX={4}>{title}{description}{action && buttonPart}</Box>
    return <>
        <Container maxWidth="xl">
            <Grid container alignItems="center" justifyContent="center" textAlign="center" spacing={2} marginBottom={12}
                  sx={{ display: { xs: 'flex', md: 'none' } }}>
                <Grid item>{title}</Grid>
                <Grid item>{media}</Grid>
                <Grid item>{description}</Grid>
                {action && <Grid item>{buttonPart}</Grid>}
            </Grid>

            <Grid container justifyContent="center" padding={8} sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Grid item width="50%">{mediaPosition === 'left' ? media : contentPart}</Grid>
                <Grid item width="50%">{mediaPosition === 'right' ? media : contentPart}</Grid>
            </Grid>
        </Container>
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
    return <>
        <MediaFeature title={<Typography variant="h2" fontWeight="bold" marginBottom={2}>{title}</Typography>}
                      description={<Typography variant="body1" marginBottom={2}>{description}</Typography>}
                      media={mediaPart} mediaPosition={mediaPosition}
                      action={action} onButtonClicked={onButtonClicked} />
    </>
}

export default memo(Feature);
