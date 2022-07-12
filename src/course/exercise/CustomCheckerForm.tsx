import {memo, useContext} from "react";
import {Box, MenuItem, TextField} from "@mui/material";
import Code from "../editor/Code";
import {useStickyState} from "../../common/stickystate";
import {LANGUAGES} from "models/language";
import {AuthContext} from "../../App";
import {Controller, useFormContext} from "react-hook-form";
import {getModeForPath} from 'ace-builds/src-noconflict/ext-modelist';

function CustomCheckerForm() {
    const auth = useContext(AuthContext);
    const {control, watch} = useFormContext();
    const [theme] = useStickyState('tomorrow', `editorTheme-${auth.currentUserId}`);

    const allowedLanguages = watch('allowedLanguages') as [keyof typeof LANGUAGES];
    const secondCheckerOption = allowedLanguages.length === 1 && allowedLanguages[0] !== 'python'
        ? LANGUAGES[allowedLanguages[0]]
        : null;

    const checkerLanguage = (watch('checker.language') ?? 'python') as keyof typeof LANGUAGES;
    const checkerExtension = LANGUAGES[checkerLanguage].extension;
    const checkerCode = watch('checker.code');

    const filename = `checker.${checkerExtension}`;
    const editorLanguage = getModeForPath(filename).name;
    return <>
        <Controller name="checker.language" control={control} render={({ field: { ref, value, ...field } }) => (
            <TextField select label="Language" variant="outlined" inputRef={ref} {...field} value={checkerLanguage}
                       helperText="Should be either Python or the Allowed language (needs to be only 1)">

                <MenuItem key="python" value="python">Python</MenuItem>
                {secondCheckerOption &&
                    <MenuItem key={secondCheckerOption.languageCode} value={secondCheckerOption.languageCode}>
                        {secondCheckerOption.displayName}
                    </MenuItem>
                }
            </TextField>
        )} />

        <Box height="40em" width="100%">
            <Controller name="checker.code" control={control} render={({ field: { onChange } }) => (
                <Code theme={theme} language={editorLanguage} fontSize={14}
                      code={checkerCode?.[filename] ?? ''}
                      setCode={code => onChange({[filename]: code})} />
            )} />
        </Box>
    </>
}

export default memo(CustomCheckerForm);
