Features:

1. Cross-platform
2. Able to render at the top & the bottom
   1. Aligns & adjusts different elements based on where it's located
3. 4 different types of interaction elements:
   1. Dropdown
   2. Popup
   3. Bottom action sheet (mobile only)
   4. Sidebar
4. The toolbar will be extensible allowing plugins to add tools into it.

API Design:

1. All the tools will be defined in a seperate file
2. Each tool will implement the `ITool` interface
3. The `ITool` interface defines:
   1. The name
   2. Type: "block" | "inline" etc.
   3. Help text/description
   4. The action
4. Each tool will take the `Editor` instance from its constructor
5. The `action` needs to be pure i.e., it should perform the exact same action on the same data.
6. All the tools classes will be exported from the `index.ts` file

The Toolbar:

1. The toolbar will be React rendered taking a tool definition from its props & the location.
2. Based on the tool definition, the toolbar will render different items.
3. The icon for each tool will be derived from the tool definition
   1. We will need an icon resolver that will take an icon name & find the icon associated with it.
   2. To this purpose, we should have an icon dictionary which the client can import & use.
4. This toolbar will be exported for the client to render.

Interaction Elements:

1. Inside the `action` of each tool, the action will have full control over what to render & where.
2. The action should take the rendered `HTMLElement` as reference
3. In case of dropdown:
   1. We can use the menu from the app & move it into a module
   2. This menu can then be reshaped to act as a dropdown
4. In case of bottom sheet:
   1. We should use [react-spring-bottom-sheet](https://github.com/stipsan/react-spring-bottom-sheet)
   2. Since bottom sheet will serve multiple purposes (not just a list of items), it should be possible
      to render anything in it.
5. In case of popup: TBD
6. In case of side bar: TBD

Total Tools:

- [x] bold italic underline strikethrough inlinecode
- [x] fontselect
- [x] blockquote (styling left)
- [x] codeblock
- [x] fontsizeselect
- [x] formatselect
- [x] alignleft aligncenter alignright alignjustify
- [] outdent indent
- [x] subscript superscript
- [x] numlist
- [x] bullist
- [x] checklist
- [x] forecolor backcolor
- [x] removeformat
- [x] hr
- [x] link
- [x] image
- [x] attachment
- [] media
- [x] table
- [x] ltr rtl
- [x] searchreplace
