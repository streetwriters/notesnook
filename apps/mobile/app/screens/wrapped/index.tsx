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

import { formatBytes } from "@notesnook/common";
import { WrappedStats } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Share from "react-native-share";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import ViewShot from "react-native-view-shot";
import { db } from "../../common/database";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";

function formatNumber(num: number) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}
const loadingMessages = [
  "✨ Counting your brilliant thoughts...",
  "📚 Organizing your literary masterpiece...",
  "🧠 Analyzing your genius moments...",
  `⚡ Powering up your ${dayjs().year()} stats...`,
  "🎯 Calculating your productivity score...",
  "🚀 Launching your wrapped experience...",
  "💡 Illuminating your creative output...",
  "📊 Crunching those impressive numbers...",
  "🎨 Painting your year in data...",
  "⭐ Polishing your achievements...",
  "🔥 Compiling your hottest content...",
  "🌟 Gathering your stellar moments...",
  "💫 Materializing your wrapped experience...",
  "🎭 Orchestrating your year in review...",
  "🏆 Tallying your victories...",
  "📈 Graphing your rise to greatness...",
  "🎪 Setting up the grand finale...",
  "🌈 Adding the final touches...",
  "🎬 Rolling the highlight reel...",
  "🎉 Almost ready to celebrate!"
];

// Slide Component
interface SlideProps {
  children: React.ReactNode;
  width: number;
}

function Slide({ children, width }: SlideProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        width,
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {children}
    </View>
  );
}

// Welcome Slide
function WelcomeSlide({ width }: { width: number }) {
  const { colors } = useThemeColors();

  return (
    <Slide width={width}>
      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP
        }}
      >
        <Paragraph
          style={{
            fontSize: 72,
            textAlign: "center",
            marginBottom: 20
          }}
        >
          🎉
        </Paragraph>
        <Heading
          style={{
            fontSize: AppFontSize.xxxl,
            fontWeight: "bold",
            marginBottom: 10,
            textAlign: "center"
          }}
        >
          Your {dayjs().year()} Wrapped
        </Heading>
        <Paragraph
          style={{
            fontSize: AppFontSize.lg,
            textAlign: "center",
            color: colors.secondary.paragraph
          }}
        >
          Let's look back at your year in Notesnook
        </Paragraph>
      </View>
    </Slide>
  );
}

// Total Notes Slide
function TotalNotesSlide({ count, width }: { count: number; width: number }) {
  const { colors } = useThemeColors();

  return (
    <Slide width={width}>
      <Heading
        style={{
          fontSize: AppFontSize.lg,
          textAlign: "center"
        }}
      >
        You created
      </Heading>
      <Heading
        style={{
          fontSize: 80,
          fontWeight: "bold",
          textAlign: "center",
          color: colors.primary.accent
        }}
      >
        {formatNumber(count)}
      </Heading>
      <Heading
        style={{
          fontSize: AppFontSize.lg,
          textAlign: "center"
        }}
      >
        notes this year
      </Heading>

      <View
        style={{
          width: "80%",
          height: 2,
          backgroundColor: colors.primary.border,
          marginVertical: DefaultAppStyles.GAP_VERTICAL * 2,
          alignSelf: "center"
        }}
      />

      <Paragraph
        style={{
          fontSize: AppFontSize.lg,
          color: colors.primary.paragraph,
          textAlign: "center",
          maxWidth: "80%"
        }}
      >
        That's{" "}
        <Heading
          style={{
            fontSize: AppFontSize.lg,
            color: colors.primary.paragraph
          }}
        >
          {formatNumber(count)}
        </Heading>{" "}
        ideas, thoughts, memories. 100% encrypted. 100% yours.
      </Paragraph>
    </Slide>
  );
}

// Total Words Slide
function TotalWordsSlide({ count, width }: { count: number; width: number }) {
  const { colors } = useThemeColors();

  return (
    <Slide width={width}>
      <Paragraph
        style={{
          fontSize: AppFontSize.lg,
          color: colors.primary.paragraph,
          textAlign: "center"
        }}
      >
        You wrote a total of
      </Paragraph>
      <Heading
        style={{
          fontSize: 80,
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center",
          color: colors.primary.accent
        }}
      >
        {formatNumber(count)}
      </Heading>
      <Heading
        style={{
          fontSize: AppFontSize.lg,
          textAlign: "center",
          color: colors.primary.paragraph
        }}
      >
        words this year
      </Heading>

      <View
        style={{
          width: "80%",
          height: 2,
          backgroundColor: colors.primary.border,
          marginVertical: DefaultAppStyles.GAP_VERTICAL * 2,
          alignSelf: "center"
        }}
      />

      <Paragraph
        style={{
          fontSize: AppFontSize.lg,
          color: colors.primary.paragraph,
          textAlign: "center",
          maxWidth: "80%"
        }}
      >
        That's almost the length of a short novel!
      </Paragraph>
    </Slide>
  );
}

// Activity Stats Slide
interface ActivityStatsSlideProps {
  mostNotesCreatedInMonth?: WrappedStats["mostNotesCreatedInMonth"];
  mostNotesCreatedInDay?: WrappedStats["mostNotesCreatedInDay"];
  width: number;
}

function ActivityStatsSlide({
  mostNotesCreatedInMonth,
  mostNotesCreatedInDay,
  width
}: ActivityStatsSlideProps) {
  const { colors } = useThemeColors();

  if (!mostNotesCreatedInMonth && !mostNotesCreatedInDay) return null;

  return (
    <Slide width={width}>
      <View
        style={{
          gap: DefaultAppStyles.GAP_VERTICAL * 2
        }}
      >
        {mostNotesCreatedInMonth && (
          <View style={{}}>
            <Paragraph
              style={{
                fontSize: AppFontSize.lg,
                color: colors.primary.paragraph
              }}
            >
              Your most productive month was
            </Paragraph>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Heading
                style={{
                  fontSize: AppFontSize.xxxl,
                  fontWeight: "bold",
                  textAlign: "center",
                  marginBottom: 5
                }}
              >
                {mostNotesCreatedInMonth.month}
              </Heading>
              <Paragraph
                style={{
                  fontSize: AppFontSize.md,
                  textAlign: "center"
                }}
              >
                {formatNumber(mostNotesCreatedInMonth.count)} notes
              </Paragraph>
            </View>
          </View>
        )}
        {mostNotesCreatedInDay && (
          <View>
            <Paragraph
              style={{
                fontSize: AppFontSize.lg,
                color: colors.primary.paragraph
              }}
            >
              Your favorite day to write was
            </Paragraph>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Heading
                style={{
                  fontSize: AppFontSize.xxxl,
                  fontWeight: "bold",
                  textAlign: "center"
                }}
              >
                {mostNotesCreatedInDay.day}
              </Heading>
              <Paragraph
                style={{
                  fontSize: AppFontSize.md,
                  textAlign: "center"
                }}
              >
                {mostNotesCreatedInDay.count} notes
              </Paragraph>
            </View>
          </View>
        )}
      </View>
    </Slide>
  );
}

// Most Used Tags Slide
interface MostUsedTagsSlideProps {
  tags?: WrappedStats["mostUsedTags"];
  totalTags: WrappedStats["totalTags"];
  width: number;
}

function MostUsedTagsSlide({ tags, totalTags, width }: MostUsedTagsSlideProps) {
  const { colors } = useThemeColors();

  if (!tags || tags.length === 0) return null;

  return (
    <Slide width={width}>
      <Paragraph
        style={{
          fontSize: AppFontSize.md,
          color: colors.secondary.paragraph,
          marginBottom: 20,
          textAlign: "center"
        }}
      >
        You created{" "}
        <Paragraph
          style={{
            fontWeight: "bold",
            color: colors.primary.accent,
            fontSize: AppFontSize.lg
          }}
        >
          {formatNumber(totalTags)}
        </Paragraph>{" "}
        {totalTags === 1 ? "tag" : "tags"}, your favorites
      </Paragraph>
      <View style={{ gap: DefaultAppStyles.GAP_VERTICAL, width: "100%" }}>
        {tags.map((tag, index) => (
          <View
            key={tag.title}
            style={{
              backgroundColor: colors.secondary.background,
              padding: DefaultAppStyles.GAP,
              borderRadius: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <View style={{ flex: 1 }}>
              <Heading
                style={{
                  fontSize: AppFontSize.lg,
                  marginBottom: 5
                }}
              >
                #{tag.title}
              </Heading>
              <Paragraph
                style={{
                  fontSize: AppFontSize.sm,
                  color: colors.secondary.paragraph
                }}
              >
                {formatNumber(tag.noteCount)} notes
              </Paragraph>
            </View>
            <Paragraph
              style={{
                fontSize: AppFontSize.xxxl,
                fontWeight: "bold",
                color: colors.primary.accent
              }}
            >
              {index + 1}
            </Paragraph>
          </View>
        ))}
      </View>
    </Slide>
  );
}

// Most Active Notebooks Slide
interface MostActiveNotebooksSlideProps {
  notebooks?: WrappedStats["mostActiveNotebooks"];
  totalNotebooks: WrappedStats["totalNotebooks"];
  width: number;
}

function MostActiveNotebooksSlide({
  notebooks,
  totalNotebooks,
  width
}: MostActiveNotebooksSlideProps) {
  const { colors } = useThemeColors();

  if (!notebooks || notebooks.length === 0) return null;

  return (
    <Slide width={width}>
      <Paragraph
        style={{
          fontSize: AppFontSize.md,
          color: colors.secondary.paragraph,
          marginBottom: 20,
          textAlign: "center"
        }}
      >
        You created{" "}
        <Paragraph
          style={{
            fontWeight: "bold",
            color: colors.primary.accent,
            fontSize: AppFontSize.lg
          }}
        >
          {formatNumber(totalNotebooks)}
        </Paragraph>{" "}
        {totalNotebooks === 1 ? "notebook" : "notebooks"}, your favorites
      </Paragraph>
      <View style={{ gap: DefaultAppStyles.GAP_VERTICAL, width: "100%" }}>
        {notebooks.map((notebook, index) => (
          <View
            key={notebook.title}
            style={{
              backgroundColor: colors.secondary.background,
              padding: DefaultAppStyles.GAP,
              borderRadius: 10,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <View style={{ flex: 1 }}>
              <Heading
                style={{
                  fontSize: AppFontSize.lg,
                  marginBottom: 5
                }}
              >
                {notebook.title}
              </Heading>
              <Paragraph
                style={{
                  fontSize: AppFontSize.sm,
                  color: colors.secondary.paragraph
                }}
              >
                {formatNumber(notebook.noteCount)} notes
              </Paragraph>
            </View>
            <Paragraph
              style={{
                fontSize: AppFontSize.xxxl,
                fontWeight: "bold",
                color: colors.primary.accent
              }}
            >
              {index + 1}
            </Paragraph>
          </View>
        ))}
      </View>
    </Slide>
  );
}

// Attachments Slide
interface AttachmentsSlideProps {
  totalAttachments: WrappedStats["totalAttachments"];
  totalStorageUsed: WrappedStats["totalStorageUsed"];
  width: number;
}

function AttachmentsSlide({
  totalAttachments,
  totalStorageUsed,
  width
}: AttachmentsSlideProps) {
  const { colors } = useThemeColors();

  return (
    <Slide width={width}>
      <Heading
        style={{
          fontSize: AppFontSize.xxl,
          fontWeight: "bold",
          marginBottom: 20,
          textAlign: "center"
        }}
      >
        Attachments
      </Heading>
      <Heading
        style={{
          fontSize: 80,
          fontWeight: "bold",
          marginBottom: 10,
          textAlign: "center",
          color: colors.primary.accent
        }}
      >
        {formatNumber(totalAttachments)}
      </Heading>
      <Paragraph
        style={{
          fontSize: AppFontSize.lg,
          color: colors.secondary.paragraph,
          textAlign: "center"
        }}
      >
        files totaling {formatBytes(totalStorageUsed)}
      </Paragraph>
    </Slide>
  );
}

const MONTHS_IN_ORDER = [
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

// Summary Slide
function SummarySlide({
  stats,
  width
}: {
  stats: WrappedStats;
  width: number;
}) {
  const { colors } = useThemeColors();
  const viewShotRef = useRef<ViewShot>(null);
  const maxCount = Math.max(...Object.values(stats.monthlyStats), 1);

  return (
    <Slide width={width}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 50,
          maxWidth: 500
        }}
      >
        <ViewShot
          ref={viewShotRef}
          options={{
            fileName: `wrapped-${dayjs().year()}`,
            format: "jpg",
            quality: 1
          }}
        >
          <View
            style={{
              padding: DefaultAppStyles.GAP,
              backgroundColor: colors.primary.background
            }}
          >
            <Heading
              style={{
                fontSize: AppFontSize.xxl,
                fontWeight: "bold",
                marginBottom: 30,
                textAlign: "center",
                marginTop: 30
              }}
            >
              Notesnook Wrapped {dayjs().year()}
            </Heading>
            <View
              style={{
                gap: DefaultAppStyles.GAP_VERTICAL,
                width: "100%"
              }}
            >
              <View
                style={{
                  gap: DefaultAppStyles.GAP_VERTICAL
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 10
                  }}
                >
                  {MONTHS_IN_ORDER.map((item) => (
                    <View
                      key={item}
                      style={{
                        flexGrow: 1,
                        alignItems: "center"
                      }}
                    >
                      <View
                        style={{
                          backgroundColor:
                            stats.monthlyStats[item] === maxCount
                              ? colors.primary.accent
                              : colors.primary.icon,
                          height:
                            maxCount > 0
                              ? (stats.monthlyStats[item] / maxCount) * 100
                              : 0,
                          borderTopLeftRadius: 3,
                          borderTopRightRadius: 3,
                          width: "100%"
                        }}
                      />

                      <Paragraph size={9}>{item.slice(0, 3)}</Paragraph>
                    </View>
                  ))}
                </View>
                <Heading
                  style={{
                    textAlign: "center"
                  }}
                  size={AppFontSize.sm}
                >
                  Notes per month
                </Heading>
              </View>

              {stats.totalWords > 0 && (
                <View
                  style={{
                    backgroundColor: colors.secondary.background,
                    padding: DefaultAppStyles.GAP,
                    borderRadius: 10
                  }}
                >
                  <Paragraph
                    style={{
                      textAlign: "center",
                      fontSize: 40
                    }}
                  >
                    ✍️
                  </Paragraph>
                  <Heading
                    style={{
                      fontSize: AppFontSize.xxxl,
                      fontWeight: "bold",
                      textAlign: "center",
                      color: colors.primary.accent
                    }}
                  >
                    {formatNumber(stats.totalWords)}
                  </Heading>
                  <Paragraph
                    style={{
                      fontSize: AppFontSize.sm,
                      marginBottom: 5,
                      textAlign: "center"
                    }}
                  >
                    Words written
                  </Paragraph>
                </View>
              )}

              <View
                style={{
                  flexWrap: "wrap",
                  flexDirection: "row",
                  gap: 10,
                  justifyContent: "space-between"
                }}
              >
                {[
                  {
                    title: "Notes",
                    count: stats.totalNotes,
                    emoji: "📝"
                  },
                  {
                    title: "Notebooks",
                    count: stats.totalNotebooks,
                    emoji: "📚"
                  },
                  {
                    title: "Files",
                    count: stats.totalAttachments,
                    emoji: "📂"
                  },
                  {
                    title: "Tags",
                    count: stats.totalTags,
                    emoji: "🏷️"
                  },
                  {
                    title: "Monographs",
                    count: stats.totalMonographs,
                    emoji: "☁️"
                  },
                  {
                    title: "Colors",
                    count: stats.totalColors,
                    emoji: "🟡"
                  }
                ].map((item) => (
                  <View
                    key={item.title}
                    style={{
                      backgroundColor: colors.secondary.background,
                      padding: DefaultAppStyles.GAP_SMALL,
                      borderRadius: 10,
                      width: "31%"
                    }}
                  >
                    <Paragraph
                      style={{
                        textAlign: "center",
                        fontSize: AppFontSize.lg
                      }}
                    >
                      {item.emoji}
                    </Paragraph>
                    <Heading
                      style={{
                        fontSize: AppFontSize.xl,
                        fontWeight: "bold",
                        textAlign: "center"
                      }}
                    >
                      {formatNumber(item.count)}
                    </Heading>

                    <Paragraph
                      style={{
                        fontSize: AppFontSize.sm,
                        color: colors.secondary.paragraph,
                        marginBottom: 5,
                        textAlign: "center"
                      }}
                    >
                      {item.title}
                    </Paragraph>
                  </View>
                ))}
              </View>

              <View
                style={{
                  backgroundColor: colors.secondary.background,
                  padding: DefaultAppStyles.GAP,
                  borderRadius: 10,
                  gap: DefaultAppStyles.GAP_VERTICAL
                }}
              >
                <Heading size={AppFontSize.md}>Fun facts of the year</Heading>

                {stats.mostNotesCreatedInMonth && (
                  <View>
                    <Paragraph
                      style={{
                        fontSize: AppFontSize.sm,
                        color: colors.primary.paragraph
                      }}
                    >
                      Your most productive month was{" "}
                      <Heading
                        size={AppFontSize.sm}
                        color={colors.primary.accent}
                      >
                        {stats.mostNotesCreatedInMonth.month}
                      </Heading>
                    </Paragraph>
                  </View>
                )}
                {stats.mostNotesCreatedInDay && (
                  <View>
                    <Paragraph
                      style={{
                        fontSize: AppFontSize.sm,
                        color: colors.primary.paragraph
                      }}
                    >
                      Your favorite day to write was{" "}
                      <Heading
                        size={AppFontSize.sm}
                        color={colors.primary.accent}
                      >
                        {stats.mostNotesCreatedInDay.day}
                      </Heading>
                    </Paragraph>
                  </View>
                )}

                {stats.largestNote && (
                  <View>
                    <Paragraph
                      style={{
                        fontSize: AppFontSize.sm,
                        color: colors.primary.paragraph
                      }}
                    >
                      Your largest note was{" "}
                      <Heading
                        size={AppFontSize.sm}
                        color={colors.primary.accent}
                      >
                        {formatNumber(stats.largestNote.length)} words
                      </Heading>
                    </Paragraph>
                  </View>
                )}

                {stats.largestNote && (
                  <View>
                    <Paragraph
                      style={{
                        fontSize: AppFontSize.sm,
                        color: colors.primary.paragraph
                      }}
                    >
                      Your largest attachment was{" "}
                      <Heading
                        size={AppFontSize.sm}
                        color={colors.primary.accent}
                      >
                        {formatBytes(stats.largestAttachment?.size || 0, 1)}
                      </Heading>
                    </Paragraph>
                  </View>
                )}
              </View>

              <Paragraph
                style={{
                  textAlign: "center",
                  color: colors.secondary.paragraph
                }}
              >
                Generated 100% locally on your device.
              </Paragraph>
            </View>
          </View>
        </ViewShot>

        <Button
          title="Share with friends"
          type="secondaryAccented"
          onPress={async () => {
            const path = await viewShotRef.current?.capture?.();
            console.log(path, "shared path");
            Share.open({
              url: path
            }).catch(() => {});
          }}
          style={{
            width: 200
          }}
        />
      </ScrollView>
    </Slide>
  );
}

// Main Wrapped Component
export const Wrapped = ({ navigation, route }: NavigationProps<"Wrapped">) => {
  const { colors, isDark } = useThemeColors();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [wrapped, setWrapped] = useState<WrappedStats | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const insets = useGlobalSafeAreaInsets();
  const [slides, setSlides] = useState<React.ReactNode[]>([]);

  useNavigationFocus(navigation, { focusOnInit: true });
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setMessageIndex(0);
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    async function loadWrapped() {
      setLoading(true);
      try {
        const wrapped = await db.wrapped.get();
        setWrapped(wrapped);
        setShowPresentation(true);
        setSlides(() => {
          const slides: React.ReactNode[] = [];
          slides.push(<WelcomeSlide key="welcome" width={width} />);
          slides.push(
            <TotalNotesSlide
              key="total-notes"
              count={wrapped.totalNotes}
              width={width}
            />
          );

          if (wrapped.totalWords > 0) {
            slides.push(
              <TotalWordsSlide
                key="total-words"
                count={wrapped.totalWords}
                width={width}
              />
            );
          }

          if (
            wrapped.mostNotesCreatedInMonth ||
            wrapped.mostNotesCreatedInDay
          ) {
            slides.push(
              <ActivityStatsSlide
                key="activity"
                mostNotesCreatedInMonth={wrapped.mostNotesCreatedInMonth}
                mostNotesCreatedInDay={wrapped.mostNotesCreatedInDay}
                width={width}
              />
            );
          }

          // if (wrapped.mostUsedTags && wrapped.mostUsedTags.length > 0) {
          //   slides.push(
          //     <MostUsedTagsSlide
          //       key="tags"
          //       tags={wrapped.mostUsedTags}
          //       totalTags={wrapped.totalTags}
          //       width={width}
          //     />
          //   );
          // }

          // if (wrapped.mostActiveNotebooks && wrapped.mostActiveNotebooks.length > 0) {
          //   slides.push(
          //     <MostActiveNotebooksSlide
          //       key="notebooks"
          //       notebooks={wrapped.mostActiveNotebooks}
          //       totalNotebooks={wrapped.totalNotebooks}
          //       width={width}
          //     />
          //   );
          // }

          // if (wrapped.totalAttachments > 0) {
          //   slides.push(
          //     <AttachmentsSlide
          //       key="attachments"
          //       totalAttachments={wrapped.totalAttachments}
          //       totalStorageUsed={wrapped.totalStorageUsed}
          //       width={width}
          //     />
          //   );
          // }

          slides.push(
            <SummarySlide key="summary" stats={wrapped} width={width} />
          );
          return slides;
        });
      } catch (error) {
        console.error("Error loading wrapped:", error);
      } finally {
        setLoading(false);
      }
    }
    loadWrapped();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.primary.background
      }}
    >
      {showPresentation && wrapped ? (
        <>
          <View
            style={{
              position: "absolute",
              top: insets.top + 5,
              right: DefaultAppStyles.GAP,
              zIndex: 1000
            }}
          >
            <IconButton
              name="close"
              color={colors.primary.icon}
              type="secondary"
              onPress={() => {
                setShowPresentation(false);
                Navigation.goBack();
              }}
            />
          </View>
          <SwiperFlatList
            autoplay={false}
            index={0}
            showPagination={true}
            paginationActiveColor={colors.primary.accent}
            paginationStyleItem={{
              width: 10,
              height: 5,
              marginRight: 4,
              marginLeft: 4
            }}
            paginationDefaultColor={colors.primary.border}
            paginationStyle={{
              marginBottom: insets.bottom + 12,
              backgroundColor: colors.primary.background,
              borderRadius: 100,
              paddingHorizontal: 12,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL,
              alignItems: "center"
            }}
            data={slides}
            renderItem={({ item }) => item}
          />
        </>
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          <View
            style={{
              alignItems: "center",
              gap: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            <ActivityIndicator size="large" color={colors.primary.accent} />
            <Paragraph
              style={{
                fontSize: AppFontSize.lg,
                textAlign: "center",
                color: colors.secondary.paragraph,
                marginTop: 20
              }}
            >
              {loadingMessages[messageIndex]}
            </Paragraph>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
export default Wrapped;
