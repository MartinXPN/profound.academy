import React, {memo, useCallback, useEffect, useState} from "react";
import {Autocomplete, Button, Collapse, IconButton, List, ListItem, TextField, Stack} from "@mui/material";
import { TransitionGroup } from 'react-transition-group';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import Box from "@mui/material/Box";
import * as locales from '@mui/material/locale';


const validateText = (value: string, minLength: number = 3, maxLength: number = 128) => {
    if( value.length === 0 )            return undefined;
    if( value.length < minLength )      return `The length should be at least ${minLength}`;
    if( value.length > maxLength )      return `The length should be at most ${maxLength}`;
    return undefined;
};

interface Field {
    dirty: boolean;
    locale: string;
    title: string;
    notionId: string;
}

function LocalizedField({field, setField, allowedLocales}: {
    field: Field,
    setField: (field: Field) => void,
    allowedLocales: string[],
}) {
    const [currentLocale, setCurrentLocale] = useState<string>(field.locale);
    const [title, setTitle] = useState<{value: string, error?: string}>({value: field.title, error: undefined});
    const [notionId, setNotionId] = useState<{value: string, error?: string}>({value: field.notionId, error: undefined});

    const onLocaleChanged = (value: string) => setCurrentLocale(value);
    const onTitleChanged = (value: string) => setTitle({value: value, error: validateText(value ?? '')});
    const onNotionIdChanged = (value: string) => setNotionId({value: value, error: validateText(value ?? '', 20, 35)});
    const isDirty = useCallback(() => {
        return !currentLocale || !title.value || !notionId.value || !!title.error || !!notionId.error
    }, [currentLocale, notionId, title]);

    useEffect(() => {
        if( field.locale === currentLocale && field.title === title.value && field.notionId === notionId.value )
            return;

        setField({
            locale: currentLocale,
            title: title.value,
            notionId: notionId.value,
            dirty: isDirty(),
        });
    }, [field, currentLocale, title, notionId, setField, isDirty]);
    useEffect(() => {
        setCurrentLocale(field.locale);
        onTitleChanged(field.title);
        onNotionIdChanged(field.notionId);
    }, [field]);

    return <>
        <Stack direction="row" alignItems="center" alignContent="center">
            <Autocomplete
                multiple
                limitTags={1}
                sx={{ width: 150 }}
                size="small"
                options={allowedLocales}
                getOptionLabel= {option => `${option.substring(0, 2)}-${option.substring(2, 4)}`}
                isOptionEqualToValue={(option, value) => option.toLowerCase().replace('-', '') === value.toLowerCase().replace('-', '')}
                autoHighlight
                autoSelect
                disableClearable
                value={[currentLocale]}
                renderOption={({ ...props}, option: string) => (
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
                    value.length && onLocaleChanged(value.at(-1)!);
                }}
            />


            <TextField required label="Title" variant="outlined" size="small" placeholder="Exercise Title"
                       sx={{flex: 1}}
                       value={title.value} onChange={(e) => onTitleChanged(e.target.value)}
                       error={!!title.error} helperText={title.error ?? null}
                       inputProps={{ 'aria-label': 'controlled' }} />

            <TextField required label="Notion ID" variant="outlined" size="small" placeholder="Exercise Notion ID"
                       value={notionId.value} onChange={(e) => onNotionIdChanged(e.target.value)}
                       error={!!notionId.error} helperText={notionId.error ?? null}
                       inputProps={{ 'aria-label': 'controlled' }} sx={{flex: 1}}/>
        </Stack>
    </>
}


function LocalizedFields() {
    const [localizedFields, setLocalizedFields] = useState<Field[]>([]);

    if( localizedFields.length === 0 ) {
        setLocalizedFields([{dirty: true, locale: 'enUS', title: '', notionId: ''}]);
    }

    const getAllowedLocales = (index: number) => {
        const allLocales = new Set(Object.keys(locales));
        const currentlyUsedLocales = localizedFields.filter((f, i) => i !== index).map(f => f.locale);
        currentlyUsedLocales.forEach((l) => allLocales.delete(l));
        return [...allLocales];
    }

    const handleRemoveItem = (index: number) => {
        const newFields = [...localizedFields];
        if( 0 <= index && index < localizedFields.length )
            newFields.splice(index, 1);

        setLocalizedFields(newFields);
    }
    const addItem = () => {
        setLocalizedFields([...localizedFields, {dirty: true, locale: getAllowedLocales(-1)[0], title: '', notionId: ''}]);
    }
    const changeItem = (index: number, field: Field) => {
        const newFields = [...localizedFields];
        if( 0 <= index && index < localizedFields.length )
            newFields[index] = field;
        setLocalizedFields(newFields);
    }

    return <>
        <List>
            <TransitionGroup>
            {localizedFields.map((item, index) => (
                <Collapse key={item.locale}>
                    <ListItem secondaryAction={
                        <IconButton edge="end" title="Delete" onClick={() => handleRemoveItem(index)}>
                            <CloseIcon />
                        </IconButton>}>

                        <LocalizedField
                            field={item}
                            setField={(field) => changeItem(index, field)}
                            allowedLocales={getAllowedLocales(index)} />
                    </ListItem>
                </Collapse>
            ))}
            </TransitionGroup>
            <Button sx={{textTransform: 'none', marginLeft: 2}} startIcon={<AddIcon/>} onClick={addItem}>Add</Button>
        </List>
    </>
}


export default memo(LocalizedFields);
