var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function loadKatex() {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        const { default: katex } = yield import("katex");
        // Chemistry formulas support
        // @ts-ignore
        yield import("katex/contrib/mhchem/mhchem");
        return katex;
    });
}
export const KatexRenderer = {
    inline: (text, element) => {
        loadKatex().then((katex) => {
            katex.render(text, element, {
                displayMode: false,
                globalGroup: true,
                throwOnError: false,
            });
        });
    },
    block: (text, element) => {
        loadKatex().then((katex) => {
            katex.render(text, element, {
                displayMode: true,
                globalGroup: true,
                throwOnError: false,
            });
        });
    },
};
