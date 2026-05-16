import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

async function fetchNpmVersion(): Promise<string> {
  try {
    const res = await fetch('https://registry.npmjs.org/formwright/latest');
    const data = await res.json() as { version: string };
    return data.version;
  } catch {
    return '';
  }
}

const npmVersion = await fetchNpmVersion();

const config: Config = {
  customFields: { npmVersion },
  title: 'Formwright Docs',
  tagline: 'Schema-driven form engine documentation',
  favicon: 'img/favicon.ico',
  future: {
    v4: true,
  },
  url: 'https://adarshaacharya.github.io',
  baseUrl: '/formwright/',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/adarsha/formwright/tree/main/apps/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Formwright',
      logo: {
        alt: 'Formwright Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/adarsha/formwright',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/docs',
            },
            {
              label: 'Architecture',
              to: '/docs/concepts/mental-model',
            },
          ],
        },
        {
          title: 'Repository',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/adarsha/formwright',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Formwright.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
