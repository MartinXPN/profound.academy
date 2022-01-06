import {styled} from "@mui/material/styles";
import {Avatar} from "@mui/material";

const SmallAvatar = styled(Avatar)(({ theme }) => ({
    width: 32,
    height: 32,
    border: `2px solid ${theme.palette.background.paper}`,
    marginRight: theme.spacing(1),
}));

export default SmallAvatar;
