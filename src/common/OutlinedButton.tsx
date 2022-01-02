import {styled} from "@mui/material/styles";
import Button from "@mui/material/Button";
import {ButtonProps} from "@mui/material/Button/Button";


const StyledButton = styled(Button)(({theme}) => ({
    margin: theme.spacing(1),
    borderRadius: 50,
    size: 'large',
}));

interface OutlinedButtonProps extends ButtonProps {
    selected: boolean,
}

function OutlinedButton(props: OutlinedButtonProps) {
    return <StyledButton variant={props.selected ? 'contained' : 'outlined'}
                         onClick={props.onClick}>
        {props.children}
    </StyledButton>
}

export default OutlinedButton;
