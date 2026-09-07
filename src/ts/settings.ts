import { getThemeSettings, saveThemeSettings, ThemeSettings } from './themes';
import { getSavedSearchEngine } from './search';
import { parseYaml, stringifyYaml, YamlMap } from './yaml';
import {
	getLinksConfig,
	saveLinksConfig,
	renderBookmarks,
	renderHomelabServices,
	renderSidebarImage,
	ensureLinksEditorsBuilt,
	refreshLinksEditors,
	BookmarkCategory,
	BookmarkLink,
	HomelabService,
	ImageConfig
} from './links';
import { checkLocalServices } from './services';

interface StartpageExportData {
	settings: {
		preferredLightTheme: string;
		preferredDarkTheme: string;
		searchEngine: string;
	};
	image: ImageConfig;
	bookmarks: BookmarkCategory[];
	services: HomelabService[];
}

interface ParsedImportData {
	settings?: {
		preferredLightTheme: string;
		preferredDarkTheme: string;
		searchEngine: string;
	};
	image?: Partial<ImageConfig>;
	bookmarks?: BookmarkCategory[];
	services?: HomelabService[];
}

const SETTINGS_FILE_NAME = 'startpage-settings.yml';

function collectCurrentSettings(): StartpageExportData {
	const theme = getThemeSettings();
	const links = getLinksConfig();
	return {
		settings: {
			preferredLightTheme: theme.preferredLight,
			preferredDarkTheme: theme.preferredDark,
			searchEngine: getSavedSearchEngine()
		},
		image: links.image,
		bookmarks: links.categories,
		services: links.services
	};
}

function buildYaml(data: StartpageExportData): string {
	const yamlData: YamlMap = {
		startpage: {
			settings: {
				preferred_light_theme: data.settings.preferredLightTheme,
				preferred_dark_theme: data.settings.preferredDarkTheme,
				search_engine: data.settings.searchEngine
			},
			image: {
				href: data.image.href,
				src: data.image.src
			},
			bookmarks: data.bookmarks.map(cat => ({
				category: cat.category,
				links: cat.links.map(link => ({
					name: link.name,
					url: link.url
				}))
			})),
			services: data.services.map(service => ({
				name: service.name,
				url: service.url,
				icon: service.icon
			}))
		}
	};
	return stringifyYaml(yamlData);
}

function extractSettingsFromYaml(yamlText: string): ParsedImportData {
	const root = parseYaml(yamlText);
	const startpage = (root.startpage && typeof root.startpage === 'object' && !Array.isArray(root.startpage))
		? (root.startpage as YamlMap)
		: root;

	const result: ParsedImportData = {};

	if (startpage.settings && typeof startpage.settings === 'object' && !Array.isArray(startpage.settings)) {
		const s = startpage.settings as YamlMap;
		const preferredLightTheme = typeof s.preferred_light_theme === 'string' ? s.preferred_light_theme : undefined;
		const preferredDarkTheme = typeof s.preferred_dark_theme === 'string' ? s.preferred_dark_theme : undefined;
		const searchEngine = typeof s.search_engine === 'string' ? s.search_engine : undefined;
		if (preferredLightTheme && preferredDarkTheme && searchEngine) {
			result.settings = {
				preferredLightTheme,
				preferredDarkTheme,
				searchEngine
			};
		}
	}

	const imageNode = startpage.image || root.image;
	if (imageNode && typeof imageNode === 'object' && !Array.isArray(imageNode)) {
		const imgMap = imageNode as YamlMap;
		const href = typeof imgMap.href === 'string' ? imgMap.href : typeof imgMap.url === 'string' ? imgMap.url : undefined;
		const src = typeof imgMap.src === 'string' ? imgMap.src : undefined;
		if (href || src) {
			result.image = { href, src };
		}
	} else if (startpage.settings && typeof startpage.settings === 'object') {
		const s = startpage.settings as YamlMap;
		const href = typeof s.image_href === 'string' ? s.image_href : typeof s.image_url === 'string' ? s.image_url : undefined;
		if (href) {
			result.image = { href };
		}
	}

	const bookmarksNode = startpage.bookmarks || root.bookmarks;
	if (Array.isArray(bookmarksNode)) {
		const categories: BookmarkCategory[] = [];
		for (const catNode of bookmarksNode) {
			if (!catNode || typeof catNode !== 'object' || Array.isArray(catNode)) continue;
			const catMap = catNode as YamlMap;
			const category = typeof catMap.category === 'string'
				? catMap.category
				: typeof catMap.title === 'string'
					? catMap.title
					: '';
			const rawLinks = Array.isArray(catMap.links) ? catMap.links : [];
			const links: BookmarkLink[] = [];
			for (const linkNode of rawLinks) {
				if (!linkNode || typeof linkNode !== 'object' || Array.isArray(linkNode)) continue;
				const linkMap = linkNode as YamlMap;
				const name = typeof linkMap.name === 'string' ? linkMap.name : '';
				const url = typeof linkMap.url === 'string' ? linkMap.url : '';
				if (name || url) {
					links.push({ name, url });
				}
			}
			categories.push({ category, links });
		}
		if (categories.length > 0) {
			result.bookmarks = categories;
		}
	}

	const servicesNode = startpage.services || root.services;
	if (Array.isArray(servicesNode)) {
		const services: HomelabService[] = [];
		for (const sNode of servicesNode) {
			if (!sNode || typeof sNode !== 'object' || Array.isArray(sNode)) continue;
			const sMap = sNode as YamlMap;
			const name = typeof sMap.name === 'string' ? sMap.name : '';
			const url = typeof sMap.url === 'string' ? sMap.url : '';
			const icon = typeof sMap.icon === 'string' ? sMap.icon : 'globe';
			if (name || url) {
				services.push({ name, url, icon });
			}
		}
		if (services.length > 0) {
			result.services = services;
		}
	}

	if (!result.settings && !result.bookmarks && !result.services && !result.image) {
		throw new Error('No valid startpage settings, bookmarks, services, or image found in the imported YAML.');
	}

	return result;
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

function applySettings(data: ParsedImportData, controls: SettingsControls): void {
	if (data.settings) {
		const { preferredLightTheme, preferredDarkTheme, searchEngine } = data.settings;
		controls.lightSelect.value = preferredLightTheme;
		controls.darkSelect.value = preferredDarkTheme;
		controls.engineSelect.value = searchEngine;

		saveThemeSettings({
			preferredLight: preferredLightTheme,
			preferredDark: preferredDarkTheme
		});
		localStorage.setItem('selectedSearchEngine', searchEngine);
	}

	if (data.image) {
		const currentConfig = getLinksConfig();
		if (data.image.href) currentConfig.image.href = data.image.href;
		if (data.image.src) currentConfig.image.src = data.image.src;
		saveLinksConfig(currentConfig);
		renderSidebarImage();
	}

	if (data.bookmarks || data.services) {
		const currentConfig = getLinksConfig();
		if (data.bookmarks) {
			currentConfig.categories = data.bookmarks;
		}
		if (data.services) {
			currentConfig.services = data.services;
		}
		saveLinksConfig(currentConfig);
		if (data.bookmarks) {
			renderBookmarks();
		}
		if (data.services) {
			renderHomelabServices();
			checkLocalServices();
		}
	}

	// Keep the in-modal editors in sync after an out-of-band YAML import.
	refreshLinksEditors();
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

	toggleBtn.addEventListener('click', () => {
		ensureLinksEditorsBuilt();
		modal.showModal();
	});
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
