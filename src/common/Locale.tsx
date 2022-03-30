import React, {memo} from "react";
import Box from "@mui/material/Box";

function Locale({locale, ...props}: {locale: string} & any) {
    return <>
        <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
            <img loading="lazy" width={20} alt=""
                 src={`https://flagcdn.com/w20/${locale.substring(2, 4).toLowerCase()}.png`}
                 srcSet={`https://flagcdn.com/w40/${locale.substring(2, 4).toLowerCase()}.png 2x`}/>
            {locale.substring(0, 2)}-{locale.substring(2, 4)}
        </Box>
    </>
}

export default memo(Locale);
