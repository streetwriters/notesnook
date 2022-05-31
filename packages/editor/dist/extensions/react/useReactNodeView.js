import { createContext, useContext } from 'react';
export var ReactNodeViewContext = createContext({
    onDragStart: undefined,
});
export var useReactNodeView = function () { return useContext(ReactNodeViewContext); };
