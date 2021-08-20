import React, {useState} from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";


function Editor() {
    const [code, setCode] = useState('');

    return (
        <AceEditor
            placeholder="Start typing your code..."
            mode="python"
            theme="tomorrow"
            onChange={(value) => {
                console.log(value);
                setCode(value);
            }}
            showPrintMargin
            showGutter
            highlightActiveLine

            name="UNIQUE_ID_OF_DIV"
            value={code}
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

export default Editor;
