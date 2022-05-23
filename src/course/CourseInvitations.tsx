import React, {memo, useState} from "react";
import {Autocomplete, Button, Chip, Stack, TextField} from "@mui/material";
import {Controller, useFormContext} from "react-hook-form";


function CourseInvitations({onSendInvites}: {onSendInvites: () => Promise<void>}) {
    const {control, formState: {errors}, watch, setValue} = useFormContext();
    const [currentSearch, setCurrentSearch] = useState<string>('');
    const emails = watch('invitedEmails');
    const onEmailsChanged = (emails: string[]) => setValue('invitedEmails', emails, {shouldTouch: true});

    console.log('emails:', emails);
    console.log('currentSearch:', currentSearch);

    return <>
        <Stack direction="row" spacing={2} alignItems="top" marginBottom={4}>
            <Controller name="invitedEmails" control={control} render={({ field }) => (
                <Autocomplete
                    multiple freeSolo disableClearable autoSelect sx={{flex: 1}}
                    options={[]}
                    open={false}
                    value={emails}
                    ref={field.ref}
                    inputValue={currentSearch}
                    onChange={(e, value: string[]) => {
                        onEmailsChanged(value);
                        setCurrentSearch('');
                    }}
                    renderTags={(value: string[], getTagProps) => value.map((option, index: number) =>
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    )}
                    renderInput={(params) => (
                        <TextField
                            label="Invitation emails"
                            placeholder="abc@gmail.com hello@yahoo.com"
                            value={currentSearch}
                            error={Boolean(errors.invitedEmails)}
                            helperText={Boolean(errors.invitedEmails) ? errors.invitedEmails?.message : 'Invites are only sent to new users. Removing an email from the list blocks the user'}
                            {...params}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase();
                                const values = val.split(/[ ,]+/);

                                if( values.length > 1 ) {
                                    onEmailsChanged([...emails, ...values.slice(0, -1).filter(v => v.length > 2)]);
                                    setCurrentSearch(values.at(-1)!);
                                }
                                else {
                                    setCurrentSearch(val);
                                }
                            }} />
                    )} />
            )}/>

            <Button size="large" variant="outlined" onClick={onSendInvites} sx={{height: '3em'}}>Send invite</Button>
        </Stack>

        <Controller name="mailSubject" control={control} render={({ field: { ref, ...field } }) => (
            <TextField fullWidth label="Subject" variant="outlined" placeholder="Invitation email subject"
                       error={Boolean(errors.mailSubject)} helperText={errors.mailSubject?.message}
                       inputRef={ref} {...field} sx={{marginBottom: 2}} InputLabelProps={{ shrink: true }} />
        )}/>
        <Controller name="mailText" control={control} render={({ field: { ref, ...field } }) => (
            <TextField fullWidth multiline label="Mail text" variant="outlined" placeholder="Invite users to participate..."
                       error={Boolean(errors.mailText)} helperText={errors.mailText?.message}
                       inputRef={ref} {...field} sx={{marginBottom: 2}} InputLabelProps={{ shrink: true }} />
        )}/>
    </>
}

export default memo(CourseInvitations);
