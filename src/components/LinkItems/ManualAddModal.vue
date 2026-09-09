<template>
  <div v-if="visible" class="manual-add-overlay" @click.self="close">
    <div class="manual-add-card">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="fas fa-plus-circle"></i>
          </div>
          <div>
            <h3>Añadir Nuevo Acceso o Servicio</h3>
            <p class="subtitle">Guarda un sitio web, usuario y contraseña directamente en tu terminal</p>
          </div>
        </div>
        <button class="close-btn" @click="close" title="Cerrar">&times;</button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="modal-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'manual' }"
          @click="activeTab = 'manual'"
        >
          <i class="fas fa-edit"></i>
          <span>✍️ Entrada Manual</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'file' }"
          @click="activeTab = 'file'"
        >
          <i class="fas fa-file-import"></i>
          <span>📁 Importar Archivo (CSV / JSON)</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'paste' }"
          @click="activeTab = 'paste'"
        >
          <i class="fas fa-paste"></i>
          <span>📋 Pegar Lista de Texto</span>
        </button>
      </div>

      <!-- Modal Body Content -->
      <div class="modal-body">
        <!-- 1. MANUAL ENTRY FORM -->
        <div v-if="activeTab === 'manual'" class="manual-form">
          <div class="form-grid">
            <!-- Website Name -->
            <div class="form-group span-6">
              <label><i class="fas fa-globe"></i> Nombre del Sitio o Servicio <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.title"
                placeholder="Ej: Binance Pro, OpenAI, Interactive Brokers"
                class="form-input"
                @input="onTitleInput"
                required
              />
            </div>

            <!-- Website Link / URL -->
            <div class="form-group span-6">
              <label><i class="fas fa-link"></i> Enlace / URL <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.url"
                placeholder="https://..."
                class="form-input"
                @blur="onUrlBlur"
                required
              />
            </div>

            <!-- Username / Email -->
            <div class="form-group span-6">
              <label><i class="far fa-user"></i> Usuario, Correo o ID</label>
              <input
                type="text"
                v-model="form.username"
                placeholder="Ej: trader@quantfirm.com o mi_usuario"
                class="form-input"
              />
            </div>

            <!-- Passcode / Password -->
            <div class="form-group span-6">
              <label><i class="fas fa-key"></i> Código o Contraseña</label>
              <div class="passcode-input-wrap">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="form.password"
                  placeholder="Introduce la clave o contraseña"
                  class="form-input pass-field"
                />
                <button
                  type="button"
                  class="input-action-btn"
                  @click="showPassword = !showPassword"
                  :title="showPassword ? 'Ocultar' : 'Mostrar'"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
                <button
                  type="button"
                  class="input-action-btn gen-btn"
                  @click="generateRandomPassword"
                  title="Generar contraseña segura aleatoria"
                >
                  <i class="fas fa-magic"></i>
                </button>
              </div>
            </div>

            <!-- Section / Category Selection -->
            <div class="form-group span-6">
              <div class="label-row-flex">
                <label><i class="fas fa-layer-group"></i> Sector o Categoría <span class="req">*</span></label>
                <span v-if="detectedSectorBadge" class="auto-detected-badge" :title="`Clasificado automáticamente por algoritmo`">
                  ✨ Auto: {{ detectedSectorBadge }}
                </span>
              </div>
              <select v-model="selectedSectionChoice" class="form-select" @change="onUserSelectedSection">
                <option value="__AUTO__">✨ [Auto-Detectar Inteligente por Nombre/URL]</option>
                <option v-for="sec in availableSections" :key="sec.name" :value="sec.name">
                  {{ sec.name }}
                </option>
                <option value="__NEW__">+ Nueva Sección Personalizada...</option>
              </select>
              <input
                v-if="selectedSectionChoice === '__NEW__'"
                type="text"
                v-model="customSectionName"
                placeholder="Escribe el nombre del nuevo sector"
                class="form-input custom-sec-input"
              />
            </div>

            <!-- Description / Role / Notes -->
            <div class="form-group span-6">
              <label><i class="fas fa-info-circle"></i> Descripción o Rol (Opcional)</label>
              <input
                type="text"
                v-model="form.description"
                placeholder="Ej: Cuenta Principal, Spot API, Workspace Pro"
                class="form-input"
                @input="onFieldInput"
              />
            </div>

            <!-- Custom Icon URL -->
            <div class="form-group span-12">
              <label><i class="far fa-image"></i> Icono o Logo (URL o FontAwesome)</label>
              <div class="icon-input-wrap">
                <div class="icon-preview-box">
                  <img
                    v-if="computedIcon && computedIcon.startsWith('http')"
                    :src="computedIcon"
                    @error="iconLoadError = true"
                    alt="logo"
                  />
                  <i v-else :class="computedIcon || 'fas fa-cube'"></i>
                </div>
                <input
                  type="text"
                  v-model="form.icon"
                  :placeholder="autoGeneratedIconPlaceholder"
                  class="form-input icon-field"
                />
                <button
                  type="button"
                  class="auto-icon-btn"
                  @click="autoGenerateIcon"
                  title="Detectar logo oficial automáticamente desde la URL"
                >
                  <i class="fas fa-sync-alt"></i> Auto
                </button>
              </div>
            </div>
          </div>

          <!-- Live Card Preview -->
          <div class="preview-container">
            <span class="preview-label">Vista Previa del Resultado:</span>
            <div class="card-preview-tile">
              <div class="preview-icon">
                <img
                  v-if="computedIcon && computedIcon.startsWith('http') && !iconLoadError"
                  :src="computedIcon"
                  alt="icon"
                />
                <i v-else :class="computedIcon || 'fas fa-cube'"></i>
              </div>
              <div class="preview-content">
                <div class="preview-title">{{ form.title || 'Nombre del Sitio' }}</div>
                <div class="preview-sub">
                  <span class="preview-desc">{{ form.description || form.url || 'https://ejemplo.com' }}</span>
                  <span v-if="form.username" class="preview-user">👤 {{ form.username }}</span>
                </div>
              </div>
              <div v-if="form.password" class="preview-badge">
                <i class="fas fa-key"></i>
                <span>••••••</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. FILE IMPORT DROPZONE -->
        <div v-else-if="activeTab === 'file'" class="file-tab">
          <div
            class="modal-drop-area"
            :class="{ active: isDraggingBox }"
            @dragover.prevent="isDraggingBox = true"
            @dragleave.prevent="isDraggingBox = false"
            @drop.prevent="onDropFile"
            @click="$refs.modalFileInput.click()"
          >
            <input
              type="file"
              ref="modalFileInput"
              class="hidden-input"
              accept=".csv,.json,.yml,.yaml,.txt,.html,.htm"
              @change="onFileInputChange"
            />
            <div class="drop-icon-large">
              <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <h4>Arrastra y suelta tu archivo aquí</h4>
            <p>o haz clic para buscar en tu equipo</p>
            <div class="badge-row">
              <span class="badge">Chrome CSV</span>
              <span class="badge">Bitwarden JSON/CSV</span>
              <span class="badge">1Password</span>
              <span class="badge">YAML / HTML</span>
            </div>
          </div>
        </div>

        <!-- 3. QUICK TEXT PASTE -->
        <div v-else-if="activeTab === 'paste'" class="paste-tab">
          <p class="paste-instructions">
            Pega una o varias líneas con formato: <code>Nombre, URL, Usuario, Contraseña</code>
          </p>
          <textarea
            v-model="pastedText"
            rows="6"
            class="paste-box"
            placeholder="Ejemplo:
Binance Pro, https://binance.com, trader@quant.com, ClaveSegura123!
TradingView, https://tradingview.com, pro_trader, TVPass2026_
OpenAI API, https://platform.openai.com, dev@ai.com, sk-proj-12345"
          ></textarea>
          <div class="paste-action-row">
            <button
              class="process-btn"
              :disabled="!pastedText.trim()"
              @click="processPastedText"
            >
              <i class="fas fa-bolt"></i> Procesar y Añadir
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer Actions -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="close">Cancelar</button>
        <div class="right-actions" v-if="activeTab === 'manual'">
          <button
            class="save-another-btn"
            :disabled="!canSave || isSaving"
            @click="saveItem(true)"
          >
            <i class="fas fa-plus"></i> Guardar y Añadir Otro
          </button>
          <button
            class="save-confirm-btn"
            :disabled="!canSave || isSaving"
            @click="saveItem(false)"
          >
            <span v-if="!isSaving">
              <i class="fas fa-check-circle"></i> Guardar en el Panel
            </span>
            <span v-else>
              <i class="fas fa-spinner fa-spin"></i> Guardando...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConfigSavingMixin from '@/mixins/ConfigSaving';
import StoreKeys from '@/utils/StoreMutations';
import { parseDroppedContent, convertItemsToSections } from '@/utils/passcodeParser';
import { classifyService } from '@/utils/smartClassifier';

export default {
  name: 'ManualAddModal',
  mixins: [ConfigSavingMixin],
  props: {
    visible: { type: Boolean, default: false },
    defaultSection: { type: String, default: '' },
  },
  data() {
    return {
      activeTab: 'manual',
      showPassword: false,
      isSaving: false,
      isDraggingBox: false,
      iconLoadError: false,
      selectedSectionChoice: '__AUTO__',
      customSectionName: '',
      detectedSectorBadge: '',
      userManuallyPickedSection: false,
      pastedText: '',
      form: {
        title: '',
        url: '',
        username: '',
        password: '',
        description: '',
        icon: '',
      },
    };
  },
  computed: {
    availableSections() {
      return this.$store.state.config?.sections || [];
    },
    effectiveSectionName() {
      if (this.selectedSectionChoice === '__NEW__') {
        return this.customSectionName.trim() || 'Servicios Añadidos';
      }
      if (this.selectedSectionChoice === '__AUTO__' || !this.userManuallyPickedSection) {
        if (this.detectedSectorBadge) {
          return this.detectedSectorBadge;
        }
        const match = classifyService(this.form.title, this.form.url, this.form.username, this.form.description);
        return match.sectorName;
      }
      return this.selectedSectionChoice || 'Quant & Algorithmic Trading';
    },
    computedIcon() {
      if (this.form.icon && this.form.icon.trim()) {
        return this.form.icon.trim();
      }
      return this.getAutoFavicon(this.form.url);
    },
    autoGeneratedIconPlaceholder() {
      if (this.form.url && this.form.url.includes('http')) {
        return this.getAutoFavicon(this.form.url);
      }
      return 'Auto detectado desde la URL (o pega URL de logo / clase fa-*)';
    },
    canSave() {
      return this.form.title.trim().length > 0 && this.form.url.trim().length > 0;
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.initForm();
        }
      },
    },
    defaultSection: {
      immediate: true,
      handler(newSec) {
        if (newSec) {
          this.selectedSectionChoice = newSec;
          this.userManuallyPickedSection = true;
        }
      },
    },
  },
  methods: {
    initForm() {
      const sections = this.availableSections;
      if (this.defaultSection && sections.some((s) => s.name === this.defaultSection)) {
        this.selectedSectionChoice = this.defaultSection;
        this.userManuallyPickedSection = true;
      } else {
        this.selectedSectionChoice = '__AUTO__';
        this.userManuallyPickedSection = false;
      }
      this.detectedSectorBadge = '';
      this.iconLoadError = false;
    },
    close() {
      this.$emit('close');
    },
    runAutoClassification() {
      if (!this.form.title && !this.form.url) {
        this.detectedSectorBadge = '';
        return;
      }
      const match = classifyService(this.form.title, this.form.url, this.form.username, this.form.description);
      this.detectedSectorBadge = match.sectorName;

      if (!this.userManuallyPickedSection || this.selectedSectionChoice === '__AUTO__') {
        // If the detected sector exists in sections, choose it
        const exists = this.availableSections.find((s) => s.name === match.sectorName);
        if (exists) {
          this.selectedSectionChoice = exists.name;
        } else {
          this.selectedSectionChoice = '__AUTO__';
        }
      }
    },
    onTitleInput() {
      this.runAutoClassification();
    },
    onFieldInput() {
      this.runAutoClassification();
    },
    onUrlBlur() {
      let url = this.form.url.trim();
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
        this.form.url = url;
      }
      this.iconLoadError = false;
      this.runAutoClassification();
    },
    onUserSelectedSection() {
      if (this.selectedSectionChoice === '__AUTO__') {
        this.userManuallyPickedSection = false;
        this.runAutoClassification();
      } else if (this.selectedSectionChoice === '__NEW__') {
        this.userManuallyPickedSection = true;
        if (!this.customSectionName) this.customSectionName = 'Nueva Sección';
      } else {
        this.userManuallyPickedSection = true;
      }
    },
    async saveItem(keepOpen = false) {
      if (!this.canSave) return;
      this.isSaving = true;

      const targetSectionName = this.effectiveSectionName;
      let iconUrl = this.form.icon.trim();
      if (!iconUrl) {
        iconUrl = this.getAutoFavicon(this.form.url);
      }

      const newItem = {
        title: this.form.title.trim(),
        url: this.form.url.trim(),
        icon: iconUrl || 'fas fa-globe',
      };

      if (this.form.username.trim()) {
        newItem.username = this.form.username.trim();
      }

      if (this.form.password.trim()) {
        newItem.password = this.form.password.trim();
        newItem.passcode = this.form.password.trim();
      }

      if (this.form.description.trim()) {
        newItem.description = this.form.description.trim();
      }

      // Clone existing sections
      const currentSections = JSON.parse(JSON.stringify(this.$store.state.config?.sections || []));
      const secIdx = currentSections.findIndex((s) => s.name === targetSectionName);

      if (secIdx >= 0) {
        // Append to existing section
        if (!currentSections[secIdx].items) currentSections[secIdx].items = [];
        currentSections[secIdx].items.push(newItem);
      } else {
        // Create new section
        currentSections.push({
          name: targetSectionName,
          icon: 'fas fa-layer-group',
          items: [newItem],
        });
      }

      // Update Vuex state
      this.$store.commit(StoreKeys.SET_SECTIONS, currentSections);

      // Build full config to persist
      const fullConfig = {
        ...this.$store.state.config,
        sections: currentSections,
      };

      try {
        await this.writeConfigToDisk(fullConfig);
        this.saveConfigLocally(fullConfig);
        this.$emit('item-added', newItem);

        if (keepOpen) {
          // Reset form for next item
          this.form.title = '';
          this.form.url = '';
          this.form.username = '';
          this.form.password = '';
          this.form.description = '';
          this.form.icon = '';
          this.iconLoadError = false;
        } else {
          this.close();
        }
      } catch (err) {
        console.error('Error guardando item:', err);
      } finally {
        this.isSaving = false;
      }
    },
    async onFileInputChange(e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        await this.handleParsedFile(file);
      }
      e.target.value = '';
    },
    async onDropFile(e) {
      this.isDraggingBox = false;
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        await this.handleParsedFile(file);
      }
    },
    async handleParsedFile(file) {
      try {
        const items = await parseDroppedContent(file, file.name);
        if (items && items.length > 0) {
          this.$emit('import-detected', items);
          this.close();
        } else {
          alert('No se pudieron detectar códigos válidos en el archivo.');
        }
      } catch (err) {
        console.error(err);
        alert('Error procesando archivo.');
      }
    },
    async processPastedText() {
      if (!this.pastedText.trim()) return;
      try {
        const items = await parseDroppedContent(this.pastedText, 'pasted.txt');
        if (items && items.length > 0) {
          this.$emit('import-detected', items);
          this.pastedText = '';
          this.close();
        } else {
          alert('No se detectaron elementos válidos en el texto.');
        }
      } catch (err) {
        console.error(err);
        alert('Error procesando texto.');
      }
    },
  },
};
</script>

<style scoped lang="scss">
.manual-add-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 14, 0.82);
  backdrop-filter: blur(16px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

.manual-add-card {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  width: 100%;
  max-width: 740px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15);
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  color: #f8fafc;
}

/* Modal Header */
.modal-header {
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.95);

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .header-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.3);
    color: #38bdf8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .subtitle {
    margin: 3px 0 0 0;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 1.8rem;
    cursor: pointer;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.15s ease;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

/* Tabs */
.modal-tabs {
  display: flex;
  background: rgba(11, 15, 25, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 1.5rem;
  gap: 8px;

  .tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0.85rem 1rem;
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
      color: #f1f5f9;
    }

    &.active {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
      background: rgba(56, 189, 248, 0.06);
    }
  }
}

/* Modal Body */
.modal-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px 16px;

  .span-6 { grid-column: span 6; }
  .span-12 { grid-column: span 12; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;

  .label-row-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .auto-detected-badge {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    font-size: 0.69rem;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
    animation: fadeIn 0.2s ease-out;
  }

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 6px;

    i { color: #38bdf8; font-size: 0.78rem; }
    .req { color: #f43f5e; }
  }
}

.form-input, .form-select {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 9px 12px;
  color: #ffffff;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #3b82f6;
    background: rgba(30, 41, 59, 1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }

  &::placeholder {
    color: #64748b;
    font-size: 0.84rem;
  }
}

.custom-sec-input {
  margin-top: 6px;
  border-color: #38bdf8;
}

/* Passcode Input Wrap */
.passcode-input-wrap {
  display: flex;
  align-items: center;
  position: relative;

  .pass-field {
    width: 100%;
    padding-right: 64px;
    font-family: 'JetBrains Mono', monospace;
  }

  .input-action-btn {
    position: absolute;
    right: 32px;
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 6px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    transition: color 0.15s ease;

    &:hover { color: #ffffff; }

    &.gen-btn {
      right: 6px;
      color: #38bdf8;
      &:hover { color: #60a5fa; }
    }
  }
}

/* Icon Input Wrap */
.icon-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;

  .icon-preview-box {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
    i {
      color: #38bdf8;
      font-size: 1.1rem;
    }
  }

  .icon-field {
    flex: 1;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
  }

  .auto-icon-btn {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(56, 189, 248, 0.25);
      color: #ffffff;
    }
  }
}

/* Live Card Preview Box */
.preview-container {
  margin-top: 1.25rem;
  background: rgba(11, 15, 25, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 12px 16px;

  .preview-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    margin-bottom: 8px;
  }

  .card-preview-tile {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 12px;
    padding: 10px 14px;

    .preview-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 22px; height: 22px; object-fit: contain; }
      i { color: #38bdf8; font-size: 1.1rem; }
    }

    .preview-content {
      flex: 1;
      min-width: 0;

      .preview-title {
        color: #ffffff;
        font-weight: 700;
        font-size: 0.95rem;
      }
      .preview-sub {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
      }
      .preview-desc {
        color: #94a3b8;
        font-size: 0.74rem;
      }
      .preview-user {
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 1px 6px;
        color: #38bdf8;
        font-size: 0.68rem;
        font-family: 'JetBrains Mono', monospace;
      }
    }

    .preview-badge {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 7px;
      padding: 3px 8px;
      color: #60a5fa;
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

/* File Tab Dropzone */
.modal-drop-area {
  border: 2px dashed rgba(59, 130, 246, 0.4);
  background: rgba(15, 23, 42, 0.6);
  border-radius: 16px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover, &.active {
    border-color: #38bdf8;
    background: rgba(30, 41, 59, 0.8);
    transform: translateY(-2px);
  }

  .hidden-input { display: none; }

  .drop-icon-large {
    font-size: 3rem;
    color: #38bdf8;
    margin-bottom: 10px;
  }

  h4 {
    margin: 0;
    font-size: 1.15rem;
    color: #ffffff;
  }

  p {
    margin: 4px 0 1rem 0;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .badge-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;

    .badge {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.72rem;
      color: #cbd5e1;
    }
  }
}

/* Paste Tab */
.paste-tab {
  .paste-instructions {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-bottom: 8px;
    code {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #38bdf8;
      font-family: 'JetBrains Mono', monospace;
    }
  }

  .paste-box {
    width: 100%;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    padding: 12px;
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    outline: none;
    box-sizing: border-box;

    &:focus {
      border-color: #38bdf8;
    }
  }

  .paste-action-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;

    .process-btn {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 8px 16px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        box-shadow: 0 4px 15px rgba(37, 99, 235, 0.5);
      }
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

/* Modal Footer */
.modal-footer {
  padding: 1rem 1.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.95);

  .cancel-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #94a3b8;
    border-radius: 10px;
    padding: 8px 16px;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .save-another-btn {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    border-radius: 10px;
    padding: 8px 14px;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
      background: rgba(56, 189, 248, 0.15);
      color: #ffffff;
    }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .save-confirm-btn {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none;
    color: #ffffff;
    border-radius: 10px;
    padding: 8px 18px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
    }
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 640px) {
  .form-grid {
    .span-6 { grid-column: span 12; }
  }
  .modal-footer {
    flex-direction: column;
    gap: 10px;
    .right-actions {
      width: 100%;
      flex-direction: column;
      button { width: 100%; justify-content: center; }
    }
    .cancel-btn { width: 100%; }
  }
}
</style>
