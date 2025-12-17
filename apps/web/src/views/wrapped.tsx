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

import { Button, Flex, Text, Box, FlexProps } from "@theme-ui/components";
import { db } from "../common/db";
import { useState, useEffect, useRef } from "react";
import { NoteStats, WrappedStats } from "@notesnook/core";
import { formatBytes } from "@notesnook/common";
import { ArrowDown, ArrowLeft, Loading } from "../components/icons";
import { hardNavigate } from "../navigation";
import { MonthlyActivityHeatmap } from "../components/monthly-activity-heatmap";

function formatNumber(num: number) {
  return num.toLocaleString();
}
function formatCount(num: number) {
  return num > 1000 ? `${(num / 1000).toFixed(0)}k` : num.toString();
}

interface SlideProps {
  children: React.ReactNode;
  pattern?: "dots" | "grid" | "diagonal" | "none";
}

function Slide({
  children,
  pattern = "none",
  sx,
  ...flexProps
}: SlideProps & FlexProps) {
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
        {...flexProps}
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(50px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
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
        Your {new Date().getFullYear()} Wrapped
      </Text>

      {loading ? (
        <Loading
          sx={{
            animation: "fadeIn 1s ease-out 0.4s both"
          }}
          size={30}
        />
      ) : (
        <>
          <Text
            sx={{
              fontSize: ["1rem", "1.2rem"],
              textAlign: "center",
              animation: "fadeIn 1s ease-out 0.4s both"
            }}
          >
            Let&apos;s look back at your year in Notesnook
          </Text>
          <Text
            variant="body"
            sx={{
              mt: 4,
              fontSize: "title",
              color: "paragraph-secondary",
              textAlign: "center",
              animation: "fadeIn 1s ease-out 0.4s both"
            }}
          >
            Scroll down to explore
          </Text>
          <ArrowDown sx={{ mt: 2 }} color="paragraph-secondary" />
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
              fontSize: ["1.2rem", "1.5rem"],
              textAlign: "center",
              animation: "fadeIn 0.8s ease-out"
            }}
          >
            You created
          </Text>
          <Text
            variant="heading"
            sx={{
              fontSize: ["5rem", "7rem", "8rem"],
              textAlign: "center",
              color: "accent",
              animation: "scaleIn 0.8s ease-out 0.2s both"
            }}
          >
            {formatNumber(count)}
          </Text>
          <Text
            variant="body"
            sx={{
              fontSize: ["1.2rem", "1.5rem"],
              textAlign: "center",
              animation: "fadeIn 0.8s ease-out 0.4s both"
            }}
          >
            notes this year
          </Text>
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            ml: [0, 5],
            mt: [4, 0],
            borderLeft: ["none", "1px solid var(--border)"],
            pl: [0, 5],
            borderTop: ["1px solid var(--border)", "none"]
          }}
        >
          <Text
            variant="body"
            color="paragraph-secondary"
            sx={{
              fontSize: ["1.2rem", "1.2rem"],
              animation: "fadeIn 0.8s ease-out",
              lineHeight: 1.8
            }}
          >
            That&apos;s <strong>{formatNumber(count)}</strong>
            <br />
            ideas
            <br />
            thoughts
            <br />
            memories.
            <br />
            100% encrypted.
            <br />
            100% yours.
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
          fontSize: ["1.2rem", "1.5rem"],
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out"
        }}
      >
        You wrote a total of
      </Text>
      <Text
        variant="heading"
        sx={{
          fontSize: ["5rem", "7rem"],
          textAlign: "center",
          color: "accent",
          animation: "scaleIn 0.8s ease-out 0.2s both"
        }}
      >
        {formatNumber(count)}
      </Text>
      <Text
        variant="body"
        sx={{
          fontSize: ["1.2rem", "1.5rem"],
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out 0.4s both"
        }}
      >
        words this year
      </Text>
      {tagline ? (
        <Text
          variant="body"
          color="paragraph-secondary"
          sx={{
            fontSize: ["1.2rem", "1.2rem"],
            animation: "fadeIn 0.8s ease-out",
            borderTop: "1px solid var(--border)",
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
    <Slide pattern="diagonal" sx={{ alignItems: "start" }}>
      {mostNotesCreatedInMonth && (
        <>
          <Text
            variant="body"
            sx={{
              fontSize: ["1.2rem", "1.5rem"]
            }}
          >
            Your most productive month was
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
                fontSize: ["5rem", "7rem", "3rem"]
              }}
            >
              {mostNotesCreatedInMonth.month}
            </Text>
            <Text
              variant="body"
              sx={{ fontSize: "1rem" }}
              color="paragraph-secondary"
            >
              {formatNumber(mostNotesCreatedInMonth.count)} notes
            </Text>
          </Flex>
        </>
      )}
      {mostNotesCreatedInDay && (
        <>
          <Text
            variant="body"
            sx={{
              fontSize: ["1.2rem", "1.5rem"],
              mt: 5
            }}
          >
            Your favorite day to write was
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
                fontSize: ["5rem", "7rem", "3rem"]
              }}
            >
              {mostNotesCreatedInDay.day}
            </Text>
            <Text
              variant="body"
              sx={{ fontSize: "1rem" }}
              color="paragraph-secondary"
            >
              {formatNumber(mostNotesCreatedInDay.count)} notes
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
        border: "1px solid var(--accent)",
        borderRadius: "dialog",
        boxShadow: "-15px 15px 0px 0px var(--accent)",
        p: 5
      }}
    >
      <svg
        style={{
          height: 20,
          width: 20,
          position: "absolute",
          bottom: "20px",
          right: "20px"
        }}
      >
        <use href="#themed-logo" />
      </svg>
      <Text
        variant="heading"
        sx={{
          fontSize: "1.2rem",
          fontWeight: 800,
          textAlign: "center",
          transform: "skew(-10deg) scaleX(1.5)",
          letterSpacing: "-1px",
          mb: "25px",
          textDecorationLine: "underline",
          textDecorationColor: "border"
        }}
      >
        NOTESNOOK WRAPPED {new Date().getFullYear()}
      </Text>
      <Flex
        sx={{
          flexDirection: ["column", "row"],
          gap: "30px",
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: 4,
              height: "100%"
            }}
          >
            {[
              {
                icon: "📝",
                count: stats.totalNotes,
                label: "Notes"
              },
              {
                icon: "🎨",
                count: stats.totalColors,
                label: "Colors"
              },
              {
                icon: "📚",
                count: stats.totalNotebooks,
                label: "Notebooks"
              },
              {
                icon: "🏷️",
                count: stats.totalTags,
                label: "Tags"
              },
              {
                icon: "📂",
                count: stats.totalAttachments,
                label: "Files"
              },
              {
                icon: "☁️",
                count: stats.totalMonographs,
                label: "Monographs"
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
                <Text sx={{ fontSize: "1.5rem" }}>{icon}</Text>
                <Text
                  sx={{
                    fontSize: "2rem",
                    fontWeight: "bold"
                  }}
                >
                  {formatCount(count)}
                </Text>
                <Text sx={{ fontSize: "0.85rem", color: "fontTertiary" }}>
                  {label}
                </Text>
              </Flex>
            ))}
          </Box>

          <Flex
            sx={{
              flexDirection: "column",
              gap: 2,
              borderTop: "1px solid var(--border)",
              mt: 6,
              pt: 3,
              "& strong": {
                color: "accent"
              }
            }}
          >
            <Text sx={{ fontSize: "1rem", fontWeight: "bold" }}>
              Fun facts of the year
            </Text>
            {stats.mostNotesCreatedInMonth && (
              <Text sx={{ fontSize: "0.9rem", color: "fontTertiary" }}>
                📅 Your most productive month was{" "}
                <Text as="strong">{stats.mostNotesCreatedInMonth.month}</Text>
              </Text>
            )}
            {stats.mostNotesCreatedInDay && (
              <Text sx={{ fontSize: "0.9rem", color: "fontTertiary" }}>
                🗓️ Your favorite day to write was{" "}
                <Text as="strong">{stats.mostNotesCreatedInDay.day}</Text>
              </Text>
            )}
            {stats.largestNote && (
              <Text
                sx={{
                  fontSize: "0.9rem",
                  color: "fontTertiary",
                  maxWidth: 340
                }}
              >
                📝 Your longest note was{" "}
                <Text as="strong">
                  {formatNumber(stats.largestNote.length)}
                  {" words"}
                </Text>
              </Text>
            )}
            {stats.largestAttachment && (
              <Text
                sx={{
                  fontSize: "0.9rem",
                  color: "fontTertiary",
                  maxWidth: 340
                }}
              >
                🔗 Your largest attachment was{" "}
                <strong>{formatBytes(stats.largestAttachment.size)}</strong>
              </Text>
            )}
          </Flex>
        </Flex>

        <Flex
          sx={{
            flexDirection: "column",
            justifyContent: "stretch",
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
            <Text sx={{ fontSize: "2.5rem" }}>✍️</Text>
            <Text
              sx={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "accent"
              }}
            >
              {formatNumber(stats.totalWords)}
            </Text>
            <Text sx={{ fontSize: "1rem", color: "fontTertiary" }}>
              Words Written
            </Text>
          </Flex>

          <Flex
            sx={{
              flexDirection: "column",
              borderTop: "1px solid var(--border)",
              mt: 6,
              pt: 2,
              flex: 1
            }}
          >
            <MonthlyActivityHeatmap monthlyStats={stats.monthlyStats} />
            <Text
              sx={{
                fontSize: "1rem",
                color: "fontTertiary",
                textAlign: "center"
              }}
            >
              Notes per month
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Text
        variant="body"
        color="paragraph-secondary"
        sx={{ mt: 2, borderTop: "1px solid var(--border)", pt: 2 }}
      >
        Generated 100% locally on your device.
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
        console.time("wrapped - getting from core");
        const wrapped = await db.wrapped.get();
        console.timeEnd("wrapped - getting from core");
        setStats(wrapped);
      } finally {
        setLoading(false);
      }
    }
    loadWrapped();
  }, []);

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
      </Flex>

      <Button
        onClick={() => hardNavigate("/")}
        variant="secondary"
        sx={{
          position: "fixed",
          top: 3,
          left: 3,
          zIndex: 1000
        }}
      >
        <Flex sx={{ alignItems: "center", gap: 1, justifyContent: "center" }}>
          <ArrowLeft size={16} />
          <Text variant="body">Go back to app</Text>
        </Flex>
      </Button>
    </>
  );
}
