/**
 * Universal Passcode & Credentials Parser
 * Supports:
 * - Chrome / Brave / Edge / Opera Passwords CSV (name, url, username, password, note)
 * - Bitwarden CSV & JSON exports (folder, name, notes, login_uri, login_username, login_password, login_totp)
 * - 1Password CSV (Title, URL, Username, Password, Notes)
 * - KeePass CSV / XML (Account, Login Name, Password, Web Site, Comments)
 * - LastPass CSV (url, username, password, extra, name, grouping)
 * - Apple Passwords CSV (Title, URL, Username, Password, Notes, OTPAuth)
 * - Dashy YAML & JSON configs
 * - Netscape HTML Bookmarks (<A HREF="...">Title</A>)
 * - Plaintext lists (URLs, Title: URL, URL - User - Pass)
 */

import { load as yamlLoad } from '@/utils/yaml';
import { classifyService } from '@/utils/smartClassifier';

/**
 * Get a high quality favicon or icon URL for a given target domain/URL
 */
export function getIconForUrl(url, title = '') {
  if (!url) return 'fas fa-key';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = parsed.hostname.replace(/^www\./, '');
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(domain)}`;
  } catch {
    return 'fas fa-globe';
  }
}

/**
 * Safely parse CSV text into rows and columns handling quotes and commas
 */
export function parseCSV(text) {
  const lines = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

/**
 * Identify column indexes in a CSV header
 */
function findHeaderIndexes(headerRow) {
  const map = {
    title: -1,
    url: -1,
    username: -1,
    password: -1,
    totp: -1,
    notes: -1,
    category: -1,
  };

  const clean = (str) => (str || '').toLowerCase().replace(/[\s_-]/g, '');

  headerRow.forEach((col, idx) => {
    const h = clean(col);
    if (/^(title|name|account|sitename|app|itemname)$/.test(h)) map.title = idx;
    else if (/^(url|uri|loginuri|website|webaddress|host|location|link|href)$/.test(h)) map.url = idx;
    else if (/^(username|loginusername|loginname|login|user|email|accountname)$/.test(h)) map.username = idx;
    else if (/^(password|loginpassword|passcode|pass|pin|secret|code)$/.test(h)) map.password = idx;
    else if (/^(totp|logintotp|otp|2fa|authenticator|authcode)$/.test(h)) map.totp = idx;
    else if (/^(notes|note|comments|extra|description|memo)$/.test(h)) map.notes = idx;
    else if (/^(folder|category|group|grouping|section|tag)$/.test(h)) map.category = idx;
  });

  return map;
}

/**
 * Parse CSV content into structured passcode items
 */
export function parseCSVPasscodes(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const header = rows[0];
  const colMap = findHeaderIndexes(header);
  const items = [];
  const hasHeader = colMap.title !== -1 || colMap.url !== -1 || colMap.password !== -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  dataRows.forEach((row, index) => {
    if (!row || row.length === 0) return;

    let title = '';
    let url = '';
    let username = '';
    let password = '';
    let totp = '';
    let notes = '';
    let category = 'Códigos Guardados';

    if (hasHeader) {
      if (colMap.title >= 0 && row[colMap.title]) title = row[colMap.title];
      if (colMap.url >= 0 && row[colMap.url]) url = row[colMap.url];
      if (colMap.username >= 0 && row[colMap.username]) username = row[colMap.username];
      if (colMap.password >= 0 && row[colMap.password]) password = row[colMap.password];
      if (colMap.totp >= 0 && row[colMap.totp]) totp = row[colMap.totp];
      if (colMap.notes >= 0 && row[colMap.notes]) notes = row[colMap.notes];
      if (colMap.category >= 0 && row[colMap.category]) category = row[colMap.category];
    } else {
      // Guess column layout (Name, URL, User, Pass)
      if (row.length === 1) {
        url = row[0];
      } else if (row.length === 2) {
        title = row[0];
        url = row[1];
      } else if (row.length === 3) {
        title = row[0];
        url = row[1];
        password = row[2];
      } else if (row.length >= 4) {
        title = row[0];
        url = row[1];
        username = row[2];
        password = row[3];
        if (row[4]) notes = row[4];
      }
    }

    // Fallbacks and cleanups
    if (!title && url) {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        title = u.hostname.replace(/^www\./, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
      } catch {
        title = url;
      }
    }

    if (!title && !url && !password) return; // skip empty lines

    if (!title) title = `Código #${index + 1}`;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const description = [
      username ? `Usuario: ${username}` : '',
      notes ? notes.slice(0, 60) : '',
    ].filter(Boolean).join(' • ') || 'Acceso rápido y código guardado';

    // Smart classification if category is generic or not set
    let finalCategory = category;
    if (!finalCategory || finalCategory === 'Códigos Guardados' || finalCategory === 'General') {
      const match = classifyService(title, url, username, notes);
      finalCategory = match.sectorName;
    }

    items.push({
      id: `passcode-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      url: url || '#',
      description,
      username,
      password: password || '',
      passcode: totp || password || '',
      notes,
      category: finalCategory,
      icon: getIconForUrl(url, title),
    });
  });

  return items;
}

/**
 * Parse JSON content (Bitwarden JSON, Dashy config JSON, custom list)
 */
export function parseJSONPasscodes(rawText) {
  let parsed;
  try {
    parsed = typeof rawText === 'string' ? JSON.parse(rawText) : rawText;
  } catch (e) {
    return null;
  }

  const items = [];

  // Bitwarden Export Format
  if (parsed && Array.isArray(parsed.items)) {
    const foldersMap = {};
    if (Array.isArray(parsed.folders)) {
      parsed.folders.forEach((f) => { if (f.id && f.name) foldersMap[f.id] = f.name; });
    }

    parsed.items.forEach((item) => {
      const login = item.login || {};
      const uris = login.uris || [];
      const primaryUrl = uris.length > 0 ? uris[0].uri : '';
      const category = (item.folderId && foldersMap[item.folderId]) || 'Bitwarden Vault';

      items.push({
        id: `passcode-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: item.name || 'Sin título',
        url: primaryUrl || '#',
        description: login.username ? `Usuario: ${login.username}` : (item.notes || 'Credencial Bitwarden'),
        username: login.username || '',
        password: login.password || '',
        passcode: login.totp || login.password || '',
        notes: item.notes || '',
        category,
        icon: getIconForUrl(primaryUrl, item.name),
      });
    });
    return items;
  }

  // Dashy Sections JSON
  if (parsed && Array.isArray(parsed.sections)) {
    parsed.sections.forEach((sec) => {
      const secName = sec.name || 'General';
      if (Array.isArray(sec.items)) {
        sec.items.forEach((it) => {
          items.push({
            id: it.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: it.title || it.name || 'Acceso',
            url: it.url || '#',
            description: it.description || '',
            username: it.username || '',
            password: it.password || '',
            passcode: it.passcode || it.password || '',
            notes: it.notes || '',
            category: secName,
            icon: it.icon || getIconForUrl(it.url, it.title),
          });
        });
      }
    });
    return items;
  }

  // Generic Array of Objects
  if (Array.isArray(parsed)) {
    parsed.forEach((it, idx) => {
      const title = it.title || it.name || it.account || `Acceso #${idx + 1}`;
      const url = it.url || it.uri || it.link || it.href || '#';
      const username = it.username || it.user || it.email || '';
      const password = it.password || it.pass || it.passcode || it.secret || '';
      const passcode = it.passcode || it.totp || it.code || password || '';
      const category = it.category || it.folder || it.group || it.section || 'Códigos Guardados';
      const description = it.description || (username ? `Usuario: ${username}` : 'Acceso guardado');

      items.push({
        id: `passcode-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        url: url.startsWith('http') || url === '#' ? url : `https://${url}`,
        description,
        username,
        password,
        passcode,
        notes: it.notes || '',
        category,
        icon: it.icon || getIconForUrl(url, title),
      });
    });
    return items;
  }

  return items;
}

/**
 * Parse HTML Bookmarks Export
 */
export function parseHTMLBookmarks(html) {
  const items = [];
  const regex = /<A\s+[^>]*HREF=["']([^"']+)["'][^>]*>(.*?)<\/A>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const rawTitle = match[2].replace(/<[^>]+>/g, '').trim();
    if (url && !url.startsWith('javascript:') && !url.startsWith('place:')) {
      items.push({
        id: `bookmark-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: rawTitle || url,
        url,
        description: 'Marcador importado',
        username: '',
        password: '',
        passcode: '',
        notes: '',
        category: 'Marcadores',
        icon: getIconForUrl(url, rawTitle),
      });
    }
  }

  return items;
}

/**
 * Parse YAML content
 */
export function parseYAMLPasscodes(text) {
  try {
    const parsed = yamlLoad(text);
    return parseJSONPasscodes(parsed);
  } catch (e) {
    return null;
  }
}

/**
 * Parse plain text lines
 */
export function parsePlainText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];

  lines.forEach((line, idx) => {
    // Check if line contains URL
    const urlMatch = line.match(/(https?:\/\/[^\s,;]+)/i);
    let title = '';
    let url = '';
    let password = '';
    let username = '';

    if (urlMatch) {
      url = urlMatch[1];
      const remaining = line.replace(url, '').trim();
      const parts = remaining.split(/[-|:,;]/).map((p) => p.trim()).filter(Boolean);
      title = parts[0] || '';
      if (parts[1]) username = parts[1];
      if (parts[2]) password = parts[2];
    } else {
      // Delimited format: Title: Passcode or Title, Passcode
      const parts = line.split(/[,:;|\t-]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        title = parts[0];
        password = parts[1];
        if (parts[2]) username = parts[2];
      } else {
        title = line;
      }
    }

    if (!title && url) {
      try {
        title = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        title = `Acceso #${idx + 1}`;
      }
    }

    if (title || url) {
      const match = classifyService(title, url, username, password);
      items.push({
        id: `passcode-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: title || `Código #${idx + 1}`,
        url: url || '#',
        description: username ? `Usuario: ${username}` : (password ? 'Código de acceso' : 'Acceso rápido'),
        username,
        password,
        passcode: password,
        notes: '',
        category: match.sectorName,
        icon: getIconForUrl(url, title),
      });
    }
  });

  return items;
}

/**
 * Main parser entry point: detects format and returns list of items
 */
export async function parseDroppedContent(fileOrText, filename = '') {
  let text = '';
  let name = filename;

  if (fileOrText instanceof File || (typeof Blob !== 'undefined' && fileOrText instanceof Blob)) {
    name = fileOrText.name || filename;
    text = await fileOrText.text();
  } else if (typeof fileOrText === 'string') {
    text = fileOrText;
  } else {
    return [];
  }

  const lowerName = name.toLowerCase();

  // 1. Try JSON
  if (lowerName.endsWith('.json') || (text.trim().startsWith('{') && text.trim().endsWith('}')) || (text.trim().startsWith('[') && text.trim().endsWith(']'))) {
    const jsonRes = parseJSONPasscodes(text);
    if (jsonRes && jsonRes.length > 0) return jsonRes;
  }

  // 2. Try HTML Bookmarks
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || text.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') || (text.includes('<A HREF=') && text.includes('</A>'))) {
    const htmlRes = parseHTMLBookmarks(text);
    if (htmlRes && htmlRes.length > 0) return htmlRes;
  }

  // 3. Try YAML
  if (lowerName.endsWith('.yml') || lowerName.endsWith('.yaml') || text.startsWith('---') || text.includes('sections:')) {
    const yamlRes = parseYAMLPasscodes(text);
    if (yamlRes && yamlRes.length > 0) return yamlRes;
  }

  // 4. Try CSV
  if (lowerName.endsWith('.csv') || text.includes(',') || text.includes(';') || text.includes('\t')) {
    const csvRes = parseCSVPasscodes(text);
    if (csvRes && csvRes.length > 0) return csvRes;
  }

  // 5. Fallback to Plain Text parser
  return parsePlainText(text);
}

/**
 * Convert parsed items into Dashy section objects ready to be stored in config
 */
export function convertItemsToSections(items, options = {}) {
  const { groupBy = 'category', defaultSectionName = 'Códigos Guardados', defaultIcon = 'fas fa-layer-group' } = options;

  if (groupBy === 'single') {
    return [
      {
        name: defaultSectionName,
        icon: defaultIcon,
        items: items.map((it) => ({
          title: it.title,
          description: it.description,
          url: it.url || '#',
          icon: it.icon,
          username: it.username || undefined,
          password: it.password || undefined,
          passcode: it.passcode || undefined,
          notes: it.notes || undefined,
        })),
      },
    ];
  }

  // Group by category/folder with smart icon detection
  const groups = {};
  items.forEach((it) => {
    let cat = it.category || defaultSectionName;
    let icon = defaultIcon;

    if (!it.category || it.category === defaultSectionName || it.category === 'General' || groupBy === 'smart') {
      const match = classifyService(it.title, it.url, it.username, it.description);
      cat = match.sectorName;
      icon = match.icon;
    }

    if (!groups[cat]) groups[cat] = { icon, items: [] };
    groups[cat].items.push({
      title: it.title,
      description: it.description,
      url: it.url || '#',
      icon: it.icon,
      username: it.username || undefined,
      password: it.password || undefined,
      passcode: it.passcode || undefined,
      notes: it.notes || undefined,
    });
  });

  return Object.keys(groups).map((catName) => ({
    name: catName,
    icon: groups[catName].icon || defaultIcon,
    items: groups[catName].items,
  }));
}
