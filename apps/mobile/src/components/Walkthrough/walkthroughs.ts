import { eSendEvent } from '../../services/EventManager';
import { eOpenAddNotebookDialog } from '../../utils/Events';

export type TStep = {
  text: string;
  image: string;
  title: string;
  button?: {
    type: 'next' | 'done';
    title: string;
    action?: () => void;
  };
};

const notebooks: { id: string; steps: TStep[] } = {
  id: 'notebooks',
  steps: [
    {
      title: 'Notebooks',
      text: 'Organize your notes in a simple and easy way with Notebooks',
      image: 'https://picsum.photos/400/500',
      button: {
        type: 'next',
        title: 'Next'
      }
    },
    {
      title: 'Topics',
      text: 'Notebooks can have unlimited topics.',
      image: 'https://picsum.photos/400/500',
      button: {
        type: 'next',
        title: 'Next'
      }
    },
    {
      title: 'Quick access',
      text: 'You can make shortcuts of topics and notebooks in side menu for quick access',
      image: 'https://picsum.photos/400/500',
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
