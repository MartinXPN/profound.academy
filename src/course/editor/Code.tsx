import React, {useEffect} from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/ext-language_tools";
import {Typography} from "@material-ui/core";

export const languages = [
    "javascript",
    "java",
    "python",
    "xml",
    "ruby",
    "sass",
    "markdown",
    "mysql",
    "json",
    "html",
    "handlebars",
    "golang",
    "csharp",
    "elixir",
    "typescript",
    "css"
];

export const themes = [
    "monokai",
    "github",
    "tomorrow",
    "kuroir",
    "twilight",
    "xcode",
    "textmate",
    "solarized_dark",
    "solarized_light",
    "terminal"
];

interface Props {
    theme: string;
    language: string;
    fontSize: number;
    setCode: (code: string) => void;
}

function Code(props: Props) {
    const {theme, language, fontSize, setCode} = props;
    if(!languages.includes(language)) return <Typography>Language not supported!</Typography>
    if(!themes.includes(theme)) return <Typography>Theme not supported!</Typography>

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        require(`ace-builds/src-noconflict/mode-${language}`);
        require(`ace-builds/src-noconflict/snippets/${language}`);
        require(`ace-builds/src-noconflict/theme-${theme}`)
    }, [language, theme]);

    return (
        <AceEditor
            placeholder="Start typing your code..."
            mode={language}
            theme={theme}
            width='100%'
            height='100%'
            fontSize={fontSize}
            onChange={(value) => {
                console.log(value);
                setCode(value);
            }}
            showPrintMargin
            showGutter
            highlightActiveLine

            name="editor_div"
            setOptions={{
                useWorker: false,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: false,
                showLineNumbers: true,
                tabSize: 4,
            }}
            editorProps={{ $blockScrolling: true }}
        />
    )
}

export default Code;
