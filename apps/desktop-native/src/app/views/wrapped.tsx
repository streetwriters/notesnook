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

import { useEffect, useState, type ReactNode } from "react";
import type { NoteStats, WrappedStats } from "@notesnook/core";
import { formatBytes } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import {
  Button,
  Flex,
  Grid,
  ScrollContainer,
  Text,
  useWindowSize,
  type SxProp
} from "@ui";
import { db } from "../common/db";
import { ArrowDown, ArrowLeft, Loading } from "../components/icons";
import { hardNavigate } from "../navigation";
import { Logo } from "../components/navigation-menu/logo";
import { MonthlyActivityHeatmap } from "../components/monthly-activity-heatmap";

function formatNumber(num: number) {
  return num.toLocaleString();
}
function formatCount(num: number) {
  return num > 1000 ? `${(num / 1000).toFixed(0)}k` : num.toString();
}

interface SlideProps {
  children: ReactNode;
  pattern?: "dots" | "grid" | "diagonal" | "none";
  sx?: SxProp;
}

function Slide({ children, sx }: SlideProps) {
  const { height } = useWindowSize();
  return (
    <Flex
      sx={{
        minHeight: height,
        minWidth: "100%",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 4,
        position: "relative"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          ...sx
        }}
      >
        {children}
      </Flex>
    </Flex>
  );
}

function WelcomeSlide({ loading }: { loading: boolean }) {
  return (
    <Slide pattern="dots">
      <Text
        sx={{
          fontSize: 96,
          fontWeight: "bold",
          mb: 3,
          textAlign: "center"
        }}
      >
        🎉
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: [32, 48, 64],
          fontWeight: "bold",
          mb: 2,
          textAlign: "center"
        }}
      >
        {strings.yourYearWrapped(new Date().getFullYear())}
      </Text>

      {loading ? (
        <Loading size={30} color="icon" />
      ) : (
        <>
          <Text
            sx={{
              fontSize: [16, 19.2],
              textAlign: "center"
            }}
          >
            {strings.letsLookBackAtYourYearInNotesnook()}
          </Text>
          <Text
            variant="body"
            sx={{
              mt: 4,
              fontSize: "title",
              color: "paragraph-secondary",
              textAlign: "center"
            }}
          >
            {strings.scrollDownToExplore()}
          </Text>
          <ArrowDown color="paragraph-secondary" sx={{ mt: 2 }} />
        </>
      )}
    </Slide>
  );
}

function TotalNotesSlide({ count }: { count: number }) {
  return (
    <Slide pattern="dots">
      <Flex>
        <Flex sx={{ flexDirection: "column" }}>
          <Text
            variant="body"
            sx={{
              fontSize: [19.2, 24],
              textAlign: "center"
            }}
          >
            {strings.youCreated()}
          </Text>
          <Text
            variant="heading"
            sx={{
              fontSize: [80, 112, 128],
              textAlign: "center",
              color: "accent"
            }}
          >
            {formatNumber(count)}
          </Text>
          <Text
            variant="body"
            sx={{
              fontSize: [19.2, 24],
              textAlign: "center"
            }}
          >
            {strings.notesThisYear()}
          </Text>
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            ml: 5,
            borderLeft: "1px solid",
            borderLeftColor: "border",
            pl: 5
          }}
        >
          <Text
            variant="body"
            sx={{
              fontSize: [19.2, 19.2],
              lineHeight: 1.8
            }}
          >
            {strings.thats()}{" "}
            <Text sx={{ fontWeight: "bold" }}>{formatNumber(count)}</Text>
            {"\n"}
            {strings.wrappedIdeas()}
            {"\n"}
            {strings.wrappedThoughts()}
            {"\n"}
            {strings.wrappedMemories()}
            {"\n"}
            {strings.hundredPercentEncrypted()}
            {"\n"}
            {strings.hundredPercentYours()}
          </Text>
        </Flex>
      </Flex>
    </Slide>
  );
}

const TOTAL_WORDS_TAGLINES = {
  1000: "That's longer than the average blog post on Medium!",
  10000: "That's real commitment to your mindspace.",
  25000: "That's almost the length of a short novel!",
  50000:
    "That's the length of The Great Gatsby if you were F. Scott Fitzgerald.",
  100000: "You wrote more than many published authors this year.",
  250000: "Woah! Your notes could fill a small library.",
  500000: "Your vault is becoming a chronicle.",
  1000000: "That's longer than the entire Harry Potter series!"
};
function TotalWordsSlide({ count }: { count: number }) {
  const tagline = Object.entries(TOTAL_WORDS_TAGLINES)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .find(([threshold]) => count >= Number(threshold))?.[1];
  return (
    <Slide pattern="dots">
      <Text
        variant="body"
        sx={{
          fontSize: [19.2, 24],
          textAlign: "center"
        }}
      >
        {strings.youWroteATotalOf()}
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: [80, 112],
          textAlign: "center",
          color: "accent"
        }}
      >
        {formatNumber(count)}
      </Text>
      <Text
        variant="body"
        sx={{
          fontSize: [19.2, 24],
          textAlign: "center"
        }}
      >
        {strings.wordsThisYear()}
      </Text>
      {tagline ? (
        <Text
          variant="body"
          sx={{
            fontSize: [19.2, 19.2],
            borderTop: "1px solid",
            borderTopColor: "border",
            mt: 3,
            pt: 3
          }}
        >
          {tagline}
        </Text>
      ) : null}
    </Slide>
  );
}

type ActivityStatsSlideProps = {
  mostNotesCreatedInMonth: NoteStats["mostNotesCreatedInMonth"];
  mostNotesCreatedInDay: NoteStats["mostNotesCreatedInDay"];
};

function ActivityStatsSlide({
  mostNotesCreatedInMonth,
  mostNotesCreatedInDay
}: ActivityStatsSlideProps) {
  if (!mostNotesCreatedInMonth && !mostNotesCreatedInDay) return null;

  return (
    <Slide pattern="diagonal" sx={{ alignItems: "flex-start" }}>
      {mostNotesCreatedInMonth && (
        <>
          <Text
            variant="body"
            sx={{
              fontSize: [19.2, 24]
            }}
          >
            {strings.yourMostProductiveMonthWas()}
          </Text>
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}
          >
            <Text
              variant="heading"
              sx={{
                fontSize: [80, 112, 48]
              }}
            >
              {mostNotesCreatedInMonth.month}
            </Text>
            <Text
              variant="body"
              sx={{ fontSize: 16 }}
              color="paragraph-secondary"
            >
              {strings.notes(mostNotesCreatedInMonth.count)}
            </Text>
          </Flex>
        </>
      )}
      {mostNotesCreatedInDay && (
        <>
          <Text
            variant="body"
            sx={{
              fontSize: [19.2, 24],
              mt: 5
            }}
          >
            {strings.yourFavoriteDayToWriteWas()}
          </Text>
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}
          >
            <Text
              variant="heading"
              sx={{
                fontSize: [80, 112, 48]
              }}
            >
              {mostNotesCreatedInDay.day}
            </Text>
            <Text
              variant="body"
              sx={{ fontSize: 16 }}
              color="paragraph-secondary"
            >
              {strings.notes(mostNotesCreatedInDay.count)}
            </Text>
          </Flex>
        </>
      )}
    </Slide>
  );
}

function SummarySlide({ stats }: { stats: WrappedStats }) {
  return (
    <Slide
      pattern="dots"
      sx={{
        bg: "background-secondary",
        border: "1px solid",
        borderColor: "accent",
        borderRadius: "dialog",

        p: 5
      }}
    >
      <Flex sx={{ position: "absolute", bottom: 20, right: 20 }}>
        <Logo size={20} />
      </Flex>
      <Text
        variant="heading"
        sx={{
          fontSize: 19.2,
          fontWeight: 800,
          textAlign: "center",

          letterSpacing: -1,
          mb: 25,
          textDecorationLine: "underline"
        }}
      >
        {strings.notesnookWrappedYear(new Date().getFullYear())}
      </Text>
      <Flex
        sx={{
          flexDirection: ["column", "row"],
          gap: 30,
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            flex: 1
          }}
        >
          <Grid columns={3} sx={{ gap: 4 }}>
            {[
              {
                icon: "📝",
                count: stats.totalNotes,
                label: strings.routes.Notes()
              },
              {
                icon: "🎨",
                count: stats.totalColors,
                label: strings.colors()
              },
              {
                icon: "📚",
                count: stats.totalNotebooks,
                label: strings.routes.Notebooks()
              },
              {
                icon: "🏷️",
                count: stats.totalTags,
                label: strings.routes.Tags()
              },
              {
                icon: "📂",
                count: stats.totalAttachments,
                label: strings.attachments()
              },
              {
                icon: "☁️",
                count: stats.totalMonographs,
                label: strings.routes.Monographs()
              }
            ].map(({ icon, count, label }) => (
              <Flex
                key={label}
                sx={{
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1
                }}
              >
                <Text sx={{ fontSize: 24 }}>{icon}</Text>
                <Text
                  sx={{
                    fontSize: 32,
                    fontWeight: "bold"
                  }}
                >
                  {formatCount(count)}
                </Text>
                <Text sx={{ fontSize: 13.6, color: "paragraph-secondary" }}>
                  {label}
                </Text>
              </Flex>
            ))}
          </Grid>

          <Flex
            sx={{
              flexDirection: "column",
              gap: 2,
              borderTop: "1px solid",
              borderTopColor: "border",
              mt: 6,
              pt: 3
            }}
          >
            <Text sx={{ fontSize: 16, fontWeight: "bold" }}>
              {strings.funFactsOfTheYear()}
            </Text>
            {stats.mostNotesCreatedInMonth && (
              <Text sx={{ fontSize: 14.4, color: "paragraph-secondary" }}>
                {"📅 "}
                {strings.yourMostProductiveMonthWas()}{" "}
                <Text sx={{ color: "accent", fontWeight: "bold" }}>
                  {stats.mostNotesCreatedInMonth.month}
                </Text>
              </Text>
            )}
            {stats.mostNotesCreatedInDay && (
              <Text sx={{ fontSize: 14.4, color: "paragraph-secondary" }}>
                {"🗓️ "}
                {strings.yourFavoriteDayToWriteWas()}{" "}
                <Text sx={{ color: "accent", fontWeight: "bold" }}>
                  {stats.mostNotesCreatedInDay.day}
                </Text>
              </Text>
            )}
            {stats.largestNote && (
              <Text
                sx={{
                  fontSize: 14.4,
                  color: "paragraph-secondary",
                  maxWidth: 340
                }}
              >
                {"📝 "}
                {strings.yourLongestNoteWas()}{" "}
                <Text sx={{ color: "accent", fontWeight: "bold" }}>
                  {strings.wordsCount(stats.largestNote.length)}
                </Text>
              </Text>
            )}
            {stats.largestAttachment && (
              <Text
                sx={{
                  fontSize: 14.4,
                  color: "paragraph-secondary",
                  maxWidth: 340
                }}
              >
                {"🔗 "}
                {strings.yourLargestAttachmentWas()}{" "}
                <Text sx={{ fontWeight: "bold" }}>
                  {formatBytes(stats.largestAttachment.size)}
                </Text>
              </Text>
            )}
          </Flex>
        </Flex>

        <Flex
          sx={{
            flexDirection: "column",
            justifyContent: "flex-start",
            height: "100%",
            flex: 1
          }}
        >
          <Flex
            sx={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Text sx={{ fontSize: 40 }}>✍️</Text>
            <Text
              sx={{
                fontSize: 48,
                fontWeight: "bold",
                color: "accent"
              }}
            >
              {formatNumber(stats.totalWords)}
            </Text>
            <Text sx={{ fontSize: 16, color: "paragraph-secondary" }}>
              {strings.wordsWritten()}
            </Text>
          </Flex>

          <Flex
            sx={{
              flexDirection: "column",
              borderTop: "1px solid",
              borderTopColor: "border",
              mt: 6,
              pt: 2,
              flex: 1
            }}
          >
            <MonthlyActivityHeatmap monthlyStats={stats.monthlyStats} />
            <Text
              sx={{
                fontSize: 16,
                color: "paragraph-secondary",
                textAlign: "center"
              }}
            >
              {strings.notesPerMonth()}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Text
        variant="body"
        sx={{ mt: 2, borderTop: "1px solid", borderTopColor: "border", pt: 2 }}
      >
        {strings.generatedLocallyOnDevice()}
      </Text>
    </Slide>
  );
}

export default function Wrapped() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<WrappedStats>();

  useEffect(() => {
    async function loadWrapped() {
      setLoading(true);
      try {
        const wrapped = await db.wrapped.get();
        setStats(wrapped);
      } finally {
        setLoading(false);
      }
    }
    loadWrapped();
  }, []);

  return (
    <Flex sx={{ flex: 1, bg: "background" }}>
      <ScrollContainer>
        <WelcomeSlide loading={loading} />
        {stats ? (
          <>
            <TotalNotesSlide count={stats.totalNotes} />
            {stats.totalWords > 0 && (
              <TotalWordsSlide count={stats.totalWords} />
            )}
            {(stats.mostNotesCreatedInMonth || stats.mostNotesCreatedInDay) && (
              <ActivityStatsSlide
                mostNotesCreatedInMonth={stats.mostNotesCreatedInMonth}
                mostNotesCreatedInDay={stats.mostNotesCreatedInDay}
              />
            )}
            <SummarySlide stats={stats} />
          </>
        ) : null}
      </ScrollContainer>

      <Button
        onPress={() => hardNavigate("/")}
        variant="secondary"
        sx={{ position: "absolute", top: 3, left: 3, zIndex: 1000 }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: 1,
            justifyContent: "center"
          }}
        >
          <ArrowLeft size={16} color="icon" />
          <Text variant="body">{strings.goBackToApp()}</Text>
        </Flex>
      </Button>
    </Flex>
  );
}
