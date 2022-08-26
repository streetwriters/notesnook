import { Text, Flex, Box } from "rebass";
import * as Icon from "../../icons";

type Feature = {
  title?: string;
  icon?: (props: any) => JSX.Element;
  pro?: boolean;
};

type Section = {
  title: string;
  detail: string;
  columns?: number;
  info?: string;
  pro?: boolean;
  features?: Feature[];
};

const sections: Section[] = [
  {
    title: "Focused on privacy",
    detail:
      "Everything you do in Notesnook stays private. We use XChaCha20-Poly1305-IETF and Argon2 to encrypt your notes.",
    features: [
      {
        title: "Zero ads & zero trackers",
        icon: Icon.Billboard
      },
      {
        title: "On device encryption",
        icon: Icon.Cellphone
      },
      {
        title: "Secure app lock for all",
        icon: Icon.CellphoneLock
      },
      {
        title: "100% end-to-end encrypted",
        icon: Icon.Lock
      },
      {
        title: "Private vault for notes",
        icon: Icon.ShieldLock,
        pro: true
      }
    ]
  },
  {
    title: "Instant syncing",
    detail:
      "Seemlessly work from anywhere. Every change is synced instantly everywhere.",
    pro: true
  },
  {
    title: "100% cross platform",
    detail: "Notesnook is available on all major platforms — for everyone.",
    columns: 8,
    features: [
      {
        icon: Icon.iOS
      },
      {
        icon: Icon.Android
      },
      {
        icon: Icon.Windows
      },
      {
        icon: Icon.Linux
      },
      {
        icon: Icon.MacOS
      },
      {
        icon: Icon.Chrome
      },
      {
        icon: Icon.Firefox
      },
      {
        icon: Icon.Safari
      }
    ]
  },
  {
    title: "Attach files & images",
    detail:
      "Add your documents, PDFs, images and videos, and keep them safe and organized.",
    pro: true,
    features: [
      {
        title: "Bulletproof encryption",
        icon: Icon.Lock
      },
      {
        title: "High quality 4K images",
        icon: Icon.ImageMultiple
      },
      {
        title: "Unlimited storage",
        icon: Icon.Harddisk
      },
      {
        title: "Upto 500 MB per file",
        icon: Icon.FileCabinet
      },
      {
        title: "All file types supported",
        icon: Icon.File
      }
    ]
  },
  {
    title: "No limit on notes",
    detail:
      "We don't have nonsense like blocks and whatnot. You can create as many notes as you want — no limits."
  },
  {
    title: "Safe publishing to the Internet",
    detail:
      "Publishing is nothing new but we offer fully encrypted, anonymous publishing. Take any note & share it with the world.",
    features: [
      {
        title: "Anonymous publishing",
        icon: Icon.Anonymous
      },
      {
        title: "Password protection",
        icon: Icon.CloudLock
      },
      {
        title: "Self destructable notes",
        icon: Icon.Timebomb
      }
    ]
  },
  {
    title: "Organize yourself in the best way",
    detail:
      "We offer multiple ways to keep you organized. The only limit is your imagination.",
    features: [
      {
        title: "Unlimited notebooks*",
        icon: Icon.Notebook2,
        pro: true
      },
      {
        title: "Colors & tags*",
        icon: Icon.Palette,
        pro: true
      },
      {
        title: "Side menu shortcuts",
        icon: Icon.Shortcut
      },
      {
        title: "Pins & favorites",
        icon: Icon.Pin
      }
    ],
    info: "* Free users can only create 3 notebooks (no limit on topics) and 5 tags."
  },

  {
    title: "Rich tools for rich editing",
    detail:
      "Having the right tool at the right time is crucial for note taking. Lists, tables, codeblocks — you name it, we have it.",
    pro: true,
    features: [
      {
        title: "Lists & tables",
        icon: Icon.Table
      },
      {
        title: "Images & embeds",
        icon: Icon.Embed
      },
      {
        title: "Checklists",
        icon: Icon.CheckCircleOutline
      },
      {
        title: "Markdown shortcuts",
        icon: Icon.Markdown
      }
    ]
  },
  {
    title: "Export and take your notes anywhere",
    detail:
      "You own your notes, not us. No proprietary formats. No vendor lock in. No waiting for hours to download your notes.",
    // info: "* Free users can export notes in well formatted plain text.",
    features: [
      {
        title: "Export as Markdown",
        icon: Icon.Markdown,
        pro: true
      },
      {
        title: "Export as PDF",
        icon: Icon.PDF,
        pro: true
      },
      {
        title: "Export as HTML",
        icon: Icon.HTML,
        pro: true
      },
      {
        title: "Export as text",
        icon: Icon.Text
      },
      {
        title: "Bulk exports",
        icon: Icon.Export
      }
    ]
  },
  {
    title: "Backup & keep your notes safe",
    detail:
      "Do not worry about losing your data. Turn on automatic backups on weekly or daily basis.",
    features: [
      {
        title: "Automatic monthly, weekly & daily backups",
        icon: Icon.Backup,
        pro: true
      },
      {
        title: "Backup encryption",
        icon: Icon.EncryptedBackup,
        pro: true
      }
    ]
  },
  {
    title: "Personalize & make Notesnook your own",
    detail:
      "Change app themes to match your style. Custom themes are coming soon.",
    pro: true,
    features: [
      {
        title: "10+ themes",
        icon: Icon.Accent
      },
      {
        title: "Automatic dark mode",
        icon: Icon.Theme
      },
      {
        title: "Change default home page",
        icon: Icon.Home
      }
    ]
  }
];

export function Features() {
  return (
    <Flex
      flexDirection="column"
      flex={1}
      overflowY={["hidden", "hidden", "auto"]}
      flexShrink={0}
      sx={{ position: "relative" }}
      pt={6}
      bg="background"
    >
      {sections.map((section) => (
        <Flex flexDirection="column" px={6} pb={50}>
          {section.pro && (
            <Flex
              bg="bgSecondary"
              alignSelf="start"
              px={2}
              py="2px"
              sx={{ borderRadius: 50 }}
              mb={1}
            >
              <Icon.Pro color="primary" size={16} />
              <Text variant="body" color="primary" ml={"2px"}>
                Pro
              </Text>
            </Flex>
          )}
          <Text variant="body" fontSize={"1.3rem"}>
            {section.title}
          </Text>
          <Text variant="body" mt={1} fontSize="title" color="fontTertiary">
            {section.detail}
          </Text>
          {section.features && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: section.columns
                  ? "1fr ".repeat(section.columns)
                  : "1fr 1fr 1fr",
                gap: 3
              }}
              mt={4}
            >
              {section.features.map((feature) => (
                <Flex alignItems="start" flexDirection="column">
                  {feature.icon && (
                    <feature.icon size={20} color="text" sx={{ mb: 1 }} />
                  )}
                  {feature.pro && (
                    <Flex justifyContent="center" alignItems="center">
                      <Icon.Pro color="primary" size={14} />
                      <Text variant="subBody" color="primary" ml={"2px"}>
                        Pro
                      </Text>
                    </Flex>
                  )}
                  {feature.title && (
                    <Text variant="body" fontSize="subtitle">
                      {feature.title}
                    </Text>
                  )}
                </Flex>
              ))}
            </Box>
          )}
          {section.info && (
            <Text mt={1} variant="subBody">
              {section.info}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  );
}
