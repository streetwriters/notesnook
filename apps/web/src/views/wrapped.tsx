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

import { Button, Flex, Text } from "@theme-ui/components";
import { db } from "../common/db";
import { useState, useEffect, useRef } from "react";
import { getContentFromData, WrappedStats } from "@notesnook/core";
import { formatBytes } from "@notesnook/common";
import { countWords } from "@notesnook/editor";

async function countTotalWords(noteIds: string[]) {
  let words = 0;
  const parser = new DOMParser();
  for (const noteId of noteIds) {
    const content = await db.content.findByNoteId(noteId);
    if (typeof content?.data !== "string") continue;

    const tiptapContent = await getContentFromData(content.type, content.data);
    const textContent =
      parser.parseFromString(tiptapContent.toHTML(), "text/html").body
        .textContent || "";
    words += countWords(textContent);
  }
  return words;
}

function formatNumber(num: number) {
  return num.toLocaleString();
}

const getMonthName = (month: number): string => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  return months[month - 1] || "Unknown";
};

interface SlideProps {
  children: React.ReactNode;
  pattern?: "dots" | "grid" | "diagonal" | "zigzag" | "none";
}

function Slide({ children, pattern = "none" }: SlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (slideRef.current) {
      observer.observe(slideRef.current);
    }

    return () => {
      if (slideRef.current) {
        observer.unobserve(slideRef.current);
      }
    };
  }, []);

  const getBackgroundPattern = () => {
    switch (pattern) {
      case "dots":
        return "radial-gradient(circle, var(--border) 1px, transparent 1px)";
      case "grid":
        return "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)";
      case "diagonal":
        return "repeating-linear-gradient(-45deg, transparent, transparent 20px, var(--border) 20px, var(--border) 21px)";
      case "zigzag":
        return "repeating-linear-gradient(135deg, transparent, transparent 15px, var(--border) 15px, var(--border) 16px)";
      default:
        return "none";
    }
  };

  const getBackgroundSize = () => {
    switch (pattern) {
      case "dots":
        return "20px 20px";
      case "grid":
        return "30px 30px";
      case "diagonal":
      case "zigzag":
        return "auto";
      default:
        return "auto";
    }
  };

  return (
    <Flex
      ref={slideRef}
      sx={{
        minHeight: "100vh",
        minWidth: "100%",
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 4,
        position: "relative",
        backgroundImage: getBackgroundPattern(),
        backgroundSize: getBackgroundSize(),
        backgroundPosition: "center"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(50px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out"
        }}
      >
        {children}
      </Flex>
    </Flex>
  );
}

function WelcomeSlide() {
  return (
    <Slide pattern="dots">
      <Text
        sx={{
          fontSize: "6rem",
          fontWeight: "bold",
          mb: 3,
          textAlign: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "slideUp 1s ease-out"
        }}
      >
        🎉
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: ["2rem", "3rem", "4rem"],
          fontWeight: "bold",
          mb: 2,
          textAlign: "center",
          animation: "slideUp 1s ease-out 0.2s both"
        }}
      >
        Your 2025 Wrapped
      </Text>
      <Text
        sx={{
          fontSize: ["1rem", "1.2rem"],
          textAlign: "center",
          animation: "fadeIn 1s ease-out 0.4s both"
        }}
      >
        Let's look back at your year in Notesnook
      </Text>
    </Slide>
  );
}

function TotalNotesSlide({ count }: { count: number }) {
  return (
    <Slide pattern="grid">
      <Text
        sx={{
          fontSize: ["1.2rem", "1.5rem"],
          color: "fontTertiary",
          mb: 3,
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out"
        }}
      >
        You created
      </Text>
      <Text
        sx={{
          fontSize: ["5rem", "7rem", "9rem"],
          fontWeight: "bold",
          mb: 2,
          textAlign: "center",
          color: "accent",
          animation: "scaleIn 0.8s ease-out 0.2s both"
        }}
      >
        {formatNumber(count)}
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: ["2rem", "2.5rem"],
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out 0.4s both"
        }}
      >
        notes in 2025
      </Text>
    </Slide>
  );
}

function TotalWordsSlide({ count }: { count: number }) {
  return (
    <Slide pattern="dots">
      <Text
        sx={{
          fontSize: ["1.2rem", "1.5rem"],
          color: "fontTertiary",
          mb: 3,
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out"
        }}
      >
        You wrote a total of
      </Text>
      <Text
        sx={{
          fontSize: ["5rem", "7rem", "9rem"],
          fontWeight: "bold",
          mb: 2,
          textAlign: "center",
          color: "accent",
          animation: "scaleIn 0.8s ease-out 0.2s both"
        }}
      >
        {formatNumber(count)}
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: ["2rem", "2.5rem"],
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out 0.4s both"
        }}
      >
        words
      </Text>
    </Slide>
  );
}

type ActivityStatsSlideProps = {
  mostNotesCreatedInMonth: { month: number; count: number } | null;
  mostNotesCreatedInDay: string | null;
};

function ActivityStatsSlide({
  mostNotesCreatedInMonth,
  mostNotesCreatedInDay
}: ActivityStatsSlideProps) {
  if (!mostNotesCreatedInMonth && !mostNotesCreatedInDay) return null;

  return (
    <Slide pattern="diagonal">
      <Flex
        sx={{
          flexDirection: "column",
          gap: 4,
          width: "100%",
          maxWidth: "600px"
        }}
      >
        {mostNotesCreatedInMonth && (
          <Flex
            sx={{
              flexDirection: "column",
              alignItems: "center",
              animation: "slideUp 0.8s ease-out 0.2s both"
            }}
          >
            <Text
              sx={{
                fontSize: ["1rem", "1.2rem"],
                color: "fontTertiary",
                mb: 2,
                textAlign: "center"
              }}
            >
              Your most productive month is
            </Text>
            <Text
              sx={{
                fontSize: ["2.5rem", "3rem"],
                fontWeight: "bold",
                mb: 1,
                textAlign: "center"
              }}
            >
              {getMonthName(mostNotesCreatedInMonth.month)}
            </Text>
            <Text
              sx={{
                fontSize: ["1.2rem", "1.4rem"],
                color: "accent",
                textAlign: "center"
              }}
            >
              {mostNotesCreatedInMonth.count} notes
            </Text>
          </Flex>
        )}
        {mostNotesCreatedInDay && (
          <Flex
            sx={{
              flexDirection: "column",
              alignItems: "center",
              animation: "slideUp 0.8s ease-out 0.4s both"
            }}
          >
            <Text
              sx={{
                fontSize: ["1rem", "1.2rem"],
                color: "fontTertiary",
                mb: 2,
                textAlign: "center"
              }}
            >
              whereas your favorite day to write is
            </Text>
            <Text
              sx={{
                fontSize: ["2.5rem", "3rem"],
                fontWeight: "bold",
                textAlign: "center"
              }}
            >
              {mostNotesCreatedInDay}s
            </Text>
          </Flex>
        )}
      </Flex>
    </Slide>
  );
}

type MostUsedTagsSlideProps = {
  tags: { id: string; title: string; noteCount: number }[];
  totalTags: number;
};

function MostUsedTagsSlide({ tags, totalTags }: MostUsedTagsSlideProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <Slide pattern="dots">
      <Text
        sx={{
          fontSize: ["1rem", "1.2rem"],
          color: "fontTertiary",
          mb: 3,
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out"
        }}
      >
        You created{" "}
        <Text
          as="span"
          sx={{
            fontWeight: "bold",
            color: "accent",
            fontSize: ["1.5rem", "2rem"]
          }}
        >
          {totalTags}
        </Text>{" "}
        {totalTags === 1 ? "tag" : "tags"}, your favorites
      </Text>
      <Flex
        sx={{
          flexDirection: "column",
          gap: 3,
          alignItems: "center"
        }}
      >
        {tags.map((tag, index) => (
          <Flex
            key={tag.id}
            sx={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
              justifyContent: "space-between",
              animation: `slideUp 0.8s ease-out ${0.2 + index * 0.15}s both`
            }}
          >
            <Text
              sx={{
                fontSize:
                  index === 0
                    ? ["2.5rem", "3.5rem"]
                    : index === 1
                    ? ["2rem", "2.5rem"]
                    : ["1.5rem", "2rem"],
                fontWeight: "bold"
              }}
            >
              #{tag.title}
            </Text>
            <Text
              sx={{
                fontSize: ["0.5rem", "0.8rem"],
                color: "accent"
              }}
            >
              ({tag.noteCount} notes)
            </Text>
          </Flex>
        ))}
      </Flex>
    </Slide>
  );
}

type MostActiveNotebooksSlideProps = {
  notebooks: { id: string; title: string; noteCount: number }[];
  totalNotebooks: number;
};

function MostActiveNotebooksSlide({
  notebooks,
  totalNotebooks
}: MostActiveNotebooksSlideProps) {
  if (!notebooks || notebooks.length === 0) return null;

  return (
    <Slide pattern="zigzag">
      <Text
        sx={{
          fontSize: ["1rem", "1.2rem"],
          color: "fontTertiary",
          mb: 3,
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out"
        }}
      >
        You created{" "}
        <Text
          as="span"
          sx={{
            fontWeight: "bold",
            color: "accent",
            fontSize: ["1.5rem", "2rem"]
          }}
        >
          {totalNotebooks}
        </Text>{" "}
        {totalNotebooks === 1 ? "notebook" : "notebooks"}, your favorites
      </Text>
      <Flex
        sx={{
          flexDirection: "column",
          gap: 3,
          alignItems: "center"
        }}
      >
        {notebooks.map((notebook, index) => (
          <Flex
            key={notebook.id}
            sx={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "center",
              animation: `slideUp 0.8s ease-out ${0.2 + index * 0.1}s both`
            }}
          >
            <Text
              sx={{
                fontSize:
                  index === 0
                    ? ["2.5rem", "3.5rem"]
                    : index === 1
                    ? ["2rem", "2.5rem"]
                    : ["1.5rem", "2rem"],
                fontWeight: "bold"
              }}
            >
              {notebook.title}
            </Text>
            <Text
              sx={{
                fontSize: ["0.5rem", "0.8rem"],
                color: "accent"
              }}
            >
              {notebook.noteCount} notes
            </Text>
          </Flex>
        ))}
      </Flex>
    </Slide>
  );
}

type AttachmentsSlideProps = {
  totalAttachments: number;
  totalStorageUsed: number;
};

function AttachmentsSlide({
  totalAttachments,
  totalStorageUsed
}: AttachmentsSlideProps) {
  return (
    <Slide pattern="dots">
      <Text
        variant="heading"
        sx={{
          fontSize: ["2rem", "2.5rem", "3rem"],
          fontWeight: "bold",
          mb: 2,
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out"
        }}
      >
        Attachments
      </Text>
      <Text
        sx={{
          fontSize: ["4rem", "5rem", "6rem"],
          fontWeight: "bold",
          mb: 2,
          textAlign: "center",
          color: "accent",
          animation: "scaleIn 0.8s ease-out 0.2s both"
        }}
      >
        {formatNumber(totalAttachments)}
      </Text>
      <Text
        sx={{
          fontSize: ["1.2rem", "1.5rem"],
          color: "fontTertiary",
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out 0.4s both"
        }}
      >
        files totaling {formatBytes(totalStorageUsed)}
      </Text>
    </Slide>
  );
}

function SummarySlide({ stats }: { stats: WrappedStatsWithWords }) {
  const cardsRef = useRef<HTMLDivElement>(null);

  return (
    <Slide pattern="grid">
      <Text
        sx={{
          fontSize: ["2rem", "3rem", "4rem"],
          mb: 3,
          textAlign: "center",
          animation: "scaleIn 1s ease-out"
        }}
      >
        ✨
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: ["2rem", "2.5rem", "3rem"],
          fontWeight: "bold",
          mb: 3,
          textAlign: "center",
          animation: "slideUp 1s ease-out 0.2s both"
        }}
      >
        That's a wrap on 2025!
      </Text>
      <Flex
        ref={cardsRef}
        data-cards-container="true"
        sx={{
          flexDirection: "row",
          gap: 3,
          width: "100%",
          maxWidth: "1000px",
          px: 3,
          alignItems: "stretch",
          justifyContent: "center"
        }}
      >
        <Flex
          data-card="true"
          sx={{
            flexDirection: "column",
            height: "370px",
            p: 4,
            borderRadius: "default",
            border: "1px solid",
            borderColor: "border",
            transition: "all 0.3s ease",
            animation: "slideUp 0.8s ease-out 0.1s both",
            background: "background-secondary",
            width: "250px",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
            }
          }}
        >
          <Flex
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 4,
              height: "100%"
            }}
          >
            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1
              }}
            >
              <Text sx={{ fontSize: "1.5rem" }}>📝</Text>
              <Text
                sx={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "accent"
                }}
              >
                {formatNumber(stats.totalNotes)}
              </Text>
              <Text sx={{ fontSize: "0.85rem", color: "fontTertiary" }}>
                Notes
              </Text>
            </Flex>

            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1
              }}
            >
              <Text sx={{ fontSize: "1.5rem" }}>📚</Text>
              <Text
                sx={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "accent"
                }}
              >
                {stats.totalNotebooks}
              </Text>
              <Text sx={{ fontSize: "0.85rem", color: "fontTertiary" }}>
                Notebooks
              </Text>
            </Flex>

            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1
              }}
            >
              <Text sx={{ fontSize: "1.5rem" }}>🏷️</Text>
              <Text
                sx={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "accent"
                }}
              >
                {stats.totalTags}
              </Text>
              <Text sx={{ fontSize: "0.85rem", color: "fontTertiary" }}>
                Tags
              </Text>
            </Flex>

            <Flex
              sx={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1
              }}
            >
              <Text sx={{ fontSize: "1.5rem" }}>📂</Text>
              <Text
                sx={{
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "accent"
                }}
              >
                {formatNumber(stats.totalAttachments)}
              </Text>
              <Text sx={{ fontSize: "0.85rem", color: "fontTertiary" }}>
                Files
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          sx={{
            height: "370px",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 2,
            flex: 1,
            maxWidth: "400px"
          }}
        >
          <Flex
            data-card="true"
            sx={{
              flexGrow: 1,
              flexDirection: "column",
              p: 4,
              borderRadius: "default",
              border: "1px solid",
              borderColor: "border",
              transition: "all 0.3s ease",
              animation: "slideUp 0.8s ease-out 0.2s both",
              justifyContent: "center",
              alignItems: "center",
              background: "background-secondary",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
              }
            }}
          >
            <Text sx={{ fontSize: "2.5rem", mb: 2 }}>✍️</Text>
            <Text
              sx={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "accent",
                mb: 1
              }}
            >
              {formatNumber(stats.totalWords)}
            </Text>
            <Text sx={{ fontSize: "1rem", color: "fontTertiary" }}>
              Words Written
            </Text>
          </Flex>

          {(stats.mostNotesCreatedInMonth || stats.mostNotesCreatedInDay) && (
            <Flex
              data-card="true"
              sx={{
                flexDirection: "column",
                p: 4,
                borderRadius: "default",
                border: "1px solid",
                borderColor: "border",
                transition: "all 0.3s ease",
                animation: "slideUp 0.8s ease-out 0.3s both",
                background: "background-secondary",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
                }
              }}
            >
              <Text
                sx={{
                  fontSize: "1rem",
                  color: "fontTertiary",
                  mb: 3,
                  textAlign: "center"
                }}
              >
                Most Productive
              </Text>
              <Flex sx={{ flexDirection: "column", gap: 3 }}>
                {stats.mostNotesCreatedInMonth && (
                  <Flex
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <Flex sx={{ alignItems: "center", gap: 2 }}>
                      <Text sx={{ fontSize: "1.5rem" }}>📅</Text>
                      <Text sx={{ fontSize: "0.9rem", color: "fontTertiary" }}>
                        Month
                      </Text>
                    </Flex>
                    <Text
                      sx={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "accent"
                      }}
                    >
                      {getMonthName(stats.mostNotesCreatedInMonth.month)}
                    </Text>
                  </Flex>
                )}
                {stats.mostNotesCreatedInDay && (
                  <Flex
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2
                    }}
                  >
                    <Flex sx={{ alignItems: "center", gap: 2 }}>
                      <Text sx={{ fontSize: "1.5rem" }}>🗓️</Text>
                      <Text sx={{ fontSize: "0.9rem", color: "fontTertiary" }}>
                        Day
                      </Text>
                    </Flex>
                    <Text
                      sx={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "accent"
                      }}
                    >
                      {stats.mostNotesCreatedInDay}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Slide>
  );
}

const WrappedPresentation: React.FC<{
  stats: WrappedStatsWithWords;
  onClose: () => void;
}> = ({ stats, onClose }) => {
  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
      <Flex
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: "column",
          overflowY: "scroll",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            display: "none"
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none"
        }}
      >
        <WelcomeSlide />
        <TotalNotesSlide count={stats.totalNotes} />
        {stats.totalWords > 0 && <TotalWordsSlide count={stats.totalWords} />}
        {(stats.mostNotesCreatedInMonth || stats.mostNotesCreatedInDay) && (
          <ActivityStatsSlide
            mostNotesCreatedInMonth={stats.mostNotesCreatedInMonth}
            mostNotesCreatedInDay={stats.mostNotesCreatedInDay}
          />
        )}
        {stats.mostUsedTags && stats.mostUsedTags.length > 0 && (
          <MostUsedTagsSlide
            tags={stats.mostUsedTags}
            totalTags={stats.totalTags}
          />
        )}
        {stats.mostActiveNotebooks && stats.mostActiveNotebooks.length > 0 && (
          <MostActiveNotebooksSlide
            notebooks={stats.mostActiveNotebooks}
            totalNotebooks={stats.totalNotebooks}
          />
        )}
        <AttachmentsSlide
          totalAttachments={stats.totalAttachments}
          totalStorageUsed={stats.totalStorageUsed}
        />
        <SummarySlide stats={stats} />
      </Flex>

      <Button
        onClick={onClose}
        sx={{
          position: "fixed",
          top: 3,
          left: 3,
          bg: "bgSecondary",
          px: 3,
          py: 2,
          borderRadius: "default",
          fontSize: "0.9rem",
          cursor: "pointer",
          zIndex: 1000,
          "&:hover": {
            bg: "hover"
          }
        }}
      >
        ✕ Close
      </Button>
    </>
  );
};

interface WrappedStatsWithWords extends WrappedStats {
  totalWords: number;
}

export default function Wrapped() {
  const [loading, setLoading] = useState(false);
  const [wrapped, setWrapped] = useState<WrappedStatsWithWords | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);

  const loadWrapped = async () => {
    setLoading(true);
    const wrapped = await db.wrapped.get();
    const totalWords = await countTotalWords(wrapped.noteIds);
    setWrapped({ ...wrapped, totalWords });
    console.log("wrapped", { ...wrapped, totalWords });
    setShowPresentation(true);
    setLoading(false);
  };

  if (showPresentation && wrapped) {
    return (
      <WrappedPresentation
        stats={wrapped}
        onClose={() => setShowPresentation(false)}
      />
    );
  }

  return (
    <Flex
      bg="background"
      sx={{
        overflow: "hidden",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <Text
        variant="heading"
        sx={{
          fontSize: ["2rem", "3rem"],
          mb: 4,
          textAlign: "center"
        }}
      >
        Notesnook Wrapped 2025
      </Text>
      <Button
        disabled={loading}
        onClick={loadWrapped}
        sx={{
          px: 4,
          py: 3,
          fontSize: "1.2rem",
          cursor: loading ? "wait" : "pointer"
        }}
      >
        {loading ? "Loading..." : "View Your Wrapped"}
      </Button>
    </Flex>
  );
}
