import type { Preview } from '@storybook/react'

import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '../src/index.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light',  value: '#F7F4EE' },
        { name: 'dark',   value: '#22201C' },
        { name: 'white',  value: '#FFFFFF' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date:  /date$/i,
      },
    },
  },
}

export default preview
