import {memo, useContext, useState} from "react";
import Locale from "../common/Locale";
import {ListItemIcon, ListItemText, Menu, MenuItem} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import {LocalizeContext} from "../common/Localization";


const allLocales = ['enUS', 'hyAM'];
console.log('all locales:', allLocales);


function PreferredLanguage({onShowOptions, onOptionSelected, anchorEl}: {
    onShowOptions: () => void,
    onOptionSelected: (locale: string) => void,
    anchorEl: null | HTMLElement,
}) {
    const {locale, setLocale} = useContext(LocalizeContext);
    const [showOptions, setShowOptions] = useState(false);

    const onShowOptionsClicked = () => {
        onShowOptions();
        setShowOptions(true);
    }
    const onOptionClicked = (locale: string) => {
        setShowOptions(false);
        setLocale(locale);
        onOptionSelected(locale);
    }

    return <>
        {showOptions
        ? <Menu
            open={showOptions}
            anchorEl={anchorEl}
            onClose={() => onOptionClicked(locale)}
            PaperProps={{
                elevation: 0,
                sx: {
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.24))',
                    minWidth: '10em',
                },
            }}>
            {allLocales.map(l =>
                <MenuItem key={`language-choice-${l}`} onClick={() => onOptionClicked(l)}>
                    <ListItemText><Locale locale={l} /></ListItemText>
                </MenuItem>
            )}
        </Menu>
        : <MenuItem key="preferred-language" onClick={onShowOptionsClicked}>
            <ListItemText><Locale locale={locale} /></ListItemText>
            <ListItemIcon><ArrowRightIcon /></ListItemIcon>
        </MenuItem>}
    </>
}

export default memo(PreferredLanguage);
