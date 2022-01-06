import {styled} from "@mui/material/styles";
import TableCell from "@mui/material/TableCell";

const ClickableTableCell = styled(TableCell)({
    "&:focus,&:hover": {cursor: 'pointer'}
});

export default ClickableTableCell;
