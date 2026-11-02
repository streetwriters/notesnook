/**
 * Help site navigation.
 *
 * A page that is not listed here is unreachable from the sidebar, so every new
 * article needs an entry. `link` values are extensionless and root-absolute —
 * they mirror the file path under `contents/`, which is also the public URL.
 */
export const sidebar = [
  {
    text: "Getting started",
    collapsed: false,
    items: [
      { text: "All help topics", link: "/docs" },
      { text: "Create your first note", link: "/create-a-note-in-notesnook" },
      { text: "Search & navigation", link: "/search-and-navigation" },
      { text: "Keyboard shortcuts", link: "/keyboard-shortcuts" },
      { text: "Plans & limits", link: "/plans-and-limits" }
    ]
  },
  {
    text: "Organizing notes",
    collapsed: false,
    items: [
      {
        text: "Notebooks",
        link: "/organizing-notes/organize-notes-using-notebooks"
      },
      { text: "Tags", link: "/organizing-notes/organize-notes-using-tags" },
      { text: "Colors", link: "/organizing-notes/organize-notes-using-colors" },
      {
        text: "Favorites",
        link: "/organizing-notes/organize-notes-using-favorites"
      },
      { text: "Pins", link: "/organizing-notes/pin-notes" },
      { text: "Archive", link: "/organizing-notes/archive-notes" },
      {
        text: "Side menu shortcuts",
        link: "/organizing-notes/side-menu-shortcuts"
      },
      { text: "Reminders", link: "/reminders" }
    ]
  },
  {
    text: "Working with notes",
    collapsed: false,
    items: [
      { text: "Note actions", link: "/notes/note-actions" },
      { text: "Note links", link: "/note-links-and-backlinks" },
      { text: "Expiring notes", link: "/notes/note-expiry" },
      { text: "Version history", link: "/note-version-history" },
      { text: "Trash", link: "/trash" }
    ]
  },
  {
    text: "Editor",
    collapsed: false,
    items: [
      {
        text: "Editor toolbar",
        link: "/rich-text-editor/rich-text-editor-toolbar"
      },
      { text: "Tabs & panes", link: "/rich-text-editor/editor-tabs-and-panes" },
      {
        text: "Personalizing the editor",
        link: "/rich-text-editor/personalizing-rich-text-editor"
      },
      {
        text: "Markdown shortcuts",
        link: "/rich-text-editor/markdown-notes-editing"
      },
      {
        text: "Headings",
        link: "/rich-text-editor/headings-and-collapsible-sections"
      },
      { text: "Tables", link: "/rich-text-editor/tables" },
      { text: "Task lists", link: "/rich-text-editor/task-and-todo-lists" },
      { text: "Outline lists", link: "/rich-text-editor/outline-lists" },
      { text: "Callouts", link: "/rich-text-editor/callouts" },
      { text: "Code blocks", link: "/rich-text-editor/code-blocks" },
      { text: "Math & formulas", link: "/rich-text-editor/math-and-formulas" },
      {
        text: "Images & embeds",
        link: "/rich-text-editor/images-attachments-and-embeds"
      },
      { text: "Find & replace", link: "/rich-text-editor/search-and-replace" }
    ]
  },
  {
    text: "Importing notes",
    collapsed: false,
    items: [
      { text: "Overview", link: "/importing-notes/" },
      { text: "Evernote", link: "/importing-notes/import-notes-from-evernote" },
      {
        text: "Google Keep",
        link: "/importing-notes/import-notes-from-googlekeep"
      },
      { text: "Joplin", link: "/importing-notes/import-notes-from-joplin" },
      { text: "Obsidian", link: "/importing-notes/import-notes-from-obsidian" },
      {
        text: "Simplenote",
        link: "/importing-notes/import-notes-from-simplenote"
      },
      // Standard Notes is unpublished for now; the page is excluded from the
      // build in config.mts. Restore this entry when it goes live again.
      // {
      //   text: "Standard Notes",
      //   link: "/importing-notes/import-notes-from-standardnotes"
      // },
      {
        text: "ColorNote",
        link: "/importing-notes/import-notes-from-colornote"
      },
      { text: "UpNote", link: "/importing-notes/import-notes-from-upnote" },
      {
        text: "Skiff Pages",
        link: "/importing-notes/import-notes-from-skiff-pages"
      },
      {
        text: "Zoho Notebook",
        link: "/importing-notes/import-notes-from-zoho-notebook"
      },
      {
        text: "Fusebase (Nimbus Note)",
        link: "/importing-notes/import-notes-from-fusebase"
      },
      {
        text: "Markdown files",
        link: "/importing-notes/import-notes-from-markdown-files"
      },
      {
        text: "HTML files",
        link: "/importing-notes/import-notes-from-html-files"
      },
      {
        text: "Plaintext files",
        link: "/importing-notes/import-notes-from-plaintext-files"
      },
      {
        text: "TextBundle files",
        link: "/importing-notes/import-notes-from-textbundle-files"
      }
    ]
  },
  {
    text: "Backup & export",
    collapsed: false,
    items: [
      {
        text: "Backup and restore",
        link: "/backup-and-restore-notes-in-notesnook"
      },
      { text: "Exporting notes", link: "/export-notes-from-notesnook" },
      { text: "Attachments & files", link: "/attachments-and-files" }
    ]
  },
  {
    text: "Sync",
    collapsed: false,
    items: [
      { text: "How sync works", link: "/sync/how-sync-works" },
      { text: "Sync settings", link: "/sync/sync-settings" },
      { text: "Troubleshooting sync", link: "/sync/troubleshooting-sync" }
    ]
  },
  {
    text: "Privacy & security",
    collapsed: false,
    items: [
      { text: "How is my data encrypted?", link: "/how-is-my-data-encrypted" },
      { text: "Private vault", link: "/lock-notes-with-private-vault" },
      { text: "App lock", link: "/app-lock" },
      { text: "Two-factor authentication", link: "/two-factor-authentication" },
      { text: "Privacy mode", link: "/privacy-mode" }
    ]
  },
  {
    text: "Publishing",
    collapsed: false,
    items: [{ text: "Monographs", link: "/publish-notes-with-monographs" }]
  },
  {
    text: "Web clipper",
    collapsed: false,
    items: [
      { text: "Installation", link: "/web-clipper/installation" },
      {
        text: "Clipping your first page",
        link: "/web-clipper/clipping-your-first-web-page-with-web-clipper"
      },
      { text: "Troubleshooting", link: "/web-clipper/troubleshooting" }
    ]
  },
  {
    text: "Mobile",
    collapsed: false,
    items: [
      {
        text: "Home screen widgets",
        link: "/mobile-integration/home-screen-widgets"
      },
      {
        text: "Android quick actions",
        link: "/mobile-integration/android-quick-actions"
      },
      {
        text: "Pin to notifications",
        link: "/mobile-integration/pin-notes-to-notifications"
      },
      {
        text: "Quick notes",
        link: "/mobile-integration/quick-note-from-notification"
      },
      {
        text: "Share from other apps",
        link: "/mobile-integration/share-things-from-other-apps"
      }
    ]
  },
  {
    text: "Desktop",
    collapsed: false,
    items: [
      {
        text: "Auto start",
        link: "/desktop-integration/auto-start-on-system-startup"
      },
      {
        text: "System tray menu",
        link: "/desktop-integration/system-tray-menu"
      },
      {
        text: "Jumplist & dock menu",
        link: "/desktop-integration/jumplist-and-dock-menu"
      },
      { text: "Spell checker", link: "/desktop-integration/spell-checker" },
      {
        text: "Updates & advanced",
        link: "/desktop-integration/updates-and-advanced-settings"
      }
    ]
  },
  {
    text: "Appearance & themes",
    collapsed: false,
    items: [
      { text: "Customizing the app", link: "/customizing-notesnook" },
      {
        text: "Using themes",
        link: "/custom-themes/using-themes",
        items: [
          { text: "How themes work", link: "/custom-themes/introduction" },
          {
            text: "Theme Builder",
            link: "/custom-themes/create-a-theme-with-theme-builder"
          },
          {
            text: "Install from file",
            link: "/custom-themes/install-a-theme-from-file"
          },
          {
            text: "Publish a new theme",
            link: "/custom-themes/publish-a-theme"
          }
        ]
      }
    ]
  },
  {
    text: "Your account",
    collapsed: false,
    items: [
      { text: "Account settings", link: "/account-settings" },
      { text: "Notesnook Circle", link: "/notesnook-circle" },
      { text: "Recovering your account", link: "/recovering-your-account" },
      { text: "Deleting your account", link: "/deleting-your-account" },
      { text: "Gift cards", link: "/gift-cards" },
      { text: "Notesnook Wrapped", link: "/notesnook-wrapped" }
    ]
  },
  {
    text: "Advanced",
    collapsed: false,
    items: [
      {
        text: "Inbox API",
        items: [
          {
            text: "Getting started",
            link: "/inbox-api/getting-started"
          },
          {
            text: "Self-hosting the Inbox API",
            link: "/inbox-api/self-hosting-inbox-api"
          }
        ]
      }
      // { text: "Self-hosting Notesnook", link: "/self-hosting" }
    ]
  },
  {
    text: "FAQs",
    collapsed: false,
    items: [
      {
        text: "What are merge conflicts?",
        link: "/faqs/what-are-merge-conflicts"
      },
      { text: "Is there an ETA for X feature?", link: "/faqs/is-there-an-eta" },
      {
        text: "Why login is needed to upload attachments",
        link: "/faqs/login-to-upload-attachments"
      },
      {
        text: "Why login is needed to restore attachments",
        link: "/faqs/login-to-restore-attachments-in-backup"
      }
    ]
  }
];
