import {memo, useState, useRef, useCallback, FC, useEffect} from 'react'
import {highlightElement} from 'prismjs'
import {CodeBlock, Decoration} from 'notion-types'
import {getBlockTitle} from 'notion-utils'
import copyToClipboard from 'clipboard-copy'

import {cs, useNotionContext, Text} from "react-notion-x";
import {getAllDependencies, loadDependencies, loadLineNumbers, name} from "./prismutil";
import useAsyncEffect from "use-async-effect";
import {IconButton, Paper, Tooltip} from "@mui/material";
import {Done, ContentCopy} from "@mui/icons-material";


export const LazyCode = ({content, language, className, showLineNumbers}: {
    content: string,
    language: string,
    className?: string,
    showLineNumbers?: boolean,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [showCopy, setShowCopy] = useState(false);
    const copyTimeout = useRef<number | null>(null);
    const codeRef = useRef();
    useAsyncEffect(async () => {
        if (!showLineNumbers || !codeRef.current)
            return;
        await loadLineNumbers();
    }, [showLineNumbers, codeRef]);
    useAsyncEffect(async () => {
        if( !codeRef.current ) {
            console.error('Not current ref..');
            return;
        }
        await loadDependencies(language);
        try {
            highlightElement(codeRef.current);
        } catch (err) {
            console.warn('prismjs highlight error', err);
        }
    }, [codeRef, language]);

    const onClickCopyToClipboard = useCallback(async () => {
        await copyToClipboard(content)
        setIsCopied(true)

        if (copyTimeout.current) {
            clearTimeout(copyTimeout.current)
            copyTimeout.current = null
        }

        copyTimeout.current = setTimeout(() => setIsCopied(false), 1200) as unknown as number;
    }, [content, copyTimeout]);


    return <>
        <pre className={cs('notion-code', showLineNumbers ? 'line-numbers' : 'no-line-numbers', className)}
             onMouseOver={() => setShowCopy(true)}
             onMouseLeave={() => setShowCopy(false)}>

            {showCopy &&
                <Tooltip arrow title={isCopied ? 'Copied!' : 'Copy'} placement="left">
                    <Paper sx={{position: 'absolute', top: 6, right: 6}}>
                        <IconButton disableRipple onClick={onClickCopyToClipboard}>
                            {isCopied ? <Done color="success"/> : <ContentCopy/>}
                        </IconButton>
                    </Paper>
                </Tooltip>}

            { /* @ts-ignore */ }
            <code className={`language-${language}`} ref={codeRef}>{content}</code>
        </pre>
    </>
}

const NotionLazyCode: FC<{
    block: CodeBlock
    defaultLanguage?: string
    className?: string
}> = ({block, defaultLanguage = 'typescript', className}) => {
    const {recordMap} = useNotionContext();
    const [content, setContent] = useState<string>(getBlockTitle(block, recordMap));
    const language = name(block.properties?.language?.[0]?.[0] || defaultLanguage);
    const caption = block.properties.caption;

    useEffect(() => {
        const deps = block.properties.language.map(l => getAllDependencies(l as string[]));
        block.properties.language = deps as Decoration[];
        setContent(getBlockTitle(block, recordMap));
    }, [block, recordMap]);


    return <>
        <LazyCode content={content} language={language} className={className} />

        {caption && (
            <figcaption className='notion-asset-caption'>
                <Text value={caption} block={block}/>
            </figcaption>
        )}
    </>
};

export default memo(NotionLazyCode);


