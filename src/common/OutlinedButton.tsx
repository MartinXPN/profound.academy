import {styled} from "@mui/material/styles";
import Button from "@mui/material/Button";
import {ButtonProps} from "@mui/material/Button/Button";
import * as React from "react";


const StyledButton = styled(Button)(({theme}) => ({
    margin: theme.spacing(1),
    borderRadius: 50,
    size: 'large',
}));

interface OutlinedButtonProps extends ButtonProps {
    selected: boolean,
    endIcon?: React.ReactNode,
}

function OutlinedButton({children, selected, ...props}: OutlinedButtonProps) {
    return <StyledButton variant={selected ? 'contained' : 'outlined'} {...props}>
        {children}
    </StyledButton>
}

export default OutlinedButton;
