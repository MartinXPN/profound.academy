/**
 * The dependencies map is built automatically with gulp.
 *
 * @type {Object<string, string | string[]>}
 */
export const langDependencies = {
    "javascript": "clike",
    "actionscript": "javascript",
    "apex": [
        "clike",
        "sql"
    ],
    "arduino": "cpp",
    "aspnet": [
        "markup",
        "csharp"
    ],
    "birb": "clike",
    "bison": "c",
    "c": "clike",
    "csharp": "clike",
    "cpp": "c",
    "cfscript": "clike",
    "chaiscript": [
        "clike",
        "cpp"
    ],
    "coffeescript": "javascript",
    "crystal": "ruby",
    "css-extras": "css",
    "d": "clike",
    "dart": "clike",
    "django": "markup-templating",
    "ejs": [
        "javascript",
        "markup-templating"
    ],
    "etlua": [
        "lua",
        "markup-templating"
    ],
    "erb": [
        "ruby",
        "markup-templating"
    ],
    "fsharp": "clike",
    "firestore-security-rules": "clike",
    "flow": "javascript",
    "ftl": "markup-templating",
    "gml": "clike",
    "glsl": "c",
    "go": "clike",
    "groovy": "clike",
    "haml": "ruby",
    "handlebars": "markup-templating",
    "haxe": "clike",
    "hlsl": "c",
    "idris": "haskell",
    "java": "clike",
    "javadoc": [
        "markup",
        "java",
        "javadoclike"
    ],
    "jolie": "clike",
    "jsdoc": [
        "javascript",
        "javadoclike",
        "typescript"
    ],
    "js-extras": "javascript",
    "json5": "json",
    "jsonp": "json",
    "js-templates": "javascript",
    "kotlin": "clike",
    "latte": [
        "clike",
        "markup-templating",
        "php"
    ],
    "less": "css",
    "lilypond": "scheme",
    "liquid": "markup-templating",
    "markdown": "markup",
    "markup-templating": "markup",
    "mongodb": "javascript",
    "n4js": "javascript",
    "objectivec": "c",
    "opencl": "c",
    "parser": "markup",
    "php": "markup-templating",
    "phpdoc": [
        "php",
        "javadoclike"
    ],
    "php-extras": "php",
    "plsql": "sql",
    "processing": "clike",
    "protobuf": "clike",
    "pug": [
        "markup",
        "javascript"
    ],
    "purebasic": "clike",
    "purescript": "haskell",
    "qsharp": "clike",
    "qml": "javascript",
    "qore": "clike",
    "racket": "scheme",
    "cshtml": [
        "markup",
        "csharp"
    ],
    "jsx": [
        "markup",
        "javascript"
    ],
    "tsx": [
        "jsx",
        "typescript"
    ],
    "reason": "clike",
    "ruby": "clike",
    "sass": "css",
    "scss": "css",
    "scala": "java",
    "shell-session": "bash",
    "smarty": "markup-templating",
    "solidity": "clike",
    "soy": "markup-templating",
    "sparql": "turtle",
    "sqf": "clike",
    "squirrel": "clike",
    "t4-cs": [
        "t4-templating",
        "csharp"
    ],
    "t4-vb": [
        "t4-templating",
        "vbnet"
    ],
    "tap": "yaml",
    "tt2": [
        "clike",
        "markup-templating"
    ],
    "textile": "markup",
    "twig": "markup-templating",
    "typescript": "javascript",
    "v": "clike",
    "vala": "clike",
    "vbnet": "basic",
    "velocity": "markup",
    "wiki": "markup",
    "xeora": "markup",
    "xml-doc": "markup",
    "xquery": "markup"
};

export const langAliases = {
    "c++": "cpp",
    "plain text": 'markup',
    "html": "markup",
    "xml": "markup",
    "svg": "markup",
    "mathml": "markup",
    "ssml": "markup",
    "atom": "markup",
    "rss": "markup",
    "js": "javascript",
    "g4": "antlr4",
    "ino": "arduino",
    "adoc": "asciidoc",
    "avs": "avisynth",
    "avdl": "avro-idl",
    "shell": "bash",
    "shortcode": "bbcode",
    "rbnf": "bnf",
    "oscript": "bsl",
    "cs": "csharp",
    "dotnet": "csharp",
    "cfc": "cfscript",
    "coffee": "coffeescript",
    "conc": "concurnas",
    "jinja2": "django",
    "dns-zone": "dns-zone-file",
    "dockerfile": "docker",
    "gv": "dot",
    "eta": "ejs",
    "xlsx": "excel-formula",
    "xls": "excel-formula",
    "gamemakerlanguage": "gml",
    "gni": "gn",
    "go-mod": "go-module",
    "hbs": "handlebars",
    "hs": "haskell",
    "idr": "idris",
    "gitignore": "ignore",
    "hgignore": "ignore",
    "npmignore": "ignore",
    "webmanifest": "json",
    "kt": "kotlin",
    "kts": "kotlin",
    "kum": "kumir",
    "tex": "latex",
    "context": "latex",
    "ly": "lilypond",
    "emacs": "lisp",
    "elisp": "lisp",
    "emacs-lisp": "lisp",
    "md": "markdown",
    "moon": "moonscript",
    "n4jsd": "n4js",
    "nani": "naniscript",
    "objc": "objectivec",
    "qasm": "openqasm",
    "objectpascal": "pascal",
    "px": "pcaxis",
    "pcode": "peoplecode",
    "pq": "powerquery",
    "mscript": "powerquery",
    "pbfasm": "purebasic",
    "purs": "purescript",
    "py": "python",
    "python3": "python",
    "qs": "qsharp",
    "rkt": "racket",
    "razor": "cshtml",
    "rpy": "renpy",
    "robot": "robotframework",
    "rb": "ruby",
    "sh-session": "shell-session",
    "shellsession": "shell-session",
    "smlnj": "sml",
    "sol": "solidity",
    "sln": "solution-file",
    "rq": "sparql",
    "t4": "t4-cs",
    "trickle": "tremor",
    "troy": "tremor",
    "trig": "turtle",
    "ts": "typescript",
    "tsconfig": "typoscript",
    "uscript": "unrealscript",
    "uc": "unrealscript",
    "url": "uri",
    "vb": "visual-basic",
    "vba": "visual-basic",
    "webidl": "web-idl",
    "mathematica": "wolfram",
    "nb": "wolfram",
    "wl": "wolfram",
    "xeoracube": "xeora",
    "yml": "yaml"
};

export const name = (lang: string): string => {
    const res = lang.toLowerCase();
    if( res in langAliases )  // @ts-ignore
        return langAliases[res];
    return res;
};


export const getAllDependencies = (lang: string | string[]): string[] => {
    if( typeof lang === 'object' )
        return lang.map(l => getAllDependencies(l)).reduce((prev, cur) => [...prev, ...cur], []);

    const currentName = name(lang).toLowerCase();
    const res = [currentName];
    if( currentName in langDependencies ) {
        // @ts-ignore
        return [...res, ...getAllDependencies(langDependencies[currentName])];
    }
    return [...new Set(res)];
};

class DependencyLoader {
    private readonly languages: string | string[];
    static startedLoading: Set<string>;
    constructor(languages: string | string[]) {
        this.languages = languages;
        DependencyLoader.startedLoading = new Set<string>();
    }

    /// DFS
    private loadLanguage = async (lang: string): Promise<void> => {
        // console.log('loadLanguage', lang, 'startedLoading:', this.startedLoading);
        DependencyLoader.startedLoading.add(lang);
        const dep = getAllDependencies(lang);

        await Promise.all(dep.filter(l => !DependencyLoader.startedLoading.has(l)).map(async l => this.loadLanguage(l)));
        await import(`prismjs/components/prism-${lang}.min`);
    }

    load = async () => {
        if( typeof this.languages === 'string' )
            return this.loadLanguage(this.languages);
        return Promise.all(this.languages.map(async l => this.loadLanguage(l)));
    }
}

export const loadDependencies = async (language: string) => {
    const deps = getAllDependencies(language);
    const unique = [...new Set(deps)];
    await new DependencyLoader(unique).load();
    console.log('loaded:', unique);
    return unique;
}

export const loadLineNumbers = async () => {
    await Promise.all([
        await import((`prismjs/plugins/line-numbers/prism-line-numbers`)),
        await import((`prismjs/plugins/line-numbers/prism-line-numbers.css`)),
    ]);
    console.log('loaded line numbers');
}
