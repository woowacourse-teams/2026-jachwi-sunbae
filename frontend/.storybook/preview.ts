import type { Preview } from '@storybook/react-webpack5';

import '../src/app/styles/global.css';
import '../src/app/styles/tokens.css';
import '../src/app/styles/utilities.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
};

export default preview;
