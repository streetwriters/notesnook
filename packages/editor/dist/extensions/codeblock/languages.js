var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import hljs from "highlight.js/lib/core";
export { hljs };
// load hljs into the editor window which can be the iframe
// or the main window. This is required so language definitions
// can be loaded.
globalThis["hljs"] = hljs;
// export type LanguageDefinition = {
//   name: string;
//   shortname: string;
//   aliases?: string[];
// };
var loadedLanguages = {};
export function loadLanguage(shortName) {
    return __awaiter(this, void 0, void 0, function () {
        var url, lang;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (loadedLanguages[shortName])
                        return [2 /*return*/, hljs.getLanguage(shortName)];
                    url = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/languages/".concat(shortName, ".min.js");
                    return [4 /*yield*/, loadScript(url)];
                case 1:
                    _a.sent();
                    lang = hljs.getLanguage(shortName);
                    loadedLanguages[shortName] = lang;
                    return [2 /*return*/, lang];
            }
        });
    });
}
function loadScript(url) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = url;
        // Append to the `head` element
        document.head.appendChild(script);
        script.addEventListener("load", function () {
            resolve(undefined);
        });
        script.addEventListener("error", function (error) {
            console.error(error);
            reject("Could not load script at url ".concat(url, "."));
        });
    });
}
export var LANGUAGES = [
    { name: "Plain text", shortname: "plaintext", aliases: ["text", "txt"] },
    {
        name: "HTML, XML",
        shortname: "xml",
        aliases: [
            "html",
            "xhtml",
            "rss",
            "atom",
            "xjb",
            "xsd",
            "xsl",
            "plist",
            "wsf",
            "svg",
        ],
    },
    { name: "Bash", shortname: "bash", aliases: ["sh"] },
    { name: "C", shortname: "c", aliases: ["h"] },
    {
        name: "C++",
        shortname: "cpp",
        aliases: ["cc", "c++", "h++", "hpp", "hh", "hxx", "cxx"],
    },
    { name: "C#", shortname: "csharp", aliases: ["cs", "c#"] },
    { name: "CSS", shortname: "css" },
    { name: "Markdown", shortname: "markdown", aliases: ["md", "mkdown", "mkd"] },
    { name: "Diff", shortname: "diff", aliases: ["patch"] },
    {
        name: "Ruby",
        shortname: "ruby",
        aliases: ["rb", "gemspec", "podspec", "thor", "irb"],
    },
    { name: "Go", shortname: "go", aliases: ["golang"] },
    { name: "TOML, also INI", shortname: "ini", aliases: ["toml"] },
    { name: "Java", shortname: "java", aliases: ["jsp"] },
    {
        name: "Javascript",
        shortname: "javascript",
        aliases: ["js", "jsx", "mjs", "cjs"],
    },
    { name: "JSON", shortname: "json" },
    { name: "Kotlin", shortname: "kotlin", aliases: ["kt", "kts"] },
    { name: "Less", shortname: "less" },
    { name: "Lua", shortname: "lua" },
    { name: "Makefile", shortname: "makefile", aliases: ["mk", "mak", "make"] },
    { name: "Perl", shortname: "perl", aliases: ["pl", "pm"] },
    {
        name: "Objective-C",
        shortname: "objectivec",
        aliases: ["mm", "objc", "obj-c", "obj-c++", "objective-c++"],
    },
    { name: "php", shortname: "php" },
    { name: "PHP template", shortname: "php-template" },
    { name: "Python", shortname: "python", aliases: ["py", "gyp", "ipython"] },
    { name: "python-repl", shortname: "python-repl", aliases: ["pycon"] },
    { name: "R", shortname: "r" },
    { name: "Rust", shortname: "rust", aliases: ["rs"] },
    { name: "SCSS", shortname: "scss" },
    {
        name: "Shell Session",
        shortname: "shell",
        aliases: ["console", "shellsession"],
    },
    { name: "SQL", shortname: "sql" },
    { name: "Swift", shortname: "swift" },
    { name: "YAML", shortname: "yaml", aliases: ["yml"] },
    { name: "TypeScript", shortname: "typescript", aliases: ["ts", "tsx"] },
    { name: "Visual Basic .NET", shortname: "vbnet", aliases: ["vb"] },
    { name: "1C:Enterprise", shortname: "1c" },
    { name: "Augmented Backus-Naur Form", shortname: "abnf" },
    { name: "Apache Access Log", shortname: "accesslog" },
    { name: "ActionScript", shortname: "actionscript", aliases: ["as"] },
    { name: "Ada", shortname: "ada" },
    { name: "AngelScript", shortname: "angelscript", aliases: ["asc"] },
    { name: "Apache config", shortname: "apache", aliases: ["apacheconf"] },
    { name: "AppleScript", shortname: "applescript", aliases: ["osascript"] },
    { name: "ArcGIS Arcade", shortname: "arcade" },
    { name: "Arduino", shortname: "arduino", aliases: ["ino"] },
    { name: "ARM Assembly", shortname: "armasm", aliases: ["arm"] },
    { name: "AsciiDoc", shortname: "asciidoc", aliases: ["adoc"] },
    { name: "AspectJ", shortname: "aspectj" },
    { name: "AutoHotkey", shortname: "autohotkey", aliases: ["ahk"] },
    { name: "AutoIt", shortname: "autoit" },
    { name: "AVR Assembly", shortname: "avrasm" },
    { name: "Awk", shortname: "awk" },
    { name: "X++", shortname: "axapta", aliases: ["x++"] },
    { name: "BASIC", shortname: "basic" },
    { name: "Backus–Naur Form", shortname: "bnf" },
    { name: "Brainfuck", shortname: "brainfuck", aliases: ["bf"] },
    { name: "C/AL", shortname: "cal" },
    { name: "Cap’n Proto", shortname: "capnproto", aliases: ["capnp"] },
    { name: "Ceylon", shortname: "ceylon" },
    { name: "Clean", shortname: "clean", aliases: ["icl", "dcl"] },
    { name: "Clojure", shortname: "clojure", aliases: ["clj", "edn"] },
    { name: "Clojure REPL", shortname: "clojure-repl" },
    { name: "CMake", shortname: "cmake", aliases: ["cmake.in"] },
    {
        name: "CoffeeScript",
        shortname: "coffeescript",
        aliases: ["coffee", "cson", "iced"],
    },
    { name: "Coq", shortname: "coq" },
    { name: "Caché Object Script", shortname: "cos", aliases: ["cls"] },
    { name: "crmsh", shortname: "crmsh", aliases: ["crm", "pcmk"] },
    { name: "Crystal", shortname: "crystal", aliases: ["cr"] },
    { name: "CSP", shortname: "csp" },
    { name: "D", shortname: "d" },
    { name: "Dart", shortname: "dart" },
    {
        name: "Delphi",
        shortname: "delphi",
        aliases: ["dpr", "dfm", "pas", "pascal"],
    },
    { name: "Django", shortname: "django", aliases: ["jinja"] },
    { name: "DNS Zone", shortname: "dns", aliases: ["bind", "zone"] },
    { name: "Dockerfile", shortname: "dockerfile", aliases: ["docker"] },
    { name: "Batch file (DOS)", shortname: "dos", aliases: ["bat", "cmd"] },
    { name: "dsconfig", shortname: "dsconfig" },
    { name: "Device Tree", shortname: "dts" },
    { name: "Dust", shortname: "dust", aliases: ["dst"] },
    { name: "Extended Backus-Naur Form", shortname: "ebnf" },
    { name: "Elixir", shortname: "elixir", aliases: ["ex", "exs"] },
    { name: "Elm", shortname: "elm" },
    { name: "ERB", shortname: "erb" },
    { name: "Erlang REPL", shortname: "erlang-repl" },
    { name: "Erlang", shortname: "erlang", aliases: ["erl"] },
    { name: "Excel formulae", shortname: "excel", aliases: ["xlsx", "xls"] },
    { name: "FIX", shortname: "fix" },
    { name: "Flix", shortname: "flix" },
    { name: "Fortran", shortname: "fortran", aliases: ["f90", "f95"] },
    { name: "F#", shortname: "fsharp", aliases: ["fs", "f#"] },
    { name: "GAMS", shortname: "gams", aliases: ["gms"] },
    { name: "GAUSS", shortname: "gauss", aliases: ["gss"] },
    { name: "G-code (ISO 6983)", shortname: "gcode", aliases: ["nc"] },
    { name: "Gherkin", shortname: "gherkin", aliases: ["feature"] },
    { name: "GLSL", shortname: "glsl" },
    { name: "GML", shortname: "gml" },
    { name: "Golo", shortname: "golo" },
    { name: "Gradle", shortname: "gradle" },
    { name: "Groovy", shortname: "groovy" },
    { name: "HAML", shortname: "haml" },
    {
        name: "Handlebars",
        shortname: "handlebars",
        aliases: ["hbs", "html.hbs", "html.handlebars", "htmlbars"],
    },
    { name: "Haskell", shortname: "haskell", aliases: ["hs"] },
    { name: "Haxe", shortname: "haxe", aliases: ["hx"] },
    { name: "HSP", shortname: "hsp" },
    { name: "HTTP", shortname: "http", aliases: ["https"] },
    { name: "Hy", shortname: "hy", aliases: ["hylang"] },
    { name: "Inform 7", shortname: "inform7", aliases: ["i7"] },
    { name: "IRPF90", shortname: "irpf90" },
    { name: "ISBL", shortname: "isbl" },
    { name: "JBoss CLI", shortname: "jboss-cli", aliases: ["wildfly-cli"] },
    { name: "Julia", shortname: "julia" },
    { name: "Julia REPL", shortname: "julia-repl", aliases: ["jldoctest"] },
    { name: "Lasso", shortname: "lasso", aliases: ["ls", "lassoscript"] },
    { name: "LaTeX", shortname: "latex", aliases: ["tex"] },
    { name: "LDIF", shortname: "ldif" },
    { name: "Leaf", shortname: "leaf" },
    { name: "Lisp", shortname: "lisp" },
    { name: "LiveCode", shortname: "livecodeserver" },
    { name: "LiveScript", shortname: "livescript", aliases: ["ls"] },
    { name: "LLVM IR", shortname: "llvm" },
    { name: "LSL (Linden Scripting Language)", shortname: "lsl" },
    { name: "Mathematica", shortname: "mathematica", aliases: ["mma", "wl"] },
    { name: "Matlab", shortname: "matlab" },
    { name: "Maxima", shortname: "maxima" },
    { name: "MEL", shortname: "mel" },
    { name: "Mercury", shortname: "mercury", aliases: ["m", "moo"] },
    { name: "MIPS Assembly", shortname: "mipsasm", aliases: ["mips"] },
    { name: "Mizar", shortname: "mizar" },
    { name: "Mojolicious", shortname: "mojolicious" },
    { name: "Monkey", shortname: "monkey" },
    { name: "MoonScript", shortname: "moonscript", aliases: ["moon"] },
    { name: "N1QL", shortname: "n1ql" },
    { name: "Nested Text", shortname: "nestedtext", aliases: ["nt"] },
    { name: "Nginx config", shortname: "nginx", aliases: ["nginxconf"] },
    { name: "Nim", shortname: "nim" },
    { name: "Nix", shortname: "nix", aliases: ["nixos"] },
    { name: "Node REPL", shortname: "node-repl" },
    { name: "NSIS", shortname: "nsis" },
    { name: "OCaml", shortname: "ocaml", aliases: ["ml"] },
    { name: "OpenSCAD", shortname: "openscad", aliases: ["scad"] },
    { name: "Oxygene", shortname: "oxygene" },
    { name: "Parser3", shortname: "parser3" },
    { name: "Packet Filter config", shortname: "pf", aliases: ["pf.conf"] },
    {
        name: "PostgreSQL",
        shortname: "pgsql",
        aliases: ["postgres", "postgresql"],
    },
    { name: "Pony", shortname: "pony" },
    {
        name: "PowerShell",
        shortname: "powershell",
        aliases: ["pwsh", "ps", "ps1"],
    },
    { name: "Processing", shortname: "processing", aliases: ["pde"] },
    { name: "Python profiler", shortname: "profile" },
    { name: "Prolog", shortname: "prolog" },
    { name: ".properties", shortname: "properties" },
    { name: "Protocol Buffers", shortname: "protobuf" },
    { name: "Puppet", shortname: "puppet", aliases: ["pp"] },
    { name: "PureBASIC", shortname: "purebasic", aliases: ["pb", "pbi"] },
    { name: "Q", shortname: "q", aliases: ["k", "kdb"] },
    { name: "QML", shortname: "qml", aliases: ["qt"] },
    { name: "ReasonML", shortname: "reasonml", aliases: ["re"] },
    { name: "RenderMan RIB", shortname: "rib" },
    { name: "Roboconf", shortname: "roboconf", aliases: ["graph", "instances"] },
    {
        name: "Microtik RouterOS script",
        shortname: "routeros",
        aliases: ["mikrotik"],
    },
    { name: "RenderMan RSL", shortname: "rsl" },
    { name: "Oracle Rules Language", shortname: "ruleslanguage" },
    { name: "SAS", shortname: "sas" },
    { name: "Scala", shortname: "scala" },
    { name: "Scheme", shortname: "scheme" },
    { name: "Scilab", shortname: "scilab", aliases: ["sci"] },
    { name: "Smali", shortname: "smali" },
    { name: "Smalltalk", shortname: "smalltalk", aliases: ["st"] },
    { name: "SML (Standard ML)", shortname: "sml", aliases: ["ml"] },
    { name: "SQF", shortname: "sqf" },
    { name: "Stan", shortname: "stan", aliases: ["stanfuncs"] },
    { name: "Stata", shortname: "stata", aliases: ["do", "ado"] },
    {
        name: "STEP Part 21",
        shortname: "step21",
        aliases: ["p21", "step", "stp"],
    },
    { name: "Stylus", shortname: "stylus", aliases: ["styl"] },
    { name: "SubUnit", shortname: "subunit" },
    { name: "Tagger Script", shortname: "taggerscript" },
    { name: "Test Anything Protocol", shortname: "tap" },
    { name: "Tcl", shortname: "tcl", aliases: ["tk"] },
    { name: "Thrift", shortname: "thrift" },
    { name: "TP", shortname: "tp" },
    { name: "Twig", shortname: "twig", aliases: ["craftcms"] },
    { name: "Vala", shortname: "vala" },
    { name: "Visual Basic .NET", shortname: "vbnet", aliases: ["vb"] },
    { name: "VBScript", shortname: "vbscript", aliases: ["vbs"] },
    { name: "VBScript in HTML", shortname: "vbscript-html" },
    { name: "Verilog", shortname: "verilog", aliases: ["v", "sv", "svh"] },
    { name: "VHDL", shortname: "vhdl" },
    { name: "Vim Script", shortname: "vim" },
    { name: "WebAssembly", shortname: "wasm" },
    { name: "Wren", shortname: "wren" },
    { name: "Intel x86 Assembly", shortname: "x86asm" },
    { name: "XL", shortname: "xl", aliases: ["tao"] },
    { name: "XQuery", shortname: "xquery", aliases: ["xpath", "xq"] },
    { name: "Zephir", shortname: "zephir", aliases: ["zep"] },
];
