import {memo, ReactNode} from "react";
import {Box, Button, Card, CardMedia, Container, Grid, Typography} from "@mui/material";
import {Link} from "react-router-dom";

export function MediaFeature({title, description, media, mediaPosition, action, onButtonClicked, to}: {
    title: ReactNode, description: ReactNode,
    media: ReactNode, mediaPosition: 'left' | 'right',
    action?: string, onButtonClicked?: () => void, to?: string,
}) {
    const buttonPart = <>
        <Button
            onClick={onButtonClicked}
            {...(to && {component: Link, to: to})}
            size="large"
            variant="contained"
            sx={{textTransform: 'none'}}>
            {action}
        </Button>
    </>
    const contentPart = <Box>{title}{description}{action && buttonPart}</Box>
    return <>
        <Container maxWidth="xl" sx={{paddingX: 4}}>
            <Grid container alignItems="center" justifyContent="center" textAlign="center" spacing={2} marginBottom={12}
                  sx={{ display: { xs: 'flex', md: 'none' } }}>
                <Grid item>{title}</Grid>
                <Grid item>{media}</Grid>
                <Grid item>{description}</Grid>
                {action && <Grid item>{buttonPart}</Grid>}
            </Grid>

            <Grid container justifyContent="center" padding={8} spacing={4}
                  sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Grid item width={mediaPosition === 'left' ? '60%' : '40%'}>{mediaPosition === 'left' ? media : contentPart}</Grid>
                <Grid item width={mediaPosition === 'right' ? '60%' : '40%'}>{mediaPosition === 'right' ? media : contentPart}</Grid>
            </Grid>
        </Container>
    </>
}


function Feature({title, description, media, mediaPosition, action, onButtonClicked, to}: {
    title: string, description: string,
    media: string, mediaPosition: 'left' | 'right',
    action?: string, onButtonClicked?: () => void, to?: string,
}) {
    const mediaPart = <>
        <Card raised sx={{borderRadius: 6}}>
            <CardMedia component={media.endsWith('mp4') ? 'video' : 'img'}
                       alt={title} image={media} loading="lazy" autoPlay muted loop
                       height="100%" width="100%" />
        </Card>
    </>
    return <>
        <MediaFeature title={<Typography variant="h2" fontWeight="bold" marginBottom={2}>{title}</Typography>}
                      description={<Typography whiteSpace="pre-wrap" marginBottom={2}>{description}</Typography>}
                      media={mediaPart} mediaPosition={mediaPosition}
                      action={action} onButtonClicked={onButtonClicked} to={to} />
    </>
}

export default memo(Feature);
