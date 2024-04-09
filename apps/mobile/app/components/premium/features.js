/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

export const features = [
  {
    title: "Focused on privacy",
    detail:
      "Everything you do in Notesnook stays private. We use XChaCha20-Poly1305-IETF and Argon2 to encrypt your notes.",
    features: [
      {
        highlight: "Zero ads",
        content: "& zero trackers",
        icon: "billboard"
      },
      {
        highlight: "On device",
        content: "encryption",
        icon: "cellphone"
      },
      {
        highlight: "Secure app",
        content: "lock for all",
        icon: "cellphone-lock"
      },
      {
        highlight: "100% end-to-end ",
        content: "encrypted",
        icon: "lock"
      },
      {
        highlight: "Password protected",
        content: "notes sharing",
        icon: "file-lock"
      }
    ]
  },
  {
    title: "No limit on notes or devices",
    detail:
      "Basic or Pro, you can create unlimited number of notes and access them on all your devices. You won't be running out of space or blocks ever."
  },
  {
    title: "Attach files & images",
    detail:
      "Add your documents, PDFs, images and videos, and keep them safe and organized.",
    pro: true,
    features: [
      {
        highlight: "Bullet proof",
        content: "encryption",
        icon: "lock"
      },
      {
        highlight: "High quality",
        content: "4k images",
        icon: "image-multiple"
      },
      {
        highlight: "No monthly",
        content: "storage limit",
        icon: "harddisk"
      },
      {
        highlight: "Generous 500 MB",
        content: "max file size",
        icon: "file-cabinet"
      },
      {
        highlight: "No restriction",
        content: "on file type",
        icon: "file"
      }
    ]
  },
  {
    title: "Cross platform Reminders",
    detail: "Stay updated on all your upcoming tasks with reminders.",
    features: [
      {
        highlight: "One-time",
        content: "reminders",
        icon: "bell"
      },
      {
        highlight: "Daily, weekly & monthly",
        content: "reminders",
        icon: "refresh",
        pro: true
      }
    ]
  },
  {
    title: "Two-factor authentication",
    detail:
      "Improve account security & prevent intruders from accessing your notes",
    info: "* 2FA via email is enabled by default for all users.",
    features: [
      {
        highlight: "Email *",
        icon: "bell"
      },
      {
        highlight: "Authentication",
        content: "app",
        icon: "refresh"
      },
      {
        highlight: "SMS",
        icon: "refresh",
        pro: true
      }
    ]
  },
  {
    title: "Keep secrets always locked with private vault",
    detail:
      "An extra layer of security for any important data. Notes in the vault always stay encrypted and require a password to be accessed or edited everytime.",
    pro: true
  },
  {
    title: "Organize yourself in the best way",
    detail:
      "We offer multiple ways to keep you organized. The only limit is your imagination.",
    features: [
      {
        highlight: "Unlimited",
        content: "notebooks & tags*",
        icon: "emoticon",
        pro: true
      },
      {
        highlight: "Organize",
        content: "with colors",
        icon: "palette",
        pro: true
      },
      {
        highlight: "Side menu",
        content: "shortcuts",
        icon: "link-variant"
      },
      {
        highlight: "Pin note in",
        content: "notifications",
        icon: "pin",
        platform: "android"
      }
    ],
    info: "* Free users are limited to keeping 3 notebooks and 5 tags."
  },

  {
    title: "Instant sync",
    detail:
      "Seamlessly work from anywhere on any device. Every change is synced instantly to all your devices.",
    info: "* Disable sync completely, turn off auto sync or disable editor realtime sync.",
    features: [
      {
        highlight: "Sync to unlimited",
        content: "devices",
        icon: "cellphone"
      },
      {
        highlight: "Realtime",
        content: "editor sync",
        icon: "sync"
      },
      {
        highlight: "Granular sync",
        content: "controls *",
        icon: "sync-off"
      }
    ]
  },
  {
    title: "Rich tools for rich editing",
    detail:
      "Having the right tool at the right time is crucial for note taking. Lists, tables, codeblocks — you name it, we have it.",
    features: [
      {
        highlight: "Basic formatting",
        content: "and lists",
        icon: "format-bold"
      },
      {
        highlight: "Checklists",
        content: "& tables",
        icon: "table",
        pro: true
      },
      {
        highlight: "Markdown",
        content: "support",
        icon: "language-markdown",
        pro: true
      },
      {
        highlight: "Personalized",
        content: "editor toolbar",
        icon: "gesture-tap-button",
        pro: true
      },
      {
        highlight: "Write notes from",
        content: "notifications",
        icon: "bell",
        platform: "android"
      }
    ]
  },
  {
    title: "Safe publishing to the Internet",
    detail:
      "Publishing is nothing new but we offer fully encrypted, anonymous publishing. Take any note & share it with the world.",
    features: [
      {
        highlight: "Password protected",
        content: "sharing",
        icon: "send-lock"
      },
      {
        highlight: "Self destruct",
        content: "monographs",
        icon: "bomb"
      }
    ]
  },
  {
    title: "Export and take your notes anywhere",
    pro: true,
    detail:
      "You own your notes, not us. No proprietary formats. No vendor lock in. No waiting for hours to download your notes.",
    info: "* Free users can export notes in well formatted plain text.",
    features: [
      {
        highlight: "Export as ",
        content: "Markdown",
        icon: "language-markdown",
        pro: true
      },
      {
        highlight: "Export as",
        content: "PDF",
        icon: "file-pdf-box",
        pro: true
      },
      {
        highlight: "Export as",
        content: "HTML",
        icon: "language-html5",
        pro: true
      },
      {
        highlight: "Export as",
        content: "text",
        icon: "clipboard-text-outline"
      }
    ]
  },
  {
    title: "Backup & keep your notes safe",
    detail:
      "Do not worry about losing your data. Turn on automatic backups on weekly or daily basis.",
    features: [
      {
        highlight: "Backup",
        content: "encryption",
        icon: "backup-restore"
      }
    ],
    pro: true
  },
  {
    title: "Personalize & make Notesnook your own",
    detail:
      "Change app themes to match your style. Custom themes are coming soon.",

    features: [
      {
        highlight: "Automatic",
        content: "dark mode",
        icon: "theme-light-dark",
        pro: false
      },
      {
        highlight: "Change accent",
        content: "color",
        icon: "invert-colors",
        pro: true
      }
    ]
  }
];

/**
 * 
      {
        highlight: 'Private vault',
        content: 'for notes',
        icon: 'shield-lock'
      }
 */
