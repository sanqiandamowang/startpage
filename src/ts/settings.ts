import { getThemeSettings, saveThemeSettings, ThemeSettings } from './themes';
import { getSavedSearchEngine } from './search';
import { parseYaml, stringifyYaml, YamlMap } from './yaml';

interface AppSettings {
	preferredLightTheme: string;
	preferredDarkTheme: string;
	searchEngine: string;
}

const SETTINGS_FILE_NAME = 'startpage-settings.yml';

function collectCurrentSettings(): AppSettings {
	const theme = getThemeSettings();
	return {
		preferredLightTheme: theme.preferredLight,
		preferredDarkTheme: theme.preferredDark,
		searchEngine: getSavedSearchEngine()
	};
}

function buildYaml(settings: AppSettings): string {
	const yamlData: YamlMap = {
		startpage: {
			settings: {
				preferred_light_theme: settings.preferredLightTheme,
				preferred_dark_theme: settings.preferredDarkTheme,
				search_engine: settings.searchEngine
			}
		}
	};
	return stringifyYaml(yamlData);
}

function extractSettingsFromYaml(yamlText: string): AppSettings {
	const root = parseYaml(yamlText);
	const startpage = root.startpage;
	if (!startpage || typeof startpage !== 'object' || Array.isArray(startpage)) {
		throw new Error('Missing "startpage" root mapping in the imported file.');
	}
	const settingsNode = (startpage as YamlMap).settings;
	if (!settingsNode || typeof settingsNode !== 'object' || Array.isArray(settingsNode)) {
		throw new Error('Missing "startpage.settings" mapping in the imported file.');
	}
	const settings = settingsNode as YamlMap;

	const preferredLightTheme = settings.preferred_light_theme;
	const preferredDarkTheme = settings.preferred_dark_theme;
	const searchEngine = settings.search_engine;

	if (typeof preferredLightTheme !== 'string' || typeof preferredDarkTheme !== 'string' || typeof searchEngine !== 'string') {
		throw new Error('Imported settings must contain string values for themes and search engine.');
	}

	return {
		preferredLightTheme,
		preferredDarkTheme,
		searchEngine
	};
}

function downloadYaml(yamlText: string): void {
	const blob = new Blob([yamlText], { type: 'text/yaml;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = SETTINGS_FILE_NAME;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

function showFeedback(message: string, type: 'success' | 'error'): void {
	const feedback = document.getElementById('settings-feedback');
	if (!feedback) return;
	feedback.textContent = message;
	feedback.dataset.state = type;
}

function applySettings(settings: AppSettings, controls: SettingsControls): void {
	controls.lightSelect.value = settings.preferredLightTheme;
	controls.darkSelect.value = settings.preferredDarkTheme;
	controls.engineSelect.value = settings.searchEngine;

	saveThemeSettings({
		preferredLight: settings.preferredLightTheme,
		preferredDark: settings.preferredDarkTheme
	});
	localStorage.setItem('selectedSearchEngine', settings.searchEngine);
}

interface SettingsControls {
	lightSelect: HTMLSelectElement;
	darkSelect: HTMLSelectElement;
	engineSelect: HTMLSelectElement;
}

export function initSettings(): void {
	const modal = document.getElementById('settings-modal') as HTMLDialogElement | null;
	const toggleBtn = document.getElementById('settings-toggle');
	const closeBtn = document.getElementById('settings-close');
	const lightSelect = document.getElementById('light-theme-select') as HTMLSelectElement | null;
	const darkSelect = document.getElementById('dark-theme-select') as HTMLSelectElement | null;
	const engineSelect = document.getElementById('search-engine-select') as HTMLSelectElement | null;
	const exportBtn = document.getElementById('settings-export');
	const importBtn = document.getElementById('settings-import');
	const importInput = document.getElementById('settings-import-input') as HTMLInputElement | null;

	if (!modal || !toggleBtn || !closeBtn || !lightSelect || !darkSelect || !engineSelect) return;

	const controls: SettingsControls = { lightSelect, darkSelect, engineSelect };

	const currentPreferences = getThemeSettings();

	lightSelect.value = currentPreferences.preferredLight;
	darkSelect.value = currentPreferences.preferredDark;
	engineSelect.value = getSavedSearchEngine();

	toggleBtn.addEventListener('click', () => modal.showModal());
	closeBtn.addEventListener('click', () => modal.close());

	modal.addEventListener('click', (event: MouseEvent) => {
		const rect = modal.getBoundingClientRect();
		const clickedInside = (
			rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX && event.clientX <= rect.left + rect.width
		);
		if (!clickedInside) {
			modal.close();
		}
	});

	const syncPreferences = () => {
		const updatedSettings: ThemeSettings = {
			preferredLight: lightSelect.value,
			preferredDark: darkSelect.value
		};
		saveThemeSettings(updatedSettings);
	};

	lightSelect.addEventListener('change', syncPreferences);
	darkSelect.addEventListener('change', syncPreferences);

	engineSelect.addEventListener('change', () => {
		localStorage.setItem('selectedSearchEngine', engineSelect.value);
	});

	if (exportBtn) {
		exportBtn.addEventListener('click', () => {
			try {
				const yamlText = buildYaml(collectCurrentSettings());
				downloadYaml(yamlText);
				showFeedback('Settings exported successfully.', 'success');
			} catch (error) {
				console.error('Failed to export settings:', error);
				showFeedback('Failed to export settings.', 'error');
			}
		});
	}

	if (importBtn && importInput) {
		importBtn.addEventListener('click', () => importInput.click());

		importInput.addEventListener('change', async () => {
			const file = importInput.files?.[0];
			if (!file) return;

			try {
				const yamlText = await file.text();
				const importedSettings = extractSettingsFromYaml(yamlText);
				applySettings(importedSettings, controls);
				showFeedback('Settings imported successfully.', 'success');
			} catch (error) {
				console.error('Failed to import settings:', error);
				showFeedback(error instanceof Error ? error.message : 'Failed to import settings.', 'error');
			} finally {
				// Reset so selecting the same file again re-triggers the change event.
				importInput.value = '';
			}
		});
	}
}
