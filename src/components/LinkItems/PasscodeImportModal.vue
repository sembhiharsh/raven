<template>
  <div v-if="visible" class="passcode-modal-overlay" @click.self="close">
    <div class="passcode-modal-card">
      <!-- Modal Header -->
      <div class="passcode-modal-header">
        <div class="header-title-wrap">
          <div class="header-icon-badge">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div>
            <h3>Códigos y Contraseñas Detectados</h3>
            <p class="subtitle">
              Se han encontrado <strong>{{ parsedItems.length }}</strong> elementos listos para añadir a tu panel.
            </p>
          </div>
        </div>
        <button class="close-btn" @click="close" title="Cerrar">&times;</button>
      </div>

      <!-- Modal Options Bar -->
      <div class="passcode-modal-controls">
        <div class="control-group">
          <label>Organización de Secciones:</label>
          <div class="radio-options">
            <label class="radio-label">
              <input type="radio" v-model="groupMode" value="category" />
              <span>Por Categorías / Carpetas</span>
            </label>
            <label class="radio-label">
              <input type="radio" v-model="groupMode" value="single" />
              <span>Una Sola Sección</span>
            </label>
          </div>
        </div>

        <div v-if="groupMode === 'single'" class="single-section-input">
          <label>Nombre de la sección:</label>
          <input
            type="text"
            v-model="customSectionName"
            placeholder="Ej: Mis Códigos y Accesos"
            class="clean-input"
          />
        </div>

        <div class="actions-summary">
          <button class="text-btn" @click="toggleSelectAll">
            {{ allSelected ? 'Deseleccionar todos' : 'Seleccionar todos' }}
          </button>
          <span class="selection-counter">
            {{ selectedCount }} de {{ parsedItems.length }} seleccionados
          </span>
        </div>
      </div>

      <!-- Items List Table / Cards -->
      <div class="passcode-items-scroll">
        <table class="passcode-table">
          <thead>
            <tr>
              <th width="40"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll" /></th>
              <th width="48">Icono</th>
              <th>Título y URL</th>
              <th>Usuario</th>
              <th>Código / Contraseña</th>
              <th v-if="groupMode === 'category'">Categoría</th>
              <th width="50"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in parsedItems"
              :key="item.id"
              :class="{ 'row-unselected': !item.selected }"
            >
              <td>
                <input type="checkbox" v-model="item.selected" />
              </td>
              <td>
                <div class="table-icon-preview">
                  <img
                    v-if="item.icon && item.icon.startsWith('http')"
                    :src="item.icon"
                    @error="item.icon = 'fas fa-globe'"
                    alt="icon"
                  />
                  <i v-else :class="item.icon || 'fas fa-key'"></i>
                </div>
              </td>
              <td>
                <div class="table-item-title-col">
                  <input
                    type="text"
                    v-model="item.title"
                    class="inline-edit-title"
                    placeholder="Título"
                  />
                  <input
                    type="text"
                    v-model="item.url"
                    class="inline-edit-url"
                    placeholder="https://..."
                  />
                </div>
              </td>
              <td>
                <input
                  type="text"
                  v-model="item.username"
                  class="inline-edit-user"
                  placeholder="(sin usuario)"
                />
              </td>
              <td>
                <div class="passcode-cell">
                  <input
                    :type="item.showPass ? 'text' : 'password'"
                    v-model="item.passcode"
                    class="inline-edit-pass"
                    placeholder="(sin código)"
                  />
                  <button
                    class="icon-action-btn"
                    @click="item.showPass = !item.showPass"
                    :title="item.showPass ? 'Ocultar' : 'Mostrar'"
                  >
                    <i :class="item.showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </td>
              <td v-if="groupMode === 'category'">
                <input
                  type="text"
                  v-model="item.category"
                  class="inline-edit-cat"
                  placeholder="Categoría"
                />
              </td>
              <td>
                <button
                  class="icon-action-btn delete-btn"
                  @click="removeItem(idx)"
                  title="Eliminar de la lista"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Footer -->
      <div class="passcode-modal-footer">
        <button class="cancel-btn" @click="close">Cancelar</button>
        <button
          class="confirm-btn"
          :disabled="selectedCount === 0 || isSaving"
          @click="confirmImport"
        >
          <span v-if="!isSaving">
            <i class="fas fa-check-circle"></i>
            Guardar {{ selectedCount }} elemento{{ selectedCount === 1 ? '' : 's' }} en el Panel
          </span>
          <span v-else>
            <i class="fas fa-spinner fa-spin"></i> Guardando...
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PasscodeImportModal',
  props: {
    visible: { type: Boolean, default: false },
    items: { type: Array, default: () => [] },
  },
  data() {
    return {
      parsedItems: [],
      groupMode: 'category',
      customSectionName: 'Códigos Guardados',
      isSaving: false,
    };
  },
  computed: {
    selectedCount() {
      return this.parsedItems.filter((it) => it.selected).length;
    },
    allSelected() {
      return this.parsedItems.length > 0 && this.parsedItems.every((it) => it.selected);
    },
  },
  watch: {
    items: {
      immediate: true,
      handler(newItems) {
        this.parsedItems = (newItems || []).map((it) => ({
          ...it,
          selected: true,
          showPass: false,
        }));
        // If items already have same category, default to category mode
        const distinctCats = new Set((newItems || []).map((it) => it.category).filter(Boolean));
        if (distinctCats.size <= 1) {
          this.groupMode = 'single';
          if (distinctCats.size === 1) {
            this.customSectionName = Array.from(distinctCats)[0];
          }
        } else {
          this.groupMode = 'category';
        }
      },
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
    toggleSelectAll() {
      const targetState = !this.allSelected;
      this.parsedItems.forEach((it) => {
        it.selected = targetState;
      });
    },
    removeItem(idx) {
      this.parsedItems.splice(idx, 1);
      if (this.parsedItems.length === 0) {
        this.close();
      }
    },
    confirmImport() {
      const selectedItems = this.parsedItems.filter((it) => it.selected);
      if (selectedItems.length === 0) return;

      this.isSaving = true;
      this.$emit('import-confirmed', {
        items: selectedItems,
        groupMode: this.groupMode,
        customSectionName: this.customSectionName || 'Códigos Guardados',
      });
      setTimeout(() => {
        this.isSaving = false;
        this.close();
      }, 500);
    },
  },
};
</script>

<style scoped>
.passcode-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  box-sizing: border-box;
}

.passcode-modal-card {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 980px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.passcode-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  border: 1px solid #dbeafe;
}

.header-title-wrap h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.header-title-wrap .subtitle {
  margin: 3px 0 0 0;
  font-size: 0.88rem;
  color: #64748b;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.8rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  color: #0f172a;
  background: #e2e8f0;
}

.passcode-modal-controls {
  padding: 1rem 1.75rem;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.control-group label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #334155;
}

.radio-options {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.single-section-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.single-section-input label {
  font-size: 0.85rem;
  color: #64748b;
}

.clean-input {
  padding: 0.4rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
  outline: none;
  color: #0f172a;
}

.clean-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.actions-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.text-btn {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.text-btn:hover {
  text-decoration: underline;
}

.selection-counter {
  font-size: 0.85rem;
  color: #64748b;
}

.passcode-items-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1.75rem;
  max-height: 50vh;
}

.passcode-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.passcode-table th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  color: #64748b;
  font-weight: 600;
  border-bottom: 1.5px solid #e2e8f0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.passcode-table td {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.row-unselected {
  opacity: 0.45;
}

.table-icon-preview {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-icon-preview img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.table-icon-preview i {
  color: #2563eb;
  font-size: 0.95rem;
}

.table-item-title-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inline-edit-title {
  border: 1px solid transparent;
  background: transparent;
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
  outline: none;
  border-radius: 4px;
  padding: 2px 4px;
}

.inline-edit-url {
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  outline: none;
  border-radius: 4px;
  padding: 2px 4px;
}

.inline-edit-user,
.inline-edit-cat {
  border: 1px solid transparent;
  background: transparent;
  color: #334155;
  font-size: 0.85rem;
  outline: none;
  border-radius: 4px;
  padding: 4px 6px;
  width: 100%;
}

.inline-edit-title:hover,
.inline-edit-url:hover,
.inline-edit-user:hover,
.inline-edit-cat:hover,
.inline-edit-title:focus,
.inline-edit-url:focus,
.inline-edit-user:focus,
.inline-edit-cat:focus {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.passcode-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.inline-edit-pass {
  border: 1px solid transparent;
  background: transparent;
  color: #0f172a;
  font-family: monospace;
  font-size: 0.88rem;
  outline: none;
  border-radius: 4px;
  padding: 4px 6px;
  width: 130px;
}

.inline-edit-pass:hover,
.inline-edit-pass:focus {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.icon-action-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.icon-action-btn:hover {
  color: #2563eb;
  background: #eff6ff;
}

.delete-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.passcode-modal-footer {
  padding: 1.25rem 1.75rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}

.cancel-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.confirm-btn {
  padding: 0.65rem 1.5rem;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.15s ease;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
