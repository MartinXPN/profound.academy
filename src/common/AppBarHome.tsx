import {memo, ElementType} from "react";
import {Button, SvgIcon, Typography} from "@mui/material";
import {ReactComponent as Logo} from "../assets/logo.svg";
import {To} from "history";
import {ButtonProps} from "@mui/material/Button/Button";

interface Props extends ButtonProps {
    component?: ElementType,
    to?: To,
}

function AppBarHome(props: Props) {
    return <>
        <Button {...props} color="inherit" size="large" sx={{textTransform: 'none'}}>
            <SvgIcon><Logo/></SvgIcon>
            <Typography fontWeight="bold" sx={{ml: 1}} noWrap>Profound Academy</Typography>
        </Button>
    </>
}

export default memo(AppBarHome);
