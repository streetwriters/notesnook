var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex, Button } from "rebass";
import { Popup } from "../components/popup";
export function ImageUploadPopup(props) {
    var _this = this;
    var onInsert = props.onInsert, onClose = props.onClose;
    var _a = __read(useState(""), 2), url = _a[0], setUrl = _a[1];
    return (_jsx(Popup, __assign({ title: "Upload image from URL", onClose: onClose }, { children: _jsxs(Flex, __assign({ sx: { p: 1, flexDirection: "column", width: ["auto", 250] } }, { children: [_jsx(Input, { type: "url", autoFocus: true, placeholder: "Paste Image URL here", value: url, onChange: function (e) { return setUrl(e.target.value); } }), _jsx(Button, __assign({ variant: "primary", sx: {
                        alignSelf: ["stretch", "end", "end"],
                        my: 1,
                        mr: 1,
                    }, onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                        var response, dataurl, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, fetch(url)];
                                case 1:
                                    response = _b.sent();
                                    if (!response.ok)
                                        return [2 /*return*/]; // TODO show error
                                    _a = toDataURL;
                                    return [4 /*yield*/, response.blob()];
                                case 2: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
                                case 3:
                                    dataurl = _b.sent();
                                    onInsert({ src: dataurl });
                                    return [2 /*return*/];
                            }
                        });
                    }); }, disabled: !url.trim() }, { children: "Insert image" }))] })) })));
}
function toDataURL(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (_e) { return resolve(reader.result); };
        reader.onerror = function (_e) { return reject(reader.error); };
        reader.onabort = function (_e) { return reject(new Error("Read aborted")); };
        reader.readAsDataURL(blob);
    });
}
