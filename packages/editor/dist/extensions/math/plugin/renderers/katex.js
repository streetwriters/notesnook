import katex from "katex";
// Chemistry formulas support
import "katex/contrib/mhchem/mhchem";
export var KatexRenderer = {
    inline: function (text, element) {
        katex.render(text, element, {
            displayMode: false,
            globalGroup: true,
            throwOnError: false,
        });
    },
    block: function (text, element) {
        katex.render(text, element, {
            displayMode: true,
            globalGroup: true,
            throwOnError: false,
        });
    },
};
