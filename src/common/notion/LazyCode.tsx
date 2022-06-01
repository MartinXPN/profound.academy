import React, {memo, useState, useRef, useCallback, FC} from 'react'
import useAsyncEffect from "use-async-effect";
import {highlightElement} from 'prismjs'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import {IconButton, Tooltip} from "@mui/material";
import Paper from "@mui/material/Paper";
import {cs, useNotionContext, Text} from "react-notion-x";
import {CodeBlock, Decoration} from 'notion-types'
import {getBlockTitle} from 'notion-utils'
import copyToClipboard from 'clipboard-copy'
import useSWRImmutable from "swr/immutable";

import {getAllDependencies, loadDependencies, loadLineNumbers, name} from "./prismutil";
import {Key} from "swr/dist/types";


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
    const {data: loaded} = useSWRImmutable(language, loadDependencies);
    const {data: lineNumbers} = useSWRImmutable(showLineNumbers as Key, loadLineNumbers);

    useAsyncEffect(async () => {
        if( !codeRef.current || !loaded )
            return console.error('Not highlighting...');
        try {
            highlightElement(codeRef.current);
        } catch (err) {
            console.warn('prismjs highlight error', err);
        }
    }, [codeRef.current, loaded, lineNumbers]);

    const onClickCopyToClipboard = useCallback(() => {
        copyToClipboard(content)
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
                        {isCopied ? <DoneIcon/> : <ContentCopyIcon/>}
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

    useAsyncEffect(async () => {
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


