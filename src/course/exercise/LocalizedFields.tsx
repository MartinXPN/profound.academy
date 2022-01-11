import {memo, useEffect, useState} from "react";
import {Autocomplete, Collapse, IconButton, List, ListItem, TextField} from "@mui/material";
import { TransitionGroup } from 'react-transition-group';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Box from "@mui/material/Box";
import * as locales from '@mui/material/locale';


interface Field {
    locale: string;
    title: string;
    notionId: string;
}

function LocalizedField({field, setField}: {
    field: Field,
    setField: (field: Field) => void;
}) {
    const [currentLocale, setCurrentLocale] = useState<string>(field.locale);
    useEffect(() => {
        setCurrentLocale(field.locale);
    }, [field]);

    return <>
        <Autocomplete
            multiple
            limitTags={1}
            sx={{ width: 200 }}
            options={Object.keys(locales)}
            getOptionLabel= {option => `${option.substring(0, 2)}-${option.substring(2, 4)}`}
            autoHighlight
            autoSelect
            disableClearable
            value={[currentLocale]}
            renderOption={(props, option: string) => (
                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                    <img loading="lazy" width={20} alt=""
                         src={`https://flagcdn.com/w20/${option.substring(2, 4).toLowerCase()}.png`}
                         srcSet={`https://flagcdn.com/w40/${option.substring(2, 4).toLowerCase()}.png 2x`}/>
                    {option.substring(0, 2)}-{option.substring(2, 4)}
                </Box>
            )}
            renderTags={(options: string[], getTagProps) => options.map((option, index) => (
                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...getTagProps({ index })}>
                    <img loading="lazy" width={20} alt=""
                         src={`https://flagcdn.com/w20/${option.substring(2, 4).toLowerCase()}.png`}
                         srcSet={`https://flagcdn.com/w40/${option.substring(2, 4).toLowerCase()}.png 2x`}/>
                    {option.substring(0, 2)}-{option.substring(2, 4)}
                </Box>
            ))}
            renderInput={(params) => <TextField{...params} label="Language"/>}
            // @ts-ignore
            onChange={(e, value: string[]) => {
                value.length && setCurrentLocale(value.at(-1)!);
            }}
        />
    </>
}


function LocalizedFields() {
    const [localizedFields, setLocalizedFields] = useState<Field[]>([]);

    const handleRemoveItem = (item: any) => {

    }
    const addItem = () => {
        setLocalizedFields(fields => [...fields, {locale: 'new', title: '', notionId: ''}]);
    }


    return <>
        <List>
            <TransitionGroup>
            {localizedFields.map(item => (
                <Collapse key={item.locale}>
                    <ListItem secondaryAction={
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            title="Delete"
                            onClick={() => handleRemoveItem(item)}>
                            <CloseIcon />
                        </IconButton>}>

                        <LocalizedField field={item} setField={() => {}} />
                    </ListItem>
                </Collapse>
            ))}
            </TransitionGroup>
        </List>

        <IconButton title="Add" edge="start" onClick={addItem}>
            <AddIcon/>
        </IconButton>
    </>
}


export default memo(LocalizedFields);
