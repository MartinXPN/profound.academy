import React, {useState} from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";


function Editor() {
    const [code, setCode] = useState('');

    return (
        <div style={{height: '100%'}}>
            <AceEditor
                placeholder="Start typing your code..."
                mode="python"
                theme="tomorrow"
                width='100%'
                onChange={(value) => {
                    console.log(value);
                    setCode(value);
                }}
                showPrintMargin
                showGutter
                highlightActiveLine

                name="editor_div"
                value={code}
                setOptions={{
                    useWorker: false,
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: false,
                    showLineNumbers: true,
                    tabSize: 4,
                }}
                editorProps={{ $blockScrolling: false }}
            />

            <div>Submission results and outputs will appear here...</div>

        </div>
    )
}

export default Editor;
