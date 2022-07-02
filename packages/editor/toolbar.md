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
- [x] media
- [x] table
- [x] ltr rtl
- [x] searchreplace

What's next:

- [x] Port codeblock extension from tinymce to tiptap
- [x] Optimize toolbar & editor UI for mobile
- [x] Refactor & finalize UI + styling
- [ ] Write tests

## Optimize toolbar & editor UI for mobile

1. Refactor tools to be more easily configurable (partially done)
2. Implement sub groups in toolbar (done)
3. Move all popups to /popups directory (partially done)
4. Implement mobile positioning logic in menu/popup presenter (done)
5. Add support for repositioning toolbar (top/bottom) (done)
6. Move all popups to be shown as bottom sheets on mobile (partially done)
7. Figure out how to make interactive widgets selectable in editor (e.g. iframe & table)
8. Create popup header for use in action sheet (done)
   1. Header contains title & action(s)
9. Implement logic to open inline popups (image/cell properties) as an action sheet (done)
10. Open search replace popup as action sheet (done)
11. Improve font size menu (done)
12. Move table context toolbars to bottom (done)

### Refactor tools

1. A tool defines it's own UI
   - This gives it maximum flexibility to do whatever it wants.
   - However, this also restricts the tool to be shown in specific places
     - For example: if all block tools are defined as menu buttons, they can only be shown in a menu
   - But since this toolbar is application specific, this is alright. We already know where a certain
     tool is going to be rendered. Locking things down, while reduces flexibility, also allows us to
     easily customize a specific tool's behavior. A generic toolbar would be great in cases where multiple
     apps are going to be using it.
2. Some factors of a tool's UI can be defined externally
   - For example, a tool's icon + title + description?
3. It wouldn't be a bad idea to separate out action & toggle state of a tool as well. This can be useful in
   cases where we want to invoke a specific tool or get a specific tool's toggle state.

---

1. Keyboard shouldn't close on tool click
2. Handle context toolbar menus on scroll
