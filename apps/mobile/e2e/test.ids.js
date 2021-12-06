export const notesnook = {
  editor:{
    back:"editor.back",
    id:"editor.id"
  },
  buttons:{
    add:"buttons.add"
  },
  ids: {
    default: {
      root: 'root',
      menu: 'menu',
      dialog: {
        yes: 'yes',
        no: 'no',
      },
      editor: 'editor',
      header: {
        buttons: {
          left: 'left',
          right: 'right',
          back: 'back',
        },
      },
      actionsheetBackdrop: 'backdrop',
      loginToSync: 'login_to_sync',
      addBtn: 'btn-add-item',
    },
    dialogs: {
      notebook: {
        inputs: {
          title: 'title',
          description: 'description',
          topic: 'topic',
        },
        buttons: {
          add: 'add',
        },
      },
      export: {
        pdf: 'pdf',
        text: 'text',
        md: 'md',
        html: 'html',
      },
      vault: {
        changePwd: 'change_pwd',
        pwd: 'pwd',
        confirmPwd: 'pwd',
        pwdAlt: 'pwd_alt',
        fingerprint: 'fingerprint',
      },
      sortBy: {
        order: 'orderby',
        default: 'btn-default',
        alphabetical: 'btn-alphabetical',
        year: 'btn-year',
        week: 'btn-week',
        month: 'btn-month',
      },
      addTo: {
        addNotebook: 'input-addNotebook',
        addTopic: 'input-addTopic',
        btnNotebook: 'btn-addNotebook',
        btnTopic: 'btn-addTopic',
      },
      actionsheet: {
        delete: 'icon-Delete',
        hashtagInput: 'hashtag_input',
        export: 'icon-Export',
        addTo: 'icon-Add to',
        pin: 'item_pin',
        pinMenu: 'item_pin_menu',
        favorite: 'note_favorite',
        vault: 'vault_btn',
        copy: 'icon-Copy',
        sync: 'btn-sync-now',
        night: 'nightswitch',
        color: (color) => 'icon-color-' + color,
      },
    },
    menu: {
      nightmode: 'night',
    },
    note: {
      menu: 'note_menu',
      get:(index) => 'note-item-' + index
    },
    notebook: {
      menu: 'notebook_menu',
      get:(index) => 'notebook-item-' + index
    },
    topic: {
      menu: 'topic_menu',
      get:(index) => 'topic-item-' + index
    },
    tag: {                       
      menu: 'tag_menu',
      get:(index) => 'tag-item-' + index
    },
    list: {
      getByType: (type) => 'list-' + type,
    },
  },
};
