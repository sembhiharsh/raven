<template>
  <div class="executive-header-wrap">
    <router-link to="/" class="page-titles" :disabled="isEditMode">
      <!-- Nexus Sovereign Geometric Logo -->
      <div class="executive-logo-shield">
        <svg viewBox="0 0 40 40" class="logo-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="quant-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stop-color="#38bdf8" />
              <stop offset="0.5" stop-color="#3b82f6" />
              <stop offset="1" stop-color="#6366f1" />
            </linearGradient>
            <filter id="quant-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <polygon points="20,2 38,11 38,29 20,38 2,29 2,11" stroke="url(#quant-logo-grad)" stroke-width="2.5" fill="rgba(15, 23, 42, 0.85)" filter="url(#quant-glow)" />
          <polygon points="20,8 32,15 32,25 20,32 8,25 8,15" stroke="#38bdf8" stroke-width="1.2" stroke-dasharray="2 2" fill="none" opacity="0.6" />
          <circle cx="20" cy="20" r="3.5" fill="#38bdf8" />
          <line x1="20" y1="8" x2="20" y2="16" stroke="#38bdf8" stroke-width="1.2" />
          <line x1="20" y1="24" x2="20" y2="32" stroke="#38bdf8" stroke-width="1.2" />
          <line x1="8" y1="15" x2="16" y2="20" stroke="#38bdf8" stroke-width="1.2" />
          <line x1="24" y1="20" x2="32" y2="25" stroke="#38bdf8" stroke-width="1.2" />
        </svg>
      </div>

      <!-- Page heading and sub-heading -->
      <div class="text">
        <div class="brand-row">
          <h1>{{ title || 'NEXUS TERMINAL' }}</h1>
          <span class="version-chip">v4.8 QUANT</span>
        </div>
        <span class="subtitle">{{ description || 'Sovereign Command & Multi-Asset Intelligence Matrix' }}</span>
      </div>
      <EditModeIcon v-if="isEditMode" @click.stop.prevent="editTitle()"
        class="edit-icon" v-tooltip="tooltip()" />
    </router-link>

    <!-- Real-time Quant Telemetry Bar -->
    <div class="quant-telemetry-bar">
      <div class="telemetry-pill live-indicator" title="Red Cuántica Operativa y Encriptada">
        <span class="live-dot"></span>
        <span class="telemetry-label">GRID ONLINE</span>
      </div>
      <div class="telemetry-pill clock-pill" title="Hora Oficial UTC y Local">
        <i class="far fa-clock"></i>
        <span class="clock-val">{{ utcTime }} <small>UTC</small></span>
        <span class="clock-sep">•</span>
        <span class="clock-val">{{ localTime }} <small>LOCAL</small></span>
      </div>
      <div class="telemetry-pill endpoints-pill" title="Servicios y Terminales Activos">
        <i class="fas fa-server"></i>
        <span>{{ totalEndpoints }} NODOS</span>
      </div>
      <div class="telemetry-pill sec-pill" title="Cifrado Militar de Grado Institucional">
        <i class="fas fa-shield-alt"></i>
        <span>AES-256</span>
      </div>
      <!-- Manual Add Trigger Button -->
      <button class="telemetry-pill add-telemetry-btn" @click.stop.prevent="openManualAdd" title="Añadir sitio web, usuario y contraseña manualmente">
        <i class="fas fa-plus"></i>
        <span>+ AÑADIR SERVICIO</span>
      </button>
      <!-- Settings Trigger Button -->
      <button class="telemetry-pill settings-telemetry-btn" @click.stop.prevent="openSettings" title="Configuración del Terminal y Opciones de Eliminación">
        <i class="fas fa-cog"></i>
        <span>⚙️ AJUSTES</span>
      </button>
    </div>
  </div>
</template>

<script>
import EditModeIcon from '@/assets/interface-icons/interactive-editor-edit-mode.svg';
import StoreKeys from '@/utils/StoreMutations';
import { modalNames } from '@/utils/config/defaults';

export default {
  name: 'PageTitle',
  props: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
  },
  components: {
    EditModeIcon,
  },
  data() {
    return {
      utcTime: '',
      localTime: '',
      timer: null,
    };
  },
  mounted() {
    this.updateClocks();
    this.timer = setInterval(this.updateClocks, 1000);
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },
  computed: {
    isEditMode() {
      return this.$store.state.editMode;
    },
    totalEndpoints() {
      const sections = this.$store.state.config?.sections || [];
      return sections.reduce((acc, s) => acc + (s.items?.length || 0), 0) || 0;
    },
  },
  methods: {
    updateClocks() {
      const now = new Date();
      this.utcTime = now.toUTCString().slice(17, 25);
      this.localTime = now.toTimeString().slice(0, 8);
    },
    openManualAdd() {
      window.dispatchEvent(new CustomEvent('open-manual-add'));
    },
    openSettings() {
      window.dispatchEvent(new CustomEvent('open-terminal-settings'));
    },
    /* On edit button click, open the edit pageInfo modal */
    editTitle() {
      this.$modal.show(modalNames.EDIT_PAGE_INFO);
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
    },
    /* Edit button tooltip */
    tooltip() {
      const content = this.$t('interactive-editor.menu.edit-page-info-btn');
      return { content };
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/styles/media-queries.scss';

.executive-header-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1.5rem;
  padding: 0.25rem 0;
}

.page-titles {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
  position: relative;
  gap: 14px;

  .executive-logo-shield {
    width: 44px;
    height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4));
    transition: transform 0.3s ease;

    svg.logo-svg {
      width: 100%;
      height: 100%;
    }
  }

  &:hover .executive-logo-shield {
    transform: scale(1.08) rotate(3deg);
  }

  .text {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .brand-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h1 {
    color: #ffffff;
    font-size: clamp(1.2rem, 0.8rem + 1.2vw, 1.75rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0;
    text-transform: uppercase;
    background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .version-chip {
    background: rgba(59, 130, 246, 0.18);
    border: 1px solid rgba(59, 130, 246, 0.4);
    color: #38bdf8;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    letter-spacing: 0.08em;
    font-family: 'JetBrains Mono', monospace;
  }

  span.subtitle {
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 500;
    margin-top: 2px;
    letter-spacing: 0.02em;
  }

  &[disabled] {
    cursor: default;
  }

  svg.edit-icon {
    width: 1rem;
    height: 1rem;
    padding: 0.25rem;
    margin: 0.25rem;
    cursor: pointer;
    color: var(--primary);
    border: 1px solid var(--background-darker);
    border-radius: var(--curve-factor);
    &:hover { border: 1px solid var(--primary); }
  }
}

/* Real-time Quant Telemetry Bar */
.quant-telemetry-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;

  .telemetry-pill {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #cbd5e1;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.03em;
    backdrop-filter: blur(8px);
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(59, 130, 246, 0.4);
      color: #ffffff;
      background: rgba(30, 41, 59, 0.85);
    }

    i {
      color: #38bdf8;
      font-size: 0.8rem;
    }
  }

  .live-indicator {
    border-color: rgba(16, 185, 129, 0.35);
    background: rgba(16, 185, 129, 0.1);
    color: #34d399;

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse-dot 1.8s infinite;
    }
  }

  .clock-pill {
    .clock-val {
      color: #f8fafc;
      small {
        color: #64748b;
        font-size: 0.65rem;
        margin-left: 2px;
      }
    }
    .clock-sep {
      color: #475569;
    }
  }

  .sec-pill {
    border-color: rgba(99, 102, 241, 0.35);
    color: #818cf8;
    i { color: #818cf8; }
  }

  .add-telemetry-btn {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(56, 189, 248, 0.2) 100%) !important;
    border-color: rgba(56, 189, 248, 0.5) !important;
    color: #38bdf8 !important;
    font-weight: 700 !important;
    cursor: pointer !important;

    i {
      color: #38bdf8 !important;
    }

    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
      border-color: #60a5fa !important;
      color: #ffffff !important;
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.45) !important;

      i { color: #ffffff !important; }
    }
  }

  .settings-telemetry-btn {
    background: rgba(30, 41, 59, 0.8) !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
    color: #cbd5e1 !important;
    font-weight: 600 !important;
    cursor: pointer !important;

    i {
      color: #94a3b8 !important;
      transition: transform 0.3s ease, color 0.2s ease;
    }

    &:hover {
      background: rgba(51, 65, 85, 0.9) !important;
      border-color: #38bdf8 !important;
      color: #ffffff !important;
      box-shadow: 0 0 15px rgba(56, 189, 248, 0.3) !important;

      i {
        color: #38bdf8 !important;
        transform: rotate(45deg);
      }
    }
  }
}

@keyframes pulse-dot {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; filter: drop-shadow(0 0 6px #10b981); }
  100% { transform: scale(0.95); opacity: 0.7; }
}

@include phone {
  .executive-header-wrap {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .quant-telemetry-bar {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
