import {memo, useContext, MouseEvent, useState, useCallback, useEffect} from "react";
import {Box, Button, ListItemIcon, ListItemText, Stack} from "@mui/material";
import {Level} from "models/levels";
import {Add, Edit} from "@mui/icons-material";
import {LocalizeContext} from "../../common/Localization";
import {infer as Infer, array, object} from "zod";
import LocalizedFields, {NoContentFieldSchema, noContentSchema} from "../../common/LocalizedFields";
import {useForm, FormProvider} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

// Schema for a single level
const schema = object({
    localizedFields: array(noContentSchema).nonempty(),
});
type Schema = Infer<typeof schema>;

const getLevelLocalizedFields = (level: Level, defaultLocale: string): NoContentFieldSchema[] => {
    if( typeof level.title === 'string' )
        return [{locale: defaultLocale, title: level.title, notionId: ''}];
    return Object.entries(level.title).map(([locale, title]) => ({
        locale: locale, title: title, notionId: ''
    }));
}


export function AddLevel({onAddLevel}: {onAddLevel: () => void}) {
    const onAddLevelClicked = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        onAddLevel();
    }

    return <>
        <Box display="flex" flexWrap="wrap" onClick={onAddLevelClicked}>
            <ListItemIcon><Add /></ListItemIcon>
            <ListItemText>Add Level</ListItemText>
        </Box>
    </>
}

function LevelEditor({level, onSaveLevel}: {
    level: Level, onSaveLevel: (title: string | {[key: string]: string}) => void,
}) {
    const getDefaultFieldValues = useCallback(() => ({
        localizedFields: getLevelLocalizedFields(level, 'enUS'),
    }), [level]);
    const formMethods = useForm<Schema>({
        mode: 'onChange',
        resolver: zodResolver(schema),
        defaultValues: getDefaultFieldValues(),
    });
    const {handleSubmit, formState: {errors}, reset} = formMethods;
    useEffect(() => reset(getDefaultFieldValues()), [level, getDefaultFieldValues, reset]);
    errors && Object.keys(errors).length && console.log('level errors:', errors);

    const {localize} = useContext(LocalizeContext);
    const [showEdit, setShowEdit] = useState(false);
    const [editing, setEditing] = useState(false);
    const handleEdit = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        setEditing(true);
    }
    const cancelEditing = () => setEditing(false);
    const onSubmit = async (data: Schema) => {
        const title = data.localizedFields.reduce((map, field) => {map[field.locale] = field.title; return map;}, {} as {[key: string]: string});
        console.log('Saving the data...', data);
        console.log('title:', title);
        onSaveLevel(title);
        setEditing(false);
    }

    return <>
        <Box display="flex" flexWrap="wrap" sx={{width: '100%'}}
             onMouseOver={() => setShowEdit(true)}
             onMouseOut={() => setShowEdit(editing)}>
            {!editing && <ListItemText>{localize(level.title)}</ListItemText>}
            {!editing && showEdit && <ListItemIcon onClick={handleEdit} sx={{flex: 'end'}}><Edit /></ListItemIcon>}

            {editing && <>
                <FormProvider {...formMethods}>
                <form key="languages-form">
                <Box onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                    <Box flexBasis="100%" height={0} />
                    <LocalizedFields excludeContent />

                    <Box flexBasis="100%" height={0} />
                    <Stack direction="row" spacing={1} marginBottom={2} justifyContent="right" alignItems="center" alignContent="center">
                        <Button variant="outlined" onClick={handleSubmit(onSubmit)}>Save</Button>
                        <Button variant="outlined" onClick={cancelEditing}>Cancel</Button>
                    </Stack>
                </Box>
                </form>
                </FormProvider>
            </>}
        </Box>
    </>
}

export default memo(LevelEditor);
