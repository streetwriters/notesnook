import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TrackedState, useTracked } from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import { getElevation } from '../../utils';
import { eOpenAddNotebookDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import useRotator from '../../utils/use-rotator';
import { PinItem } from '../Menu/TagsSection';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export type TStep = {
  text: string;
  walkthroughItem: (colors: TrackedState['colors']) => React.ReactNode;
  title: string;
  button?: {
    type: 'next' | 'done';
    title: string;
    action?: () => void;
  };
};

const NotebookWelcome = () => {
  const [state] = useTracked();
  const { colors } = state;
  const data = useRotator([
    {
      title: 'Work and office',
      description: 'Everything related to my job',
      count: 2
    },
    {
      title: 'School work',
      description: "I don't like doing this but I have to.",
      count: 5
    },
    {
      title: 'Recipies',
      description: 'I love cooking and collecting recipies',
      count: 10
    }
  ]);

  return (
    <View
      style={{
        width: '100%',
        padding: 12,
        backgroundColor: colors.nav,
        borderRadius: 10
      }}
    >
      <View
        style={{
          padding: 12,
          width: '100%',
          backgroundColor: colors.bg,
          ...getElevation(3),
          borderRadius: 10,
          marginVertical: 12
        }}
      >
        <Heading size={SIZE.md} color={colors.heading}>
          {data?.title}
        </Heading>
        <Paragraph>{data?.description}</Paragraph>

        <Paragraph
          style={{
            marginTop: 5
          }}
          size={SIZE.xs}
          color={colors.icon}
        >
          Notebook - {data?.count} notes
        </Paragraph>
      </View>
    </View>
  );
};

const notebooks: { id: string; steps: TStep[] } = {
  id: 'notebooks',
  steps: [
    {
      title: 'Notebooks',
      text: 'Boost your productivity with Notebooks and organize your notes.',
      walkthroughItem: () => <NotebookWelcome />,
      button: {
        type: 'next',
        title: 'Next'
      }
    },
    {
      title: 'Notebook > Topic > Notes',
      text: 'Every Notebook has various topics which are like sections that hold all your notes.',
      walkthroughItem: (colors: TrackedState['colors']) => (
        <View
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: colors.nav,
            borderRadius: 10
          }}
        >
          <View
            style={{
              padding: 12,
              width: '100%',
              backgroundColor: colors.bg,
              ...getElevation(3),
              borderRadius: 10,
              marginVertical: 12
            }}
          >
            <Heading size={SIZE.md} color={colors.heading}>
              Work and office
            </Heading>
            <Paragraph>Everything related to my job in one place.</Paragraph>

            <Paragraph
              style={{
                marginTop: 5
              }}
              size={SIZE.xs}
              color={colors.icon}
            >
              Notebook - 2 notes
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: '90%',
              backgroundColor: colors.bg,
              borderRadius: 10,
              alignSelf: 'flex-end',
              marginBottom: 10
            }}
          >
            <Paragraph color={colors.accent}>
              <Icon color={colors.accent} size={SIZE.sm} name="bookmark" /> Tasks
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              paddingVertical: 12,
              width: '80%',
              backgroundColor: colors.bg,
              borderRadius: 5,
              alignSelf: 'flex-end',
              marginBottom: 10
            }}
          >
            <Paragraph size={SIZE.xs}>
              <Icon color={colors.icon} size={SIZE.sm} name="note" /> Feburary 2022 Week 2
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: '80%',
              backgroundColor: colors.bg,
              borderRadius: 5,
              paddingVertical: 12,
              alignSelf: 'flex-end',
              marginBottom: 10
            }}
          >
            <Paragraph size={SIZE.xs}>
              <Icon color={colors.icon} size={SIZE.sm} name="note" /> Feburary 2022 Week 1
            </Paragraph>
          </View>
          <View
            style={{
              padding: 12,
              width: '90%',
              backgroundColor: colors.bg,
              borderRadius: 10,
              alignSelf: 'flex-end',
              marginBottom: 10
            }}
          >
            <Paragraph color={colors.accent}>
              <Icon color={colors.accent} size={SIZE.sm} name="bookmark" /> Meetings
            </Paragraph>
          </View>
        </View>
      ),
      button: {
        type: 'next',
        title: 'Next'
      }
    },
    {
      title: 'Easy access',
      text: 'You can create shortcuts of frequently accessed notebooks or topics in Side Menu',
      walkthroughItem: () => (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12
          }}
        >
          <PinItem
            index={0}
            placeholder={true}
            item={{
              title: 'Tasks',
              type: 'topic'
            }}
            onPress={() => {}}
          />

          <PinItem
            index={1}
            placeholder={true}
            item={{
              title: 'Work and office',
              type: 'notebook'
            }}
            onPress={() => {}}
          />
        </View>
      ),
      button: {
        type: 'done',
        title: 'Add your first notebook',
        action: () => {
          eSendEvent(eOpenAddNotebookDialog);
        }
      }
    }
  ]
};

export default { notebooks };
