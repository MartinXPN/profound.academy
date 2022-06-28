import {memo} from "react";
import {Autocomplete, Button, IconButton, List, ListItem, Stack, TextField} from "@mui/material";

import {Controller, useFieldArray, useFormContext} from "react-hook-form";
import {infer as Infer, object, string} from "zod";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import * as locales from "@mui/material/locale";
import {notionPageToId} from "../services/notion";
import Locale from "./Locale";


export const fieldSchema = object({
    locale: string().min(2).max(6),
    title: string().min(3).max(128),
    notionId: string().min(20).max(35),
});
export type FieldSchema = Infer<typeof fieldSchema>;

export const noContentSchema = object({
    locale: string().min(2).max(6),
    title: string().min(3).max(128),
    notionId: string().min(0).max(0),
});
export type NoContentFieldSchema = Infer<typeof noContentSchema>;


export function LocalizedFieldView({allowedLocales, namePrefix, excludeContent}: {
    allowedLocales: string[], namePrefix?: string, excludeContent?: boolean
}) {
    const {control, formState: {errors}} = useFormContext();
    const getError = (path: string) => {
        if( path.includes('.') ) {
            const [rootName, index, fieldName] = path.split('.');
            // @ts-ignore
            return errors?.[rootName]?.[Number(index)]?.[fieldName];
        }
        return errors[path];
    }
    // console.log(namePrefix);

    return <>
        <Stack direction="row" alignItems="top" alignContent="top" width="100%">
            <Controller name={`${namePrefix}locale`} control={control} render={({field: {value, onChange, ...field}}) => (
                <Autocomplete
                    {...field}
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
                    value={[value]}
                    renderOption={({ ...props}, option: string) => <Locale locale={option} {...props} />}
                    renderTags={(options: string[], getTagProps) => options.map((option, index) => <Locale locale={option} {...getTagProps({ index })} />)}
                    renderInput={(params) => (
                        <TextField label="Language" {...params}
                                   error={Boolean(getError(`${namePrefix}locale`))}
                                   helperText={getError(`${namePrefix}locale`)?.message} />
                    )}
                    onChange={(e, value: string[]) => value.length && onChange(value.at(-1)!)}
                />
            )} />

            <Controller name={`${namePrefix}title`} control={control} render={({ field: { ref, ...field } }) => (
                <TextField required fullWidth label="Title" variant="outlined" size="small" placeholder="Title..."
                           error={Boolean(getError(`${namePrefix}title`))} helperText={getError(`${namePrefix}title`)?.message}
                           inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>
            {!excludeContent && <Controller name={`${namePrefix}notionId`} control={control} render={({ field: { ref, onChange, ...field } }) => (
                <TextField required fullWidth label="Notion page" variant="outlined" size="small" placeholder="Notion ID"
                           error={Boolean(getError(`${namePrefix}notionId`))} helperText={getError(`${namePrefix}notionId`)?.message}
                           onChange={(e) => onChange(notionPageToId(e.target.value))}
                           inputRef={ref} {...field} sx={{flex: 1}} />
            )}/>}
        </Stack>
    </>
}


export const LocalizedField = memo(LocalizedFieldView);

function LocalizedFields({excludeContent}: {excludeContent?: boolean}) {
    const {control, watch} = useFormContext();
    const { fields, append, remove } = useFieldArray({control, name: 'localizedFields'});
    const watchFieldArray = watch('localizedFields');
    // console.log('fields:', fields, 'watchFieldArray:', watchFieldArray);
    const controlledFields = fields.map((field, index) => {
        return {...field, ...watchFieldArray[index]};
    });

    const getAllowedLocales = (index: number) => {
        const allLocales = new Set(Object.keys(locales));
        controlledFields.forEach(f => allLocales.delete(f.locale));
        // console.log('getAllowedLocales:', index, controlledFields.map(f => f.locale), '=>', allLocales);
        return 0 <= index && index < controlledFields.length ? [controlledFields[index].locale, ...allLocales] : [...allLocales];
    }
    const addLanguage = (locale?: string) => {
        if( !locale )
            locale = getAllowedLocales(-1)[0];
        append({locale: locale, title: '', notionId: ''});
    }

    return <>
        <List>
            {controlledFields.map((item, index) => (
                <ListItem key={item.id} secondaryAction={
                    <IconButton edge="end" title="Delete" onClick={() => remove(index)}><CloseIcon /></IconButton>
                }>
                    <LocalizedField
                        allowedLocales={getAllowedLocales(index)}
                        namePrefix={`localizedFields.${index}.`}
                        excludeContent={excludeContent} />
                </ListItem>
            ))}
            <Button key="add" sx={{textTransform: 'none', marginLeft: 2}} startIcon={<AddIcon/>} onClick={() => addLanguage()}>Add</Button>
        </List>
    </>
}

export default memo(LocalizedFields);
