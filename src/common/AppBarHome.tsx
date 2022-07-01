import {memo} from "react";
import {Button, SvgIcon, Typography} from "@mui/material";
import {ReactComponent as Logo} from "../assets/logo.svg";
import {Link} from "react-router-dom";


function AppBarHome({onClick}: {onClick?: () => any}) {
    return <>
        <Button onClick={onClick} component={Link} to="/" color="inherit" size="large" sx={{textTransform: 'none', marginRight: 2}}>
            <SvgIcon><Logo/></SvgIcon>
            <Typography fontWeight="bold" sx={{ml: 1}} noWrap>Profound</Typography>
            <Typography fontWeight="bold" sx={{display: {xs: 'none', sm: 'flex'}}} noWrap>&nbsp;Academy</Typography>
        </Button>
    </>
}

export default memo(AppBarHome);
