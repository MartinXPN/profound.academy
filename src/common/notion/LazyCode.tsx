import React, {memo, useState, useRef, useCallback, FC} from 'react'
import {highlightElement} from 'prismjs'
import {CodeBlock, Decoration} from 'notion-types'
import {getBlockTitle} from 'notion-utils'
import copyToClipboard from 'clipboard-copy'

import {cs, useNotionContext, Text} from "react-notion-x";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {DependencyLoader, getAllDependencies, name} from "./prismutil";
import useAsyncEffect from "use-async-effect";


export const LazyCode = ({content, language, className}: {
    content: string,
    language: string,
    className?: string,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const copyTimeout = useRef<number | null>(null);
    const codeRef = useRef();
    useAsyncEffect(async () => {
        if( !codeRef.current ) {
            console.error('Not current ref..');
            return;
        }

        const deps = getAllDependencies(language);
        const unique = [...new Set(deps)];
        await new DependencyLoader(unique).load();
        console.log('loaded:', unique);

        try {
            highlightElement(codeRef.current);
        } catch (err) {
            console.warn('prismjs highlight error', err);
        }
    }, [codeRef, language]);

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
        <pre className={cs('notion-code', className)}>
            <div className='notion-code-copy'>
                <div className='notion-code-copy-button' onClick={onClickCopyToClipboard}>
                    <ContentCopyIcon/>
                </div>
                {isCopied && (
                    <div className='notion-code-copy-tooltip'>
                        <div>{isCopied ? 'Copied' : 'Copy'}</div>
                    </div>
                )}
            </div>

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

        const unique = [...new Set(deps.reduce((prev, cur) => [...prev, ...cur], []))];
        await new DependencyLoader(unique).load();
        console.log('loaded:', unique);
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


