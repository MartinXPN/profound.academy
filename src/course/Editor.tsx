import React, {useState} from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/ext-language_tools";
import SplitPane from "react-split-pane";


function Editor() {
    const [code, setCode] = useState('');
    const [editorRatio, setEditorRatio] = useState(0.7);
    console.log('editor size:', localStorage.getItem('editorSplitPos'));
    // console.log('editor size:', localStorage.getItem('editorSplitPos').split(',').map((size) => `${parseFloat(size).toFixed(2)}px`))
    console.log('editor size:', editorRatio);

    return (
        <div style={{height: '100%'}}>
            <AceEditor
                placeholder="Start typing your code..."
                mode="python"
                theme="tomorrow"
                width='100%'
                height='70%'
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
                editorProps={{ $blockScrolling: true }}
            />
            <div style={{height: '30%', backgroundColor: 'yellow'}}>Submission results and outputs will appear here...</div>
        </div>
    )
}

export default Editor;
