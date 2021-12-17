import {
  editor_font_size,
  font_names,
  orderedListStyles,
  unorderedListStyles,
  editor_colors
} from './constants';

export const IMAGE_TOOLTIP_CONFIG = {
  data: [
    {
      format: 'imagepreview',
      type: 'format',
      fullname: 'Image preview'
    },
    {
      format: 'imageResize25',
      text: '25%',
      type: 'format',
      showTitle: false,
      fullname: 'Resize to 25%'
    },
    {
      format: 'imageResize50',
      text: '50%',
      type: 'format',
      showTitle: false,
      fullname: 'Resize to 25%'
    },
    {
      format: 'imageResize100',
      text: '100%',
      type: 'format',
      showTitle: false,
      fullname: 'Resize to 25%'
    },
    {
      format: 'imagefloatleft',
      type: 'format',
      fullname: 'Remove image'
    },
    {
      format: 'imagefloatright',
      type: 'format',
      fullname: 'Image preview'
    },
    {
      format: 'imagefloatnone',
      type: 'format',
      fullname: 'Image preview'
    },
    {
      format: 'removeimage',
      type: 'format',
      fullname: 'Remove image'
    }
  ],
  title: 'imageoptions',
  default: null,
  type: 'imageoptions',
  pageX: 0
};

export const TOOLBAR_CONFIG = [

  'seperator',
  [
    {
      format: 'bold',
      type: 'format',
      fullname: 'Bold'
    },
    {
      format: 'italic',
      type: 'format',
      fullname: 'Italic'
    },
    {
      format: 'underline',
      type: 'format',
      fullname: 'Underline'
    },
    {
      format: 'strikethrough',
      type: 'format',
      fullname: 'Strikethrough'
    },
    {
      format: 'line-break',
      type: 'format',
      fullname: 'Line break'
    },
    {
      format: 'align',
      type: 'tooltip',
      valueIcon: 'alignleft',
      fullname: 'Text Alignment',
      premium: true,
      group: [
        {
          format: 'alignleft',
          type: 'formatLine',
          premium: true,
          fullname: 'Align Left'
        },
        {
          format: 'aligncenter',
          type: 'formatLine',
          premium: true,
          fullname: 'Align Center'
        },
        {
          format: 'alignright',
          type: 'formatLine',
          premium: true,
          fullname: 'Align Right'
        },
        {
          format: 'alignjustify',
          type: 'formatLine',
          premium: true,
          fullname: 'Justify'
        }
      ]
    }
  ],
  'seperator',
  [
    {
      format: 'fontsize',
      type: 'tooltip',
      valueIcon: 'fontsize',
      fullname: 'Font Size',
      premium: true,
      group: editor_font_size.map(item => {
        return {
          format: 'fontsize',
          formatValue: item,
          fullname: item
        };
      })
    },
    {
      format: 'fontname',
      type: 'tooltip',
      textValue: 'System Font',
      fullname: 'Font Family',
      premium: true,
      group: font_names.map(item => {
        return {
          format: 'fontname',
          formatValue: item.value,
          fullname: item.value,
          text: item.name
        };
      })
    },
    {
      format: 'h2',
      type: 'format',
      showTitle: false,
      fullname: 'Heading 2'
    },
    {
      format: 'header',
      type: 'tooltip',
      valueIcon: 'header',
      textValue: 'Paragraph',
      fullname: 'Block',
      group: [
        {
          format: 'p',
          text: 'Paragraph',
          type: 'format',
          showTitle: false,
          fullname: 'Paragraph'
        },
        {
          format: 'h2',
          text: 'Heading 2',
          type: 'format',
          showTitle: false,
          fullname: 'Heading 2'
        },
        {
          format: 'h3',
          text: 'Heading 3',
          type: 'format',
          showTitle: false,
          fullname: 'Heading 3'
        },
        {
          format: 'h4',
          text: 'Heading 4',
          type: 'format',
          showTitle: false,
          fullname: 'Heading 4'
        },
        {
          format: 'h5',
          text: 'Heading 5',
          type: 'format',
          showTitle: false,
          fullname: 'Heading 5'
        },
        {
          format: 'h6',
          text: 'Heading 6',
          type: 'format',
          showTitle: false,
          fullname: 'Heading 6'
        }
      ]
    }
  ],

  'seperator',
  [
    {
      format: 'ol',
      type: 'tooltip',
      fullname: 'Ordered List',
      group: orderedListStyles.map(style => {
        return {
          format: 'ol',
          formatValue: style,
          fullname: style
        };
      })
    },

    {
      format: 'ul',
      type: 'tooltip',
      fullname: 'Unordered List',
      group: unorderedListStyles.map(style => {
        return {
          format: 'ul',
          formatValue: style === 'default' ? 'disc' : style,
          fullname: style
        };
      })
    },
    {
      format: 'cl',
      type: 'format',
      fullname: 'Checklist',
      premium: true
    }
  ],

  'seperator',
  [
    {
      format: 'dhilitecolor',
      type: 'format',
      fullname: 'Default Highlight Color'
    },
    {
      format: 'hilitecolor',
      type: 'tooltip',
      fullname: 'Text Highlight Color',
      groupType: 'hilitecolor',
      group: editor_colors.map(item => {
        return {
          format: 'hilitecolor',
          formatValue: item,
          fullname: item
        };
      })
    },
    {
      format: 'dforecolor',
      type: 'format',
      fullname: 'Default Text Color'
    },
    {
      format: 'forecolor',
      type: 'tooltip',
      fullname: 'Text Color',
      groupType: 'forecolor',
      group: editor_colors.map(item => {
        return {
          format: 'forecolor',
          formatValue: item,
          fullname: item
        };
      })
    }
  ],

  'seperator',
  [
    {
      format: 'blockquote',
      type: 'format',
      fullname: 'Quote'
    },
    {
      format: 'link',
      type: 'tooltip',
      groupType: 'link',
      fullname: 'Link',
      group: [
        {
          format: 'link',
          type: 'format',
          fullname: 'Link'
        }
      ]
    },
    {
      format: 'pre',
      type: 'format',
      fullname: 'Code Block',
      premium: true
    },
    {
      format: 'code',
      type: 'format',
      fullname: 'Inline Code'
    }
  ],

  'seperator',
  [
    {
      format: 'outdent',
      type: 'format',
      fullname: 'Outdent'
    },
    {
      format: 'indent',
      type: 'format',
      fullname: 'Indent'
    },

    {
      format: 'superscript',
      type: 'format',
      fullname: 'Superscript'
    },
    {
      format: 'subscript',
      type: 'format',
      fullname: 'Subscript'
    }
  ],

  'seperator',
  [
    {
      format: 'table',
      type: 'tooltip',
      fullname: 'Table',
      groupType: 'table',
      premium: true
    },
    {
      format: 'tableconfig',
      type: 'tooltip',
      fullname: 'Table',
      groupType: 'tableconfig',
      group: [
        {
          format: 'tableprops',
          type: 'format',
          fullname: 'Table Settings',
          premium: true
        },
        {
          format: 'tablerowprops',
          type: 'format',
          fullname: 'Table Row Settings',
          premium: true
        },
        {
          format: 'tablesplitcell',
          type: 'format',
          fullname: 'Table Split Cell',
          premium: true
        },
        {
          format: 'tablemergecell',
          type: 'format',
          fullname: 'Table Merge Cell',
          premium: true
        }
      ],
      premium: true
    },

    {
      format: 'tabledelete',
      type: 'format',
      fullname: 'Remove Table',
      premium: true
    }
  ],

  'seperator',
  [
    /*  {
      format: 'filepicker',
      type: 'format',
      fullname: 'Attach file',
      premium: true
    },
    {
      format: 'image',
      type: 'format',
      fullname: 'Image',
      premium: true
    }, */
    {
      format: 'video',
      type: 'format',
      groupType: 'video',
      fullname: 'Video',
      premium: true
    }
  ],

  'seperator',
  [
    {
      format: 'ltr',
      type: 'format',
      fullname: 'Text Direction LTR'
    },
    {
      format: 'rtl',
      type: 'format',
      fullname: 'Text Direction RTL'
    }
  ],
  'seperator',
  [
    {
      format: 'horizontal',
      type: 'format',
      fullname: 'Horizontal Rule'
    },

    {
      format: 'removeformat',
      type: 'format',
      fullname: 'Remove Formatting'
    },
    {
      format: 'magnify',
      type: 'format',
      fullname: 'Search & Replace'
    },
    {
      format: 'settings',
      type: 'settings',
      fullname: 'Editor Settings'
    }
  ]
];
