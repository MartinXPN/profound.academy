import {createTheme} from "@mui/material/styles";

const theme = createTheme({
    palette: {
        background: {
            default: '#ffffff',
            paper: '#ffffff',
        },
        primary: {
            main: '#4B5FAA',
        },
        secondary: {
            main: '#37a4dc'
        },
        info: {
            main: '#f44336'
        }
    }
});

export default theme;
