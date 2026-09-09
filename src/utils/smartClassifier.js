/**
 * Smart AI/Heuristic Classifier for Web Services and Credentials
 * Automatically categorizes websites, APIs, and tools into institutional quant-grade sectors.
 */

export const INSTITUTIONAL_SECTORS = [
  {
    name: 'Quant & Algorithmic Trading',
    icon: 'fas fa-chart-line',
    color: '#38bdf8',
    keywords: [
      'binance', 'okx', 'quantconnect', 'interactivebrokers', 'bybit', 'kraken', 'coinbase',
      'tradingview', 'etoro', 'kucoin', 'bitfinex', 'alpaca', 'metatrader', 'forex', 'crypto',
      'defi', 'swap', 'uniswap', 'dydx', 'coingecko', 'coinmarketcap', 'robinhood', 'dex',
      'derivatives', 'bloomberg', 'reuters', 'ftx', 'axiom', 'axi', 'bitget', 'mexc',
      'trading', 'broker', 'bourse', 'stock', 'futures', 'options', 'hyperliquid', 'jupiter',
      'phantom', 'solana', 'ethereum', 'bitcoin', 'btc', 'eth', 'arbitrage', 'alpha',
    ],
  },
  {
    name: 'Artificial Intelligence & Compute',
    icon: 'fas fa-brain',
    color: '#10b981',
    keywords: [
      'openai', 'chatgpt', 'anthropic', 'claude', 'gemini', 'deepmind', 'midjourney', 'huggingface',
      'replicate', 'luma', 'lumalabs', 'lovable', 'v0.dev', 'cursor', 'copilot', 'perplexity',
      'elevenlabs', 'runway', 'suno', 'visily', 'axitp', 'mistral', 'groq', 'stability',
      'leonardo', 'poe', 'civitai', 'langchain', 'ollama', 'together.ai', 'deepseek', 'cohere',
      'meta ai', 'jasper', 'chatpdf', 'fireworks.ai', 'ai', 'gpt', 'llm', 'neural',
    ],
  },
  {
    name: 'Cloud Infrastructure & Automation',
    icon: 'fas fa-server',
    color: '#f59e0b',
    keywords: [
      'aws', 'amazon.com/aws', 'azure', 'google cloud', 'gcp', 'cloudflare', 'digitalocean',
      'hetzner', 'ovh', 'alibaba', 'alibabacloud', 'vercel', 'netlify', 'render', 'heroku',
      'railway', 'fly.io', 'docker', 'kubernetes', 'portainer', 'proxmox', 'github', 'gitlab',
      'bitbucket', 'replit', 'ngrok', 'n8n', 'hostalia', 'godaddy', 'namecheap', 'cpanel',
      'plesk', 'datadog', 'grafana', 'uptime', 'localhost', '192.168.', '127.0.0.1', '10.0.',
      'router', 'samba', 'server', 'vps', 'ssh', 'ftp', 'jenkins', 'ansible', 'terraform',
      'supabase', 'firebase', 'mongodb', 'redis', 'postgres', 'mysql', 'api', 'gateway',
    ],
  },
  {
    name: 'Encrypted Vault, Privacy & Capital',
    icon: 'fas fa-shield-alt',
    color: '#818cf8',
    keywords: [
      'proton', 'protonmail', 'tutanota', 'bitwarden', '1password', 'lastpass', 'keepass',
      'dashlane', 'privacy.com', 'revolut', 'wise', 'stripe', 'paypal', 'westernunion',
      'zoho', 'mailerlite', 'sendgrid', 'nordvpn', 'mullvad', 'expressvpn', 'ledger',
      'trezor', 'metamask', 'bank', 'santander', 'bbva', 'caixabank', 'chase', 'hsbc',
      'banco', 'vault', 'password', 'passcode', 'vpn', 'pgp', 'auth', 'security', 'identity',
    ],
  },
  {
    name: 'Enterprise, Fleet & Operations',
    icon: 'fas fa-building',
    color: '#ec4899',
    keywords: [
      'upwork', 'fiverr', 'freelancer', 'linkedin', 'trello', 'jira', 'asana', 'notion',
      'monday', 'clickup', 'slack', 'teams', 'zoom', 'mercedes', 'taxi', 'fleet',
      'clickworker', 'indiehackers', 'hubspot', 'salesforce', 'erp', 'crm', 'dispatch',
      'zendesk', 'intercom', 'cal.com', 'calendly', 'airtable', 'coda', 'workplace', 'b2b',
    ],
  },
  {
    name: 'Administration, Legal & Government',
    icon: 'fas fa-landmark',
    color: '#eab308',
    keywords: [
      'gencat', 'sepe', 'seg-social', 'sede', 'agenciatributaria', 'aeat', 'hacienda', 'dgt',
      'boe', 'passport', 'passportindia', 'visa', 'blsinternational', 'consulado', 'embajada',
      'endesa', 'iberdrola', 'naturgy', 'consum', 'mercadona', 'ayuntamiento', 'padron',
      'certificadodigital', 'clave', 'fnmt', 'gov', 'gob', 'tramit', 'cita', 'seguridad social',
    ],
  },
  {
    name: 'Creative Media & 3D Engineering',
    icon: 'fas fa-cubes',
    color: '#06b6d4',
    keywords: [
      'figma', 'canva', 'adobe', 'photoshop', 'illustrator', 'turbosquid', 'sketchfab',
      'blender', 'unreal', 'unity', 'spline', 'proto.io', 'prezi', 'wondershare',
      'ilovepdf', 'pngtree', 'freepik', 'envato', 'unsplash', 'shutterstock', 'behance',
      'dribbble', 'artstation', '3d', 'render', 'svg', 'icon', 'video', 'editing', 'animation',
      'usertesting', 'surveoo', 'codecombat', 'themoviedb', 'tmdb', 'mynetdiary',
    ],
  },
  {
    name: 'Global Communication & Social Media',
    icon: 'fas fa-share-alt',
    color: '#a855f7',
    keywords: [
      'twitter', 'x.com', 'instagram', 'facebook', 'reddit', 'youtube', 'tiktok', 'threads',
      'telegram', 'whatsapp', 'discord', 'twitch', 'spotify', 'netflix', 'pinterest',
      'medium', 'substack', 'mastodon', 'bluesky', 'social', 'podcast', 'channel',
    ],
  },
];

/**
 * Classify a service into an institutional sector based on title, url, username, and description
 */
export function classifyService(title = '', url = '', username = '', description = '') {
  const textToScan = [
    title || '',
    url || '',
    username || '',
    description || '',
  ].join(' ').toLowerCase();

  // 1. Try matching against sector keywords
  for (const sector of INSTITUTIONAL_SECTORS) {
    for (const kw of sector.keywords) {
      if (textToScan.includes(kw.toLowerCase())) {
        return {
          sectorName: sector.name,
          icon: sector.icon,
          color: sector.color,
          matchedKeyword: kw,
        };
      }
    }
  }

  // 2. Specific domain heuristic analysis
  if (url) {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('finance') || host.includes('trade') || host.includes('crypto') || host.includes('coin')) {
        return { sectorName: 'Quant & Algorithmic Trading', icon: 'fas fa-chart-line', color: '#38bdf8' };
      }
      if (host.includes('.ai') || host.includes('bot') || host.includes('gpt')) {
        return { sectorName: 'Artificial Intelligence & Compute', icon: 'fas fa-brain', color: '#10b981' };
      }
      if (host.includes('cloud') || host.includes('dev') || host.includes('host') || host.includes('api') || host.includes('git')) {
        return { sectorName: 'Cloud Infrastructure & Automation', icon: 'fas fa-server', color: '#f59e0b' };
      }
      if (host.includes('vault') || host.includes('mail') || host.includes('sec') || host.includes('auth') || host.includes('pay')) {
        return { sectorName: 'Encrypted Vault, Privacy & Capital', icon: 'fas fa-shield-alt', color: '#818cf8' };
      }
      if (host.includes('.gov') || host.includes('.gob') || host.includes('gencat') || host.includes('sede')) {
        return { sectorName: 'Administration, Legal & Government', icon: 'fas fa-landmark', color: '#eab308' };
      }
      if (host.includes('design') || host.includes('3d') || host.includes('photo') || host.includes('art')) {
        return { sectorName: 'Creative Media & 3D Engineering', icon: 'fas fa-cubes', color: '#06b6d4' };
      }
    } catch {
      // ignore URL parse errors
    }
  }

  // 3. Fallback to Quant & Algorithmic Trading if empty, or General
  return {
    sectorName: 'Quant & Algorithmic Trading',
    icon: 'fas fa-chart-line',
    color: '#38bdf8',
    matchedKeyword: null,
  };
}

/**
 * Auto-organizes a flat array of items into clean, categorized institutional sectors
 */
export function autoOrganizeSections(sections = []) {
  if (!sections || sections.length === 0) return [];

  // Extract all items from all existing sections
  const allItems = [];
  sections.forEach((sec) => {
    (sec.items || []).forEach((it) => {
      allItems.push({
        ...it,
        originalSection: sec.name,
      });
    });
  });

  // Map to group items by sector name
  const sectorGroups = {};

  // Initialize known institutional sectors
  INSTITUTIONAL_SECTORS.forEach((sec) => {
    sectorGroups[sec.name] = {
      name: sec.name,
      icon: sec.icon,
      items: [],
    };
  });

  // Keep track of any dynamic categories created
  const dynamicSectors = {};

  allItems.forEach((item) => {
    const match = classifyService(item.title, item.url, item.username, item.description);
    const targetSector = match.sectorName;
    const sectorIcon = match.icon;

    const cleanItem = {
      title: item.title,
      url: item.url,
      icon: item.icon,
    };
    if (item.username) cleanItem.username = item.username;
    if (item.password) cleanItem.password = item.password;
    if (item.passcode) cleanItem.passcode = item.passcode;
    if (item.description) cleanItem.description = item.description;

    if (sectorGroups[targetSector]) {
      sectorGroups[targetSector].items.push(cleanItem);
    } else {
      if (!dynamicSectors[targetSector]) {
        dynamicSectors[targetSector] = {
          name: targetSector,
          icon: sectorIcon,
          items: [],
        };
      }
      dynamicSectors[targetSector].items.push(cleanItem);
    }
  });

  const result = [];

  INSTITUTIONAL_SECTORS.forEach((sec) => {
    result.push({
      name: sec.name,
      icon: sec.icon,
      items: sectorGroups[sec.name]?.items || [],
    });
  });

  Object.values(dynamicSectors).forEach((sec) => {
    if (sec.items.length > 0) {
      result.push(sec);
    }
  });

  return result;
}
