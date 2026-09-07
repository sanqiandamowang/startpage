import { syncBookmarkShortcuts } from './search';
import { checkLocalServices } from './services';

export interface BookmarkLink {
	name: string;
	url: string;
}

export interface BookmarkCategory {
	category: string;
	links: BookmarkLink[];
}

export interface HomelabService {
	name: string;
	url: string;
	icon: string;
}

export interface ImageConfig {
	href: string;
	src: string;
}

export interface LinksConfig {
	categories: BookmarkCategory[];
	services: HomelabService[];
	image: ImageConfig;
}

export const ICON_LIBRARY: Record<string, { label: string; svg: string }> = {
	server: {
		label: 'Server',
		svg: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>'
	},
	music: {
		label: 'Music',
		svg: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>'
	},
	play: {
		label: 'Play',
		svg: '<polygon points="5 3 19 12 5 21 5 3"></polygon>'
	},
	download: {
		label: 'Download',
		svg: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'
	},
	trending: {
		label: 'Trending',
		svg: '<polyline points="4 17 10 11 14 15 20 9"></polyline><polyline points="14 9 20 9 20 15"></polyline>'
	},
	search: {
		label: 'Search',
		svg: '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><circle cx="11" cy="11" r="3"></circle>'
	},
	globe: {
		label: 'Globe',
		svg: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
	},
	cloud: {
		label: 'Cloud',
		svg: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>'
	},
	home: {
		label: 'Home',
		svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>'
	},
	mail: {
		label: 'Mail',
		svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>'
	},
	video: {
		label: 'Video',
		svg: '<polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>'
	},
	book: {
		label: 'Book',
		svg: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>'
	},
	terminal: {
		label: 'Terminal',
		svg: '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>'
	},
	star: {
		label: 'Star',
		svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
	},
	heart: {
		label: 'Heart',
		svg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>'
	},
	folder: {
		label: 'Folder',
		svg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>'
	}
};

export const DEFAULT_BOOKMARKS: BookmarkCategory[] = [
	{
		category: '~/personal ',
		links: [
			{ name: 'Gemini', url: 'https://gemini.google.com' },
			{ name: 'Modrinth', url: 'https://modrinth.com' },
			{ name: 'Ivanime', url: 'https://ivanime.com' },
			{ name: 'MyAnimeList', url: 'https://myanimelist.net' },
			{ name: 'VirusTotal', url: 'https://virustotal.com' }
		]
	},
	{
		category: '~/dev ',
		links: [
			{ name: 'OverApi', url: 'https://overapi.com' },
			{ name: 'DevDocs', url: 'https://devdocs.io' },
			{ name: 'Github', url: 'https://github.com/druxorey' },
			{ name: 'W3Schools', url: 'https://w3schools.com' },
			{ name: 'DevHints', url: 'https://devhints.io' }
		]
	},
	{
		category: '~/academic 拾',
		links: [
			{ name: 'Conest', url: 'https://conest.ciens.ucv.ve/webapp/' },
			{ name: 'PortalAsig2', url: 'https://portalasig2.ciens.ucv.ve/#/' },
			{ name: 'Campus Virtual', url: 'https://campusvirtualucv.org/login/index.php' },
			{ name: 'CiensMail', url: 'https://correo.ciens.ucv.ve' },
			{ name: 'NotebookLM', url: 'https://notebooklm.google.com/' }
		]
	},
	{
		category: '~/linux ',
		links: [
			{ name: 'Explain Shell', url: 'https://explainshell.com' },
			{ name: 'Dotfiles', url: 'https://github.com/druxorey/dotfiles' },
			{ name: 'Arch Wiki', url: 'https://wiki.archlinux.org/title/Main_page' },
			{ name: 'Aur', url: 'https://aur.archlinux.org/' },
			{ name: 'TechThings', url: 'https://reddit.com/user/devdruxorey/m/techthings/' }
		]
	}
];

export const DEFAULT_SERVICES: HomelabService[] = [
	{ name: 'TrueNAS Core', url: 'http://192.168.1.10', icon: 'server' },
	{ name: 'Navidrome', url: 'http://192.168.1.23:4533', icon: 'music' },
	{ name: 'Jellyfin', url: 'http://192.168.1.17:8096', icon: 'play' },
	{ name: 'Transmission', url: 'http://192.168.1.13:9091', icon: 'download' },
	{ name: 'Aria2', url: 'http://192.168.1.15', icon: 'trending' },
	{ name: 'Prowlarr', url: 'http://192.168.1.18:9696', icon: 'search' }
];

const LINKS_STORAGE_KEY = 'startpage_links_config';

export const DEFAULT_IMAGE: ImageConfig = {
	href: 'https://druxorey.github.io/',
	src: '/src/assets/images/img.webp'
};

function normalizeCategories(rawList: unknown[]): BookmarkCategory[] {
	const categories: BookmarkCategory[] = [];
	for (const raw of rawList) {
		if (!raw || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		const category = typeof r.category === 'string' ? r.category : typeof r.title === 'string' ? r.title : '';
		const links: BookmarkLink[] = [];
		if (Array.isArray(r.links)) {
			for (const rawLink of r.links) {
				if (!rawLink || typeof rawLink !== 'object') continue;
				const l = rawLink as Record<string, unknown>;
				const name = typeof l.name === 'string' ? l.name : '';
				const url = typeof l.url === 'string' ? l.url : '';
				if (name || url) {
					links.push({ name, url });
				}
			}
		}
		categories.push({ category, links });
	}
	return categories.length > 0 ? categories : structuredClone(DEFAULT_BOOKMARKS);
}

function normalizeServices(rawList: unknown[]): HomelabService[] {
	const services: HomelabService[] = [];
	for (const raw of rawList) {
		if (!raw || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		const name = typeof r.name === 'string' ? r.name : '';
		const url = typeof r.url === 'string' ? r.url : '';
		const icon = typeof r.icon === 'string' ? r.icon : 'globe';
		if (name || url) {
			services.push({ name, url, icon });
		}
	}
	return services.length > 0 ? services : structuredClone(DEFAULT_SERVICES);
}

export function getLinksConfig(): LinksConfig {
	const saved = localStorage.getItem(LINKS_STORAGE_KEY);
	if (!saved) {
		return {
			categories: structuredClone(DEFAULT_BOOKMARKS),
			services: structuredClone(DEFAULT_SERVICES),
			image: structuredClone(DEFAULT_IMAGE)
		};
	}
	try {
		const parsed = JSON.parse(saved) as Partial<LinksConfig>;
		const categories = Array.isArray(parsed.categories) ? normalizeCategories(parsed.categories) : structuredClone(DEFAULT_BOOKMARKS);
		const services = Array.isArray(parsed.services) ? normalizeServices(parsed.services) : structuredClone(DEFAULT_SERVICES);
		let image = structuredClone(DEFAULT_IMAGE);
		if (parsed.image && typeof parsed.image === 'object') {
			const imgObj = parsed.image as unknown as Record<string, unknown>;
			image = {
				href: typeof imgObj.href === 'string' ? imgObj.href : typeof imgObj.url === 'string' ? imgObj.url : DEFAULT_IMAGE.href,
				src: typeof imgObj.src === 'string' ? imgObj.src : DEFAULT_IMAGE.src
			};
		}
		return { categories, services, image };
	} catch {
		return {
			categories: structuredClone(DEFAULT_BOOKMARKS),
			services: structuredClone(DEFAULT_SERVICES),
			image: structuredClone(DEFAULT_IMAGE)
		};
	}
}
export function saveLinksConfig(config: LinksConfig): void {
	localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(config));
	syncBookmarkShortcuts(config.categories);
}

export function renderBookmarks(): void {
	const grid = document.querySelector<HTMLElement>('.bookmark-grid');
	if (!grid) return;

	const { categories } = getLinksConfig();
	grid.innerHTML = '';

	for (const cat of categories) {
		const catEl = document.createElement('div');
		catEl.className = 'bookmark-category';

		const titleEl = document.createElement('h2');
		titleEl.className = 'category-title';
		titleEl.textContent = cat.category;
		catEl.appendChild(titleEl);

		const list = document.createElement('ul');
		list.className = 'bookmark-list';
		for (const link of cat.links) {
			const li = document.createElement('li');
			const a = document.createElement('a');
			a.href = link.url;
			a.textContent = link.name;
			li.appendChild(a);
			list.appendChild(li);
		}
		catEl.appendChild(list);
		grid.appendChild(catEl);
	}
}

export function renderHomelabServices(): void {
	const container = document.querySelector<HTMLElement>('.homelab-services-container');
	if (!container) return;

	const { services } = getLinksConfig();

	const previousStatuses = new Map<string, string>();
	container.querySelectorAll<HTMLAnchorElement>('.homelab-service-link').forEach(a => {
		const u = a.getAttribute('data-url');
		if (u) {
			const status = a.classList.contains('online') ? 'online' : a.classList.contains('offline') ? 'offline' : '';
			if (status) previousStatuses.set(u, status);
		}
	});

	container.innerHTML = '';

	services.forEach((service) => {
		const a = document.createElement('a');
		a.href = service.url;
		a.className = 'homelab-service-link';
		a.setAttribute('data-url', service.url);
		let host = service.url;
		try {
			host = new URL(service.url).host;
		} catch {
			// fallback to full url
		}
		a.title = `${service.name} (${host})`;
		const icon = ICON_LIBRARY[service.icon] || ICON_LIBRARY.globe;
		a.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>`;
		const prev = previousStatuses.get(service.url);
		if (prev) a.classList.add(prev);
		container.appendChild(a);
	});
}

export function renderSidebarImage(): void {
	const frame = document.querySelector<HTMLElement>('.image-frame');
	if (!frame) return;

	const { image } = getLinksConfig();
	const anchor = frame.querySelector<HTMLAnchorElement>('a');
	const img = frame.querySelector<HTMLImageElement>('img');

	if (anchor) {
		anchor.href = image.href;
	}
	if (img && image.src) {
		img.src = image.src;
	}
}

export function initLinks(): void {
	if (localStorage.getItem(LINKS_STORAGE_KEY)) {
		renderBookmarks();
		renderHomelabServices();
		renderSidebarImage();
	}
	syncBookmarkShortcuts(getLinksConfig().categories);
}

/* ==========================================================================
   SETTINGS EDITOR
   ========================================================================== */
let editorConfig: LinksConfig = getLinksConfig();
let editorBuilt = false;

function buildIconSelect(selected: string): HTMLSelectElement {
	const select = document.createElement('select');
	select.className = 'form-select icon-select';
	for (const key of Object.keys(ICON_LIBRARY)) {
		const opt = document.createElement('option');
		opt.value = key;
		opt.textContent = ICON_LIBRARY[key].label;
		if (key === selected) opt.selected = true;
		select.appendChild(opt);
	}
	return select;
}

function readEditorState(): LinksConfig {
	const bookmarksEditor = document.getElementById('bookmarks-editor');
	const servicesEditor = document.getElementById('services-editor');
	const categories: BookmarkCategory[] = [];

	if (bookmarksEditor) {
		bookmarksEditor.querySelectorAll<HTMLElement>('.editor-category').forEach(catEl => {
			const titleInput = catEl.querySelector<HTMLInputElement>('.editor-category-title');
			const links: BookmarkLink[] = [];
			catEl.querySelectorAll<HTMLElement>('.editor-link-row').forEach(row => {
				const name = row.querySelector<HTMLInputElement>('.editor-link-name')?.value.trim() ?? '';
				const url = row.querySelector<HTMLInputElement>('.editor-link-url')?.value.trim() ?? '';
				if (name || url) links.push({ name, url });
			});
			categories.push({ category: titleInput?.value.trim() ?? '', links });
		});
	}

	const services: HomelabService[] = [];
	if (servicesEditor) {
		servicesEditor.querySelectorAll<HTMLElement>('.editor-service-row').forEach(row => {
			const name = row.querySelector<HTMLInputElement>('.editor-service-name')?.value.trim() ?? '';
			const url = row.querySelector<HTMLInputElement>('.editor-service-url')?.value.trim() ?? '';
			const icon = row.querySelector<HTMLSelectElement>('.icon-select')?.value ?? 'globe';
			if (name || url) services.push({ name, url, icon });
		});
	}

	const imageSrcInput = document.getElementById('editor-image-src') as HTMLInputElement | null;
	const imageHrefInput = document.getElementById('editor-image-href') as HTMLInputElement | null;
	const image: ImageConfig = {
		src: imageSrcInput?.value.trim() || DEFAULT_IMAGE.src,
		href: imageHrefInput?.value.trim() || DEFAULT_IMAGE.href
	};

	return { categories, services, image };
}

function onEditorInputChange(event: Event): void {
	const target = event.target as HTMLElement;
	editorConfig = readEditorState();
	saveLinksConfig(editorConfig);

	if (
		target.classList.contains('editor-service-name') ||
		target.classList.contains('editor-service-url') ||
		target.classList.contains('icon-select')
	) {
		renderHomelabServices();
	} else if (
		target.id === 'editor-image-src' ||
		target.id === 'editor-image-href'
	) {
		renderSidebarImage();
	} else {
		renderBookmarks();
	}
}

function buildLinkRow(catIndex: number, linkIndex: number, link: BookmarkLink): HTMLElement {
	const row = document.createElement('div');
	row.className = 'editor-link-row';

	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.className = 'form-input editor-input editor-link-name';
	nameInput.value = link.name;
	nameInput.placeholder = 'Name';
	nameInput.addEventListener('input', onEditorInputChange);
	row.appendChild(nameInput);

	const urlInput = document.createElement('input');
	urlInput.type = 'text';
	urlInput.className = 'form-input editor-input editor-link-url';
	urlInput.value = link.url;
	urlInput.placeholder = 'https://';
	urlInput.addEventListener('input', onEditorInputChange);
	row.appendChild(urlInput);

	const removeBtn = document.createElement('button');
	removeBtn.type = 'button';
	removeBtn.className = 'editor-remove-btn';
	removeBtn.textContent = '×';
	removeBtn.title = 'Remove link';
	removeBtn.addEventListener('click', () => {
		editorConfig.categories[catIndex].links.splice(linkIndex, 1);
		saveLinksConfig(editorConfig);
		buildBookmarksEditor();
		renderBookmarks();
	});
	row.appendChild(removeBtn);
	return row;
}

function buildBookmarksEditor(): void {
	const container = document.getElementById('bookmarks-editor');
	if (!container) return;
	container.innerHTML = '';

	editorConfig.categories.forEach((category, catIndex) => {
		const catEl = document.createElement('div');
		catEl.className = 'editor-category';

		const header = document.createElement('div');
		header.className = 'editor-category-header';

		const titleInput = document.createElement('input');
		titleInput.type = 'text';
		titleInput.className = 'form-input editor-input editor-category-title';
		titleInput.value = category.category;
		titleInput.placeholder = 'Category title (e.g. ~/dev)';
		titleInput.addEventListener('input', onEditorInputChange);
		header.appendChild(titleInput);

		const removeCatBtn = document.createElement('button');
		removeCatBtn.type = 'button';
		removeCatBtn.className = 'editor-remove-btn';
		removeCatBtn.textContent = '×';
		removeCatBtn.title = 'Remove category';
		removeCatBtn.addEventListener('click', () => {
			editorConfig.categories.splice(catIndex, 1);
			saveLinksConfig(editorConfig);
			buildBookmarksEditor();
			renderBookmarks();
		});
		header.appendChild(removeCatBtn);
		catEl.appendChild(header);

		const linksWrap = document.createElement('div');
		linksWrap.className = 'editor-links';
		category.links.forEach((link, linkIndex) => {
			linksWrap.appendChild(buildLinkRow(catIndex, linkIndex, link));
		});
		catEl.appendChild(linksWrap);

		const addLinkBtn = document.createElement('button');
		addLinkBtn.type = 'button';
		addLinkBtn.className = 'editor-add-btn';
		addLinkBtn.textContent = '+ Add Link';
		addLinkBtn.addEventListener('click', () => {
			editorConfig.categories[catIndex].links.push({ name: '', url: '' });
			saveLinksConfig(editorConfig);
			buildBookmarksEditor();
			renderBookmarks();
		});
		catEl.appendChild(addLinkBtn);

		container.appendChild(catEl);
	});

	const addCatBtn = document.createElement('button');
	addCatBtn.type = 'button';
	addCatBtn.className = 'editor-add-btn editor-add-btn-block';
	addCatBtn.textContent = '+ Add Category';
	addCatBtn.addEventListener('click', () => {
		editorConfig.categories.push({ category: '~/new', links: [] });
		saveLinksConfig(editorConfig);
		buildBookmarksEditor();
		renderBookmarks();
	});
	container.appendChild(addCatBtn);
}

function buildServiceRow(index: number, service: HomelabService): HTMLElement {
	const row = document.createElement('div');
	row.className = 'editor-service-row';

	const nameInput = document.createElement('input');
	nameInput.type = 'text';
	nameInput.className = 'form-input editor-input editor-service-name';
	nameInput.value = service.name;
	nameInput.placeholder = 'Name';
	nameInput.addEventListener('input', onEditorInputChange);
	row.appendChild(nameInput);

	const urlInput = document.createElement('input');
	urlInput.type = 'text';
	urlInput.className = 'form-input editor-input editor-service-url';
	urlInput.value = service.url;
	urlInput.placeholder = 'http://';
	urlInput.addEventListener('input', onEditorInputChange);
	row.appendChild(urlInput);

	const iconSelect = buildIconSelect(service.icon);
	iconSelect.addEventListener('change', onEditorInputChange);
	row.appendChild(iconSelect);

	const removeBtn = document.createElement('button');
	removeBtn.type = 'button';
	removeBtn.className = 'editor-remove-btn';
	removeBtn.textContent = '×';
	removeBtn.title = 'Remove service';
	removeBtn.addEventListener('click', () => {
		editorConfig.services.splice(index, 1);
		saveLinksConfig(editorConfig);
		buildServicesEditor();
		renderHomelabServices();
		checkLocalServices();
	});
	row.appendChild(removeBtn);
	return row;
}

function buildServicesEditor(): void {
	const container = document.getElementById('services-editor');
	if (!container) return;
	container.innerHTML = '';

	editorConfig.services.forEach((service, index) => {
		container.appendChild(buildServiceRow(index, service));
	});

	const addBtn = document.createElement('button');
	addBtn.type = 'button';
	addBtn.className = 'editor-add-btn editor-add-btn-block';
	addBtn.textContent = '+ Add Service';
	addBtn.addEventListener('click', () => {
		editorConfig.services.push({ name: '', url: '', icon: 'globe' });
		saveLinksConfig(editorConfig);
		buildServicesEditor();
		renderHomelabServices();
		checkLocalServices();
	});
	container.appendChild(addBtn);
}

function buildImageEditor(): void {
	const container = document.getElementById('image-editor');
	if (!container) return;
	container.innerHTML = '';

	const row = document.createElement('div');
	row.className = 'editor-image-row';

	const srcInput = document.createElement('input');
	srcInput.type = 'text';
	srcInput.id = 'editor-image-src';
	srcInput.className = 'form-input editor-input editor-image-src';
	srcInput.value = editorConfig.image.src;
	srcInput.placeholder = 'Image URL or path (/src/assets/images/img.webp)';
	srcInput.addEventListener('input', onEditorInputChange);
	row.appendChild(srcInput);

	const hrefInput = document.createElement('input');
	hrefInput.type = 'text';
	hrefInput.id = 'editor-image-href';
	hrefInput.className = 'form-input editor-input editor-image-href';
	hrefInput.value = editorConfig.image.href;
	hrefInput.placeholder = 'Click link (https://)';
	hrefInput.addEventListener('input', onEditorInputChange);
	row.appendChild(hrefInput);

	container.appendChild(row);
}

function buildAllEditors(): void {
	editorConfig = getLinksConfig();
	buildBookmarksEditor();
	buildServicesEditor();
	buildImageEditor();
}

export function ensureLinksEditorsBuilt(): void {
	if (editorBuilt) return;
	editorBuilt = true;
	buildAllEditors();
}

/**
 * Rebuild the editors from current storage. Used after an out-of-band
 * mutation (e.g. YAML import) so the editor reflects the new data.
 */
export function refreshLinksEditors(): void {
	if (!editorBuilt) return;
	buildAllEditors();
}

export function initLinksEditor(): void {
	editorConfig = getLinksConfig();

	const bookmarksReset = document.getElementById('bookmarks-reset');
	bookmarksReset?.addEventListener('click', () => {
		editorConfig.categories = structuredClone(DEFAULT_BOOKMARKS);
		saveLinksConfig(editorConfig);
		buildBookmarksEditor();
		renderBookmarks();
	});

	const servicesReset = document.getElementById('services-reset');
	servicesReset?.addEventListener('click', () => {
		editorConfig.services = structuredClone(DEFAULT_SERVICES);
		saveLinksConfig(editorConfig);
		buildServicesEditor();
		renderHomelabServices();
		checkLocalServices();
	});

	const imageReset = document.getElementById('image-reset');
	imageReset?.addEventListener('click', () => {
		editorConfig.image = structuredClone(DEFAULT_IMAGE);
		saveLinksConfig(editorConfig);
		buildImageEditor();
		renderSidebarImage();
	});
}
