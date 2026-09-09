<template>
  <div v-if="visible" class="settings-modal-overlay" @click.self="close">
    <div class="settings-modal-card">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">
            <i class="fas fa-cog"></i>
          </div>
          <div>
            <h3>Configuración del Terminal</h3>
            <p class="subtitle">Personalización, gestión de sectores y opciones de eliminación de datos</p>
          </div>
        </div>
        <button class="close-btn" @click="close" title="Cerrar">&times;</button>
      </div>

      <!-- Navigation Tabs -->
      <div class="settings-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'general' }"
          @click="activeTab = 'general'"
        >
          <i class="fas fa-sliders-h"></i>
          <span>General y Apariencia</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'data' }"
          @click="activeTab = 'data'"
        >
          <i class="fas fa-trash-alt"></i>
          <span>Gestión y Eliminación de Datos</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'sections' }"
          @click="activeTab = 'sections'"
        >
          <i class="fas fa-layer-group"></i>
          <span>Sectores ({{ currentSections.length }})</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'items' }"
          @click="activeTab = 'items'"
        >
          <i class="fas fa-list"></i>
          <span>Servicios Guardados ({{ totalItemsCount }})</span>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- 1. GENERAL SETTINGS -->
        <div v-if="activeTab === 'general'" class="tab-pane">
          <div class="form-section">
            <h4 class="section-heading"><i class="fas fa-id-card"></i> Identidad del Terminal</h4>
            <div class="form-row">
              <div class="form-col">
                <label>Nombre / Título del Panel:</label>
                <input
                  type="text"
                  v-model="terminalTitle"
                  class="clean-input"
                  placeholder="Nexus Terminal"
                />
              </div>
              <div class="form-col">
                <label>Subtítulo o Lema:</label>
                <input
                  type="text"
                  v-model="terminalSubtitle"
                  class="clean-input"
                  placeholder="Sovereign Command & Capital Operations"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <h4 class="section-heading"><i class="fas fa-palette"></i> Apariencia y Distribución</h4>
            <div class="form-row">
              <div class="form-col">
                <label>Tamaño de Iconos:</label>
                <select v-model="iconSizeChoice" class="clean-select">
                  <option value="small">Compacto / Pequeño</option>
                  <option value="medium">Estándar / Mediano (Recomendado)</option>
                  <option value="large">Grande / Expandido</option>
                </select>
              </div>
              <div class="form-col">
                <label>Orientación de Tarjetas:</label>
                <select v-model="layoutChoice" class="clean-select">
                  <option value="auto">Cuadrícula Inteligente Cuántica (Auto)</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. DATA MANAGEMENT & DELETION -->
        <div v-if="activeTab === 'data'" class="tab-pane">
          <!-- Smart Auto-Organize Action -->
          <div class="smart-organize-card">
            <div class="smart-header">
              <div class="smart-icon"><i class="fas fa-magic"></i></div>
              <div>
                <h4>🪄 Auto-Organizar Panel Inteligente</h4>
                <p>Clasifica y distribuye automáticamente todos los accesos en sectores institucionales (Trading, IA, Cloud, Vault, etc.)</p>
              </div>
            </div>
            <div class="smart-actions-row">
              <span class="smart-desc">Reorganiza los {{ totalItemsCount }} servicios guardados según su nombre y URL en cuadrículas limpias.</span>
              <button class="smart-btn" @click="confirmAutoOrganize" :disabled="totalItemsCount === 0 || isProcessing">
                <i class="fas fa-layer-group"></i> 🪄 Auto-Organizar Todo ({{ totalItemsCount }})
              </button>
            </div>
          </div>

          <div class="danger-zone-card" style="margin-top: 1.25rem;">
            <div class="danger-header">
              <i class="fas fa-exclamation-triangle"></i>
              <div>
                <h4>Eliminar Códigos y Accesos</h4>
                <p>Opciones para limpiar datos importados, eliminar contraseñas o vaciar el terminal.</p>
              </div>
            </div>

            <div class="danger-actions-list">
              <!-- Clear All Items Action -->
              <div class="danger-action-item">
                <div class="action-info">
                  <strong>🗑️ Eliminar Todos los Códigos / Vaciar Accesos</strong>
                  <span>Elimina todas las contraseñas y accesos guardados, manteniendo la estructura de sectores limpia.</span>
                </div>
                <button
                  class="danger-btn"
                  @click="confirmClearAllItems"
                  :disabled="totalItemsCount === 0 || isProcessing"
                >
                  <i class="fas fa-trash-alt"></i> Vaciar {{ totalItemsCount }} Códigos
                </button>
              </div>

              <!-- Reset Dashboard to Empty Action -->
              <div class="danger-action-item">
                <div class="action-info">
                  <strong>🔄 Restablecer Panel a Estado Limpio</strong>
                  <span>Borra todos los sectores y códigos para empezar un panel 100% en blanco.</span>
                </div>
                <button
                  class="danger-btn secondary"
                  @click="confirmResetAll"
                  :disabled="isProcessing"
                >
                  <i class="fas fa-redo-alt"></i> Restablecer a Cero
                </button>
              </div>
            </div>
          </div>

          <!-- Backup & Restore -->
          <div class="form-section" style="margin-top: 1.25rem;">
            <h4 class="section-heading"><i class="fas fa-database"></i> Copias de Seguridad y Respaldo</h4>
            <div class="backup-actions">
              <button class="action-btn" @click="downloadBackupYaml">
                <i class="fas fa-download"></i> Descargar Respaldo (conf.yml)
              </button>
              <button class="action-btn" @click="openImportModal">
                <i class="fas fa-file-import"></i> Importar Archivo de Códigos (CSV / JSON)
              </button>
            </div>
          </div>
        </div>

        <!-- 3. SECTIONS MANAGEMENT -->
        <div v-if="activeTab === 'sections'" class="tab-pane">
          <div class="sections-manager-header">
            <p>Gestiona, renombra o auto-organiza sectores con un solo clic.</p>
            <div class="sec-header-btns">
              <button class="smart-mini-btn" @click="confirmAutoOrganize" :disabled="totalItemsCount === 0 || isProcessing">
                <i class="fas fa-magic"></i> 🪄 Auto-Organizar
              </button>
              <button class="add-sec-btn" @click="showNewSectionInput = !showNewSectionInput">
                <i class="fas fa-plus"></i> + Añadir Sector
              </button>
            </div>
          </div>

          <div v-if="showNewSectionInput" class="new-sec-form">
            <input
              type="text"
              v-model="newSectionTitle"
              placeholder="Nombre del nuevo sector (ej: Crypto DeFi, Servidores Cloud...)"
              class="clean-input"
            />
            <button class="confirm-new-sec-btn" @click="addNewSection" :disabled="!newSectionTitle.trim()">
              Añadir
            </button>
          </div>

          <div class="sections-list">
            <div
              v-for="(sec, idx) in currentSections"
              :key="sec.name"
              class="section-row-card"
            >
              <div class="sec-left">
                <div class="sec-icon-badge">
                  <i :class="sec.icon || 'fas fa-folder'"></i>
                </div>
                <div class="sec-details">
                  <strong>{{ sec.name }}</strong>
                  <span>{{ sec.items ? sec.items.length : 0 }} servicios guardados</span>
                </div>
              </div>
              <div class="sec-actions">
                <button class="sec-action-btn delete-btn" @click="deleteSection(idx)" title="Eliminar este sector y sus códigos">
                  <i class="fas fa-trash-alt"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. ITEMS LIST (DIRECT DELETION TABLE) -->
        <div v-if="activeTab === 'items'" class="tab-pane">
          <div class="items-search-bar">
            <i class="fas fa-search"></i>
            <input
              type="text"
              v-model="itemSearchQuery"
              placeholder="Buscar servicio para eliminar o editar..."
              class="clean-input"
            />
          </div>

          <div class="items-table-wrap">
            <table class="items-delete-table">
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Sector</th>
                  <th>Usuario</th>
                  <th>Acceso / Clave</th>
                  <th width="70">Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItemsList" :key="item.id || item.title + item.url">
                  <td>
                    <div class="table-service-name">
                      <div class="table-icon-mini">
                        <img
                          v-if="item.icon && item.icon.startsWith('http')"
                          :src="item.icon"
                          alt="icon"
                          @error="item.icon = 'fas fa-globe'"
                        />
                        <i v-else :class="item.icon || 'fas fa-globe'"></i>
                      </div>
                      <div>
                        <strong>{{ item.title }}</strong>
                        <small>{{ item.url }}</small>
                      </div>
                    </div>
                  </td>
                  <td><span class="sector-chip">{{ item.sectionName }}</span></td>
                  <td><code>{{ item.username || '—' }}</code></td>
                  <td><code>{{ item.passcode || item.password ? '••••••' : '—' }}</code></td>
                  <td>
                    <button
                      class="table-delete-btn"
                      @click="deleteSingleItem(item)"
                      title="Eliminar este servicio"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredItemsList.length === 0">
                  <td colspan="5" class="empty-table-msg">
                    No se encontraron servicios guardados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="cancel-btn" @click="close">Cerrar</button>
        <button class="save-settings-btn" @click="saveAllSettings" :disabled="isProcessing">
          <span v-if="!isProcessing"><i class="fas fa-check"></i> Guardar Cambios</span>
          <span v-else><i class="fas fa-spinner fa-spin"></i> Guardando...</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ConfigSavingMixin from '@/mixins/ConfigSaving';
import StoreKeys from '@/utils/StoreMutations';
import { dump as yamlDump } from '@/utils/yaml';
import { autoOrganizeSections } from '@/utils/smartClassifier';

export default {
  name: 'TerminalSettingsModal',
  mixins: [ConfigSavingMixin],
  props: {
    visible: { type: Boolean, default: false },
  },
  data() {
    return {
      activeTab: 'general',
      isProcessing: false,
      terminalTitle: '',
      terminalSubtitle: '',
      iconSizeChoice: 'medium',
      layoutChoice: 'auto',
      showNewSectionInput: false,
      newSectionTitle: '',
      itemSearchQuery: '',
    };
  },
  computed: {
    currentSections() {
      return this.$store.state.config?.sections || [];
    },
    totalItemsCount() {
      return this.currentSections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
    },
    allFlatItems() {
      const list = [];
      this.currentSections.forEach((sec) => {
        (sec.items || []).forEach((it) => {
          list.push({
            ...it,
            sectionName: sec.name,
          });
        });
      });
      return list;
    },
    filteredItemsList() {
      if (!this.itemSearchQuery.trim()) return this.allFlatItems;
      const q = this.itemSearchQuery.toLowerCase();
      return this.allFlatItems.filter((it) => (
        (it.title && it.title.toLowerCase().includes(q))
        || (it.url && it.url.toLowerCase().includes(q))
        || (it.username && it.username.toLowerCase().includes(q))
        || (it.sectionName && it.sectionName.toLowerCase().includes(q))
      ));
    },
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.initSettings();
        }
      },
    },
  },
  methods: {
    initSettings() {
      const pageInfo = this.$store.state.config?.pageInfo || {};
      const appConfig = this.$store.state.config?.appConfig || {};
      this.terminalTitle = pageInfo.title || 'Nexus Terminal';
      this.terminalSubtitle = pageInfo.description || 'Sovereign Command & Capital Operations';
      this.iconSizeChoice = appConfig.iconSize || 'medium';
      this.layoutChoice = appConfig.layout || 'auto';
      this.itemSearchQuery = '';
      this.showNewSectionInput = false;
      this.newSectionTitle = '';
    },
    close() {
      this.$emit('close');
    },
    openImportModal() {
      this.close();
      window.dispatchEvent(new CustomEvent('open-manual-add'));
    },
    async deleteSingleItem(itemToDelete) {
      if (!confirm(`¿Eliminar el servicio "${itemToDelete.title}"?`)) return;

      const sections = JSON.parse(JSON.stringify(this.currentSections));
      const targetSec = sections.find((s) => s.name === itemToDelete.sectionName);
      if (targetSec && targetSec.items) {
        targetSec.items = targetSec.items.filter((it) => (
          !(it.title === itemToDelete.title && it.url === itemToDelete.url)
        ));
      }

      await this.persistSections(sections);
    },
    async deleteSection(secIndex) {
      const sec = this.currentSections[secIndex];
      if (!sec) return;
      const count = sec.items ? sec.items.length : 0;
      if (!confirm(`¿Estás seguro de eliminar el sector "${sec.name}" y sus ${count} servicios?`)) return;

      const sections = JSON.parse(JSON.stringify(this.currentSections));
      sections.splice(secIndex, 1);
      await this.persistSections(sections);
    },
    async addNewSection() {
      if (!this.newSectionTitle.trim()) return;
      const sections = JSON.parse(JSON.stringify(this.currentSections));
      sections.push({
        name: this.newSectionTitle.trim(),
        icon: 'fas fa-folder',
        items: [],
      });
      this.newSectionTitle = '';
      this.showNewSectionInput = false;
      await this.persistSections(sections);
    },
    async confirmAutoOrganize() {
      if (this.totalItemsCount === 0) {
        alert('No hay servicios guardados para auto-organizar.');
        return;
      }
      if (!confirm(`¿Auto-organizar ${this.totalItemsCount} servicios en sectores institucionales limpios? Todos los accesos se clasificarán automáticamente según su nombre y URL en sectores clave (Trading, IA, Cloud, Vault, etc.).`)) {
        return;
      }

      this.isProcessing = true;
      try {
        const organized = autoOrganizeSections(this.currentSections);
        await this.persistSections(organized);
        alert(`¡Panel auto-organizado con éxito! Todos los ${this.totalItemsCount} servicios han sido clasificados en sectores organizados.`);
      } catch (err) {
        console.error('Error al auto-organizar:', err);
        alert('Hubo un problema al auto-organizar los sectores.');
      } finally {
        this.isProcessing = false;
      }
    },
    async confirmClearAllItems() {
      if (!confirm(`¿Estás seguro de eliminar TODOS los ${this.totalItemsCount} códigos y servicios guardados? Esta acción limpiará todos los accesos del panel.`)) {
        return;
      }

      this.isProcessing = true;
      // Empty the items array of every section
      const emptySections = this.currentSections.map((sec) => ({
        ...sec,
        items: [],
      }));

      await this.persistSections(emptySections);
      this.isProcessing = false;
      alert('¡Todos los códigos y accesos han sido eliminados con éxito!');
    },
    async confirmResetAll() {
      if (!confirm('¿Restablecer el terminal por completo? Esto eliminará todos los sectores y códigos.')) {
        return;
      }

      this.isProcessing = true;
      const cleanSections = [
        { name: 'Quant & Algorithmic Trading', icon: 'fas fa-chart-line', items: [] },
        { name: 'Artificial Intelligence & Compute', icon: 'fas fa-brain', items: [] },
        { name: 'Cloud Infrastructure & Automation', icon: 'fas fa-server', items: [] },
        { name: 'Encrypted Vault & Capital', icon: 'fas fa-shield-alt', items: [] },
      ];

      await this.persistSections(cleanSections);
      this.isProcessing = false;
      alert('¡Terminal restablecido a estado limpio!');
    },
    async persistSections(updatedSections) {
      this.$store.commit(StoreKeys.SET_SECTIONS, updatedSections);

      const fullConfig = {
        ...this.$store.state.config,
        sections: updatedSections,
      };

      await this.writeConfigToDisk(fullConfig);
      this.saveConfigLocally(fullConfig);
    },
    async saveAllSettings() {
      this.isProcessing = true;

      const updatedPageInfo = {
        ...this.$store.state.config?.pageInfo,
        title: this.terminalTitle.trim() || 'Nexus Terminal',
        description: this.terminalSubtitle.trim() || 'Sovereign Command & Capital Operations',
      };

      const updatedAppConfig = {
        ...this.$store.state.config?.appConfig,
        iconSize: this.iconSizeChoice,
        layout: this.layoutChoice,
      };

      this.$store.commit(StoreKeys.SET_PAGE_INFO, updatedPageInfo);
      this.$store.commit(StoreKeys.SET_APP_CONFIG, updatedAppConfig);

      const fullConfig = {
        ...this.$store.state.config,
        pageInfo: updatedPageInfo,
        appConfig: updatedAppConfig,
      };

      try {
        await this.writeConfigToDisk(fullConfig);
        this.saveConfigLocally(fullConfig);
        this.close();
      } catch (err) {
        console.error('Error guardando configuración:', err);
      } finally {
        this.isProcessing = false;
      }
    },
    downloadBackupYaml() {
      const json = {
        ...this.$store.state.config,
      };
      const yaml = yamlDump(JSON.parse(JSON.stringify(json)));
      const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus_terminal_backup_${new Date().toISOString().slice(0, 10)}.yml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  },
};
</script>

<style scoped lang="scss">
.settings-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 7, 14, 0.85);
  backdrop-filter: blur(16px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

.settings-modal-card {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15);
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
  color: #f8fafc;
}

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

.settings-tabs {
  display: flex;
  background: rgba(11, 15, 25, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 1.5rem;
  gap: 6px;
  overflow-x: auto;

  .tab-btn {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0.85rem 1rem;
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.84rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
    transition: all 0.2s ease;

    &:hover { color: #f1f5f9; }

    &.active {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
      background: rgba(56, 189, 248, 0.06);
    }
  }
}

.modal-body {
  padding: 1.5rem 1.75rem;
  overflow-y: auto;
  flex: 1;
}

.form-section {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;

  .section-heading {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #38bdf8;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
  }
}

.clean-input, .clean-select {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 9px 12px;
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
  font-family: inherit;

  &:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
  }
}

/* Smart Auto-Organize Card */
.smart-organize-card {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(14, 165, 233, 0.15));
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);

  .smart-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 1.25rem;
    padding-bottom: 0.85rem;
    border-bottom: 1px solid rgba(56, 189, 248, 0.25);

    .smart-icon {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    }

    h4 { margin: 0; color: #ffffff; font-size: 1.1rem; font-weight: 700; }
    p { margin: 3px 0 0 0; color: #93c5fd; font-size: 0.82rem; }
  }

  .smart-actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(56, 189, 248, 0.25);
    border-radius: 12px;
    padding: 12px 16px;

    .smart-desc {
      color: #cbd5e1;
      font-size: 0.82rem;
      line-height: 1.4;
    }

    .smart-btn {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border-radius: 10px;
      padding: 10px 18px;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(2, 132, 199, 0.6);
      }
      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }
  }
}

.smart-mini-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(56, 189, 248, 0.3);
    color: #ffffff;
  }
}

/* Danger Zone */
.danger-zone-card {
  background: rgba(225, 29, 72, 0.08);
  border: 1px solid rgba(225, 29, 72, 0.35);
  border-radius: 16px;
  padding: 1.5rem;

  .danger-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(225, 29, 72, 0.2);

    i { color: #f43f5e; font-size: 1.5rem; }
    h4 { margin: 0; color: #ffffff; font-size: 1.05rem; }
    p { margin: 2px 0 0 0; color: #fda4af; font-size: 0.8rem; }
  }

  .danger-actions-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .danger-action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(225, 29, 72, 0.2);
    border-radius: 12px;
    padding: 12px 16px;

    .action-info {
      display: flex;
      flex-direction: column;
      gap: 3px;

      strong { color: #ffffff; font-size: 0.92rem; }
      span { color: #94a3b8; font-size: 0.78rem; }
    }

    .danger-btn {
      background: #e11d48;
      border: none;
      color: #ffffff;
      border-radius: 10px;
      padding: 8px 16px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: #be123c;
        box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);
      }
      &:disabled { opacity: 0.4; cursor: not-allowed; }

      &.secondary {
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(225, 29, 72, 0.4);
        color: #f43f5e;
        &:hover:not(:disabled) { background: rgba(225, 29, 72, 0.15); }
      }
    }
  }
}

.backup-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .action-btn {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    border-radius: 10px;
    padding: 10px 16px;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(56, 189, 248, 0.15);
      color: #ffffff;
    }
  }
}

/* Sections Manager */
.sections-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;

  p { margin: 0; color: #94a3b8; font-size: 0.85rem; }

  .add-sec-btn {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    color: #38bdf8;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;

    &:hover { background: rgba(56, 189, 248, 0.25); }
  }
}

.new-sec-form {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;

  input { flex: 1; }

  .confirm-new-sec-btn {
    background: #3b82f6;
    border: none;
    color: #ffffff;
    border-radius: 10px;
    padding: 0 16px;
    font-weight: 600;
    cursor: pointer;
  }
}

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-row-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 14px;

  .sec-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .sec-icon-badge {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.8);
      color: #38bdf8;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sec-details {
      display: flex;
      flex-direction: column;
      strong { color: #ffffff; font-size: 0.9rem; }
      span { color: #94a3b8; font-size: 0.74rem; }
    }
  }

  .sec-action-btn {
    background: transparent;
    border: 1px solid rgba(225, 29, 72, 0.3);
    color: #f43f5e;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s ease;

    &:hover {
      background: #e11d48;
      color: #ffffff;
    }
  }
}

/* Items Table */
.items-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 12px;

  i { color: #64748b; }
  input { border: none; background: transparent; padding: 10px 0; width: 100%; }
}

.items-table-wrap {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.items-delete-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;

  th {
    background: rgba(15, 23, 42, 0.95);
    color: #94a3b8;
    text-align: left;
    padding: 10px 12px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: #cbd5e1;
  }

  .table-service-name {
    display: flex;
    align-items: center;
    gap: 10px;

    .table-icon-mini {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 16px; height: 16px; object-fit: contain; }
      i { color: #38bdf8; font-size: 0.9rem; }
    }

    strong { display: block; color: #ffffff; }
    small { color: #64748b; font-size: 0.72rem; }
  }

  .sector-chip {
    background: rgba(56, 189, 248, 0.12);
    color: #38bdf8;
    border-radius: 6px;
    padding: 2px 7px;
    font-size: 0.72rem;
  }

  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    color: #94a3b8;
  }

  .table-delete-btn {
    background: transparent;
    border: none;
    color: #f43f5e;
    cursor: pointer;
    font-size: 0.95rem;
    padding: 4px 8px;
    border-radius: 6px;

    &:hover {
      background: rgba(225, 29, 72, 0.2);
      color: #ffffff;
    }
  }

  .empty-table-msg {
    text-align: center;
    padding: 2rem;
    color: #64748b;
  }
}

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
    cursor: pointer;

    &:hover { background: rgba(255, 255, 255, 0.08); color: #ffffff; }
  }

  .save-settings-btn {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    border: none;
    color: #ffffff;
    border-radius: 10px;
    padding: 8px 20px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}
</style>
