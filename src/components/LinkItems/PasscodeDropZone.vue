<template>
  <div class="passcode-drop-wrapper">
    <!-- Full-window drag overlay (activates when dragging files/links into browser) -->
    <div
      v-if="isDraggingWindow"
      class="global-drag-overlay"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onFileDrop"
    >
      <div class="global-drag-card">
        <div class="pulse-drop-icon">
          <i class="fas fa-file-import"></i>
        </div>
        <h2>¡Suelta aquí tus códigos o archivos!</h2>
        <p>Detectaremos automáticamente contraseñas, URLs y accesos guardados.</p>
      </div>
    </div>

    <!-- Empty State Hero (shown when dashboard has no items/sections) -->
    <div v-if="isEmptyState" class="hero-dropzone-container">
      <div class="hero-dropzone-card">
        <div class="hero-header">
          <div class="hero-shield-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2 class="hero-title">Terminal Listo para tus Accesos</h2>
          <p class="hero-subtitle">
            Añade manualmente tus sitios web y contraseñas o arrastra tus archivos guardados.
          </p>
        </div>

        <!-- Action Choice Buttons -->
        <div class="empty-state-actions">
          <button class="primary-hero-btn" @click="showManualModal = true">
            <i class="fas fa-edit"></i>
            <span>✍️ Añadir Servicio Manualmente</span>
          </button>
          <button class="secondary-hero-btn" @click="triggerFileInput">
            <i class="fas fa-file-import"></i>
            <span>📁 Importar Archivo CSV / JSON</span>
          </button>
        </div>

        <!-- Interactive Drag & Drop Box -->
        <div
          class="drop-box"
          :class="{ 'drop-box-active': isDraggingBox }"
          @dragover.prevent="isDraggingBox = true"
          @dragleave.prevent="isDraggingBox = false"
          @drop.prevent="onFileDrop"
          @click="triggerFileInput"
        >
          <input
            type="file"
            ref="fileInput"
            class="hidden-file-input"
            accept=".csv,.json,.yml,.yaml,.txt,.html,.htm"
            @change="onFileInputChange"
          />
          <div class="drop-box-content">
            <div class="drop-upload-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div class="drop-instructions">
              <span class="drop-main-text">Arrastra y suelta tu archivo aquí</span>
              <span class="drop-sub-text">o haz clic para explorar en tu equipo</span>
            </div>
            <div class="supported-badges">
              <span class="badge">Chrome CSV</span>
              <span class="badge">Bitwarden JSON/CSV</span>
              <span class="badge">1Password</span>
              <span class="badge">YAML / HTML</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Quick Action Button (Accessible from anywhere) -->
    <div v-if="!isEmptyState" class="floating-passcode-trigger">
      <button
        class="floating-action-btn"
        @click="showManualModal = true"
        title="Añadir Sitio Web, Usuario y Contraseña"
      >
        <i class="fas fa-plus-circle"></i>
        <span>+ Añadir Servicio / Códigos</span>
      </button>
      <input
        type="file"
        ref="floatingFileInput"
        class="hidden-file-input"
        accept=".csv,.json,.yml,.yaml,.txt,.html,.htm"
        @change="onFloatingFileInputChange"
      />
    </div>

    <!-- 1. Dedicated Manual Add Modal -->
    <ManualAddModal
      :visible="showManualModal"
      @close="showManualModal = false"
      @import-detected="onImportDetected"
      @item-added="onItemAdded"
    />

    <!-- 2. Preview & Import Modal (for batch file drops) -->
    <PasscodeImportModal
      :visible="showPreviewModal"
      :items="detectedItems"
      @close="showPreviewModal = false"
      @import-confirmed="handleImportConfirmed"
    />
  </div>
</template>

<script>
import { parseDroppedContent, convertItemsToSections } from '@/utils/passcodeParser';
import PasscodeImportModal from '@/components/LinkItems/PasscodeImportModal.vue';
import ManualAddModal from '@/components/LinkItems/ManualAddModal.vue';
import StoreKeys from '@/utils/StoreMutations';
import ConfigSavingMixin from '@/mixins/ConfigSaving';

export default {
  name: 'PasscodeDropZone',
  mixins: [ConfigSavingMixin],
  components: {
    PasscodeImportModal,
    ManualAddModal,
  },
  props: {
    isEmptyState: { type: Boolean, default: false },
  },
  data() {
    return {
      isDraggingWindow: false,
      isDraggingBox: false,
      showManualModal: false,
      showPreviewModal: false,
      detectedItems: [],
      dragCounter: 0,
    };
  },
  mounted() {
    window.addEventListener('dragenter', this.onWindowDragEnter);
    window.addEventListener('dragleave', this.onWindowDragLeave);
    window.addEventListener('dragover', this.onDragOver);
    window.addEventListener('drop', this.onFileDrop);
    window.addEventListener('open-manual-add', this.openManualModal);
  },
  beforeUnmount() {
    window.removeEventListener('dragenter', this.onWindowDragEnter);
    window.removeEventListener('dragleave', this.onWindowDragLeave);
    window.removeEventListener('dragover', this.onDragOver);
    window.removeEventListener('drop', this.onFileDrop);
    window.removeEventListener('open-manual-add', this.openManualModal);
  },
  methods: {
    openManualModal() {
      this.showManualModal = true;
    },
    onWindowDragEnter(e) {
      this.dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.length > 0) {
        this.isDraggingWindow = true;
      }
    },
    onWindowDragLeave(e) {
      this.dragCounter--;
      if (this.dragCounter <= 0) {
        this.dragCounter = 0;
        this.isDraggingWindow = false;
      }
    },
    onDragOver(e) {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    async onFileDrop(e) {
      e.preventDefault();
      this.isDraggingWindow = false;
      this.isDraggingBox = false;
      this.dragCounter = 0;

      const dt = e.dataTransfer;
      if (!dt) return;

      if (dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        await this.processFile(file);
        return;
      }

      const droppedText = dt.getData('text/uri-list') || dt.getData('text/plain') || dt.getData('text/html');
      if (droppedText) {
        await this.processTextContent(droppedText);
      }
    },
    triggerFileInput() {
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click();
      } else if (this.$refs.floatingFileInput) {
        this.$refs.floatingFileInput.click();
      }
    },
    async onFileInputChange(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        await this.processFile(file);
      }
      e.target.value = '';
    },
    async onFloatingFileInputChange(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        await this.processFile(file);
      }
      e.target.value = '';
    },
    async processFile(file) {
      try {
        const items = await parseDroppedContent(file, file.name);
        if (items && items.length > 0) {
          this.detectedItems = items;
          this.showPreviewModal = true;
        } else {
          alert('No se pudieron detectar códigos o enlaces válidos en el archivo.');
        }
      } catch (err) {
        console.error('Error procesando archivo:', err);
        alert('Error al leer el archivo. Asegúrate de que sea un archivo de texto, CSV, JSON o YAML válido.');
      }
    },
    async processTextContent(text) {
      try {
        const items = await parseDroppedContent(text, 'pasted.txt');
        if (items && items.length > 0) {
          this.detectedItems = items;
          this.showPreviewModal = true;
        } else {
          alert('No se encontraron elementos válidos en el texto ingresado.');
        }
      } catch (err) {
        console.error('Error procesando texto:', err);
        alert('Error al procesar el texto.');
      }
    },
    onImportDetected(items) {
      this.detectedItems = items;
      this.showPreviewModal = true;
    },
    onItemAdded() {
      this.$emit('imported');
    },
    async handleImportConfirmed(payload) {
      const { items, groupMode, customSectionName } = payload;
      const newSections = convertItemsToSections(items, {
        groupBy: groupMode,
        defaultSectionName: customSectionName || 'Códigos Guardados',
      });

      const currentSections = this.$store.state.config?.sections || [];
      const mergedSections = [...currentSections, ...newSections];

      this.$store.commit(StoreKeys.SET_SECTIONS, mergedSections);

      const fullConfig = {
        ...this.$store.state.config,
        sections: mergedSections,
      };

      await this.writeConfigToDisk(fullConfig);
      this.saveConfigLocally(fullConfig);

      this.$emit('imported');
    },
  },
};
</script>

<style scoped lang="scss">
.passcode-drop-wrapper {
  width: 100%;
}

/* Full-Window Drag Overlay */
.global-drag-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 14, 0.88);
  backdrop-filter: blur(16px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  pointer-events: all;
  animation: fadeIn 0.15s ease-out;
}

.global-drag-card {
  background: #0f172a;
  border: 2px dashed #38bdf8;
  border-radius: 24px;
  padding: 3.5rem 4rem;
  text-align: center;
  max-width: 580px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.25);
  color: #f8fafc;
  animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  .pulse-drop-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #38bdf8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    margin: 0 auto 1.5rem auto;
    animation: pulseIcon 1.5s infinite;
  }

  h2 {
    font-size: 1.6rem;
    font-weight: 800;
    margin: 0 0 0.6rem 0;
    color: #ffffff;
  }

  p {
    color: #94a3b8;
    font-size: 1rem;
    margin: 0;
  }
}

/* Empty State Hero */
.hero-dropzone-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1.5rem;
  max-width: 780px;
  margin: 0 auto;
}

.hero-dropzone-card {
  width: 100%;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2.5rem 2.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(56, 189, 248, 0.1);
  text-align: center;
  color: #f8fafc;
}

.hero-header {
  margin-bottom: 1.75rem;

  .hero-shield-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem auto;
  }

  .hero-title {
    font-size: 1.55rem;
    font-weight: 800;
    margin: 0 0 0.5rem 0;
    color: #ffffff;
  }

  .hero-subtitle {
    color: #94a3b8;
    font-size: 0.95rem;
    margin: 0 auto;
    max-width: 520px;
    line-height: 1.5;
  }
}

.empty-state-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;

  .primary-hero-btn {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    padding: 0.85rem 1.6rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.55);
    }
  }

  .secondary-hero-btn {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #cbd5e1;
    border-radius: 12px;
    padding: 0.85rem 1.4rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(56, 189, 248, 0.12);
      border-color: #38bdf8;
      color: #ffffff;
    }
  }
}

.drop-box {
  border: 2px dashed rgba(59, 130, 246, 0.4);
  background: rgba(11, 15, 25, 0.6);
  border-radius: 18px;
  padding: 2.25rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover, &.drop-box-active {
    border-color: #38bdf8;
    background: rgba(30, 41, 59, 0.8);
    transform: translateY(-2px);
  }

  .hidden-file-input { display: none; }

  .drop-instructions {
    margin: 1rem 0;

    .drop-main-text {
      display: block;
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .drop-sub-text {
      display: block;
      font-size: 0.85rem;
      color: #94a3b8;
      margin-top: 4px;
    }
  }

  .supported-badges {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;

    .badge {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.72rem;
      color: #cbd5e1;
    }
  }
}

/* Floating Action Trigger */
.floating-passcode-trigger {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
}

.floating-action-btn {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 30px;
  padding: 0.85rem 1.6rem;
  font-size: 0.92rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2);
  backdrop-filter: blur(12px);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Plus Jakarta Sans', sans-serif;

  &:hover {
    transform: translateY(-3px) scale(1.03);
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: #ffffff;
    border-color: #60a5fa;
    box-shadow: 0 14px 35px rgba(37, 99, 235, 0.45), 0 0 20px rgba(59, 130, 246, 0.4);
  }
}

@keyframes pulseIcon {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

@keyframes scaleUp {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
