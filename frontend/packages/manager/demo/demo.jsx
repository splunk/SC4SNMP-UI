import React from 'react';
import { createRoot } from 'react-dom/client';

import { SplunkThemeProvider } from '@splunk/themes';
import { defaultTheme, getThemeOptions } from '@splunk/splunk-utils/themes';

import Manager from '../src/Manager';

const themeProviderSettings = getThemeOptions(defaultTheme() || 'enterprise');

const containerEl = document.getElementById('main-component-container');
createRoot(containerEl).render(
    <SplunkThemeProvider {...themeProviderSettings}>
        <Manager name="World" />
    </SplunkThemeProvider>
);
