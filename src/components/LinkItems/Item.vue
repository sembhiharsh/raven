<template ref="container">
  <div :class="`item-wrapper wrap-size-${size} span-${makeColumnCount}`" >
    <a @click="itemClicked"
      @long-press="openContextMenu"
      @contextmenu="preventNativeContextMenu"
      @mouseup.right="openContextMenu"
      @mouseenter="startTitleScroll"
      @mouseleave="endTitleScroll"
      @focus="startTitleScroll"
      @blur="endTitleScroll"
      v-longPress="true"
      :href="effectiveUrl"
      :target="anchorTarget"
      :class="`item ${makeClassList}`"
      v-tooltip="getTooltipOptions()"
      :rel="`${item.rel || 'noopener noreferrer'}`"
      tabindex="0"
      :id="`link-${item.id}`"
      :style="customStyle"
    >
      <!-- Item Icon -->
      <Icon :icon="itemIcon" :url="item.url" :size="size" :color="item.color"
        v-bind:style="customStyles" class="bounce" />

      <!-- Item Content Container (Title + Subtitle & User) -->
      <div :id="`tile-${item.id}`" :class="`tile-title ${!itemIcon? 'bounce no-icon': ''}`">
        <div class="tile-main-row">
          <span ref="titleText" class="text" :title="item.title">{{ item.title }}</span>
        </div>
        <div class="tile-sub-row" v-if="cleanDescription || item.username">
          <span class="meta-desc" v-if="cleanDescription">{{ cleanDescription }}</span>
          <span class="meta-sep" v-if="cleanDescription && item.username">•</span>
          <div
            v-if="item.username"
            class="tile-username-badge"
            @click.stop.prevent="copyUsername"
            :title="`Copiar usuario: ${item.username}`"
          >
            <i :class="copiedUsername ? 'fas fa-check' : 'far fa-user'"></i>
            <span class="username-val">{{ copiedUsername ? '¡Copiado!' : item.username }}</span>
          </div>
        </div>
      </div>

      <!-- Action Area: Passcode Badge & Quick Delete Button -->
      <div class="tile-actions-area">
        <div
          v-if="item.passcode || item.password"
          class="tile-passcode-badge"
          @click.stop.prevent="copyPasscode"
          :title="`Copiar código / contraseña`"
        >
          <i :class="copiedPasscode ? 'fas fa-check' : 'fas fa-key'"></i>
          <span class="passcode-val">{{ copiedPasscode ? '¡Copiado!' : (showPasscode ? (item.passcode || item.password) : '••••••') }}</span>
          <button
            type="button"
            class="eye-mini-btn"
            @click.stop.prevent="showPasscode = !showPasscode"
            :title="showPasscode ? 'Ocultar código' : 'Mostrar código'"
          >
            <i :class="showPasscode ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
        </div>

        <!-- Quick 1-click Delete Button -->
        <button
          v-if="!isAddNew"
          type="button"
          class="tile-quick-delete-btn"
          @click.stop.prevent="quickDeleteItem"
          title="Eliminar este servicio"
        >
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
      <!-- Edit icon (displayed only when in edit mode) -->
      <EditModeIcon v-if="isEditMode" class="edit-mode-item" @click="openItemSettings()" />
    </a>
    <!-- Right-click context menu -->
    <ContextMenu
      :show="contextMenuOpen && !isAddNew"
      v-click-outside="closeContextMenu"
      :posX="contextPos.posX"
      :posY="contextPos.posY"
      :id="`context-menu-${item.id}`"
      @launchItem="launchItem"
      @openItemSettings="openItemSettings"
      @openMoveItemMenu="openMoveItemMenu"
      @openDeleteItem="openDeleteItem"
    />
    <!-- Edit and move item menu modals -->
    <MoveItemTo v-if="isEditMode" :itemId="item.id" />
    <EditItem v-if="editMenuOpen" :itemId="item.id"
      @closeEditMenu="closeEditMenu"
      :isNew="isAddNew" :parentSectionTitle="parentSectionTitle" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import Icon from '@/components/LinkItems/ItemIcon.vue';
import ItemOpenMethodIcon from '@/components/LinkItems/ItemOpenMethodIcon';
import StatusIndicator from '@/components/LinkItems/StatusIndicator';
import MoveItemTo from '@/components/InteractiveEditor/MoveItemTo';
import ContextMenu from '@/components/LinkItems/ItemContextMenu';
import ConfigSavingMixin from '@/mixins/ConfigSaving';

const EditItem = defineAsyncComponent(() => import('@/components/InteractiveEditor/EditItem.vue'));
import StoreKeys from '@/utils/StoreMutations';
import ItemMixin from '@/mixins/ItemMixin';
import EditModeIcon from '@/assets/interface-icons/interactive-editor-edit-mode.svg';
import { modalNames } from '@/utils/config/defaults';

export default {
  name: 'Item',
  mixins: [ItemMixin, ConfigSavingMixin],
  props: {
    itemSize: { type: String, default: '' },
    parentSectionTitle: { type: String, default: '' }, // Title of parent section (for add new)
    isAddNew: Boolean, // Only set if 'fake' item used as Add New button
    sectionWidth: { type: Number, default: undefined }, // Width of parent section
    sectionDisplayData: { type: Object, default: () => ({}) },
  },
  components: {
    Icon,
    ItemOpenMethodIcon,
    StatusIndicator,
    ContextMenu,
    MoveItemTo,
    EditItem,
    EditModeIcon,
  },
  computed: {
    /* Returns either item.icon, or appConfig.defaultIcon, or null */
    itemIcon() {
      return this.item.icon || this.$store.getters.appConfig?.defaultIcon;
    },
    makeColumnCount() {
      if ((this.sectionDisplayData || {}).itemCountX) return this.sectionDisplayData.itemCountX;
      if (this.sectionWidth < 380) return 1;
      if (this.sectionWidth < 520) return 2;
      if (this.sectionWidth < 730) return 3;
      if (this.sectionWidth < 1000) return 4;
      if (this.sectionWidth < 1300) return 5;
      return 0;
    },
    /* Based on item props, adjust class names */
    makeClassList() {
      const { isAddNew, isEditMode, size } = this;
      return `size-${size} ${!this.itemIcon ? 'short' : ''} `
        + `${isAddNew ? 'add-new' : ''} ${isEditMode ? 'is-edit-mode' : ''}`;
    },
    cleanDescription() {
      const desc = this.item.description || '';
      if (!desc) return '';
      if (desc.includes('•')) {
        const parts = desc.split('•');
        return parts.slice(1).join('•').trim();
      }
      if (desc.toLowerCase().startsWith('usuario:')) {
        return '';
      }
      return desc;
    },
    /* Used by certain themes (material), to show animated CSS icon */
    unicodeOpeningIcon() {
      switch (this.accumulatedTarget) {
        case 'newtab': return '"\\f360"';
        case 'sametab': return '"\\f24d"';
        case 'parent': return '"\\f3bf"';
        case 'top': return '"\\f102"';
        case 'modal': return '"\\f2d0"';
        case 'workspace': return '"\\f0b1"';
        case 'clipboard': return '"\\f0ea"';
        case 'newwindow': return '"\\f2d2"';
        default: return '"\\f054"';
      }
    },
  },
  data() {
    return {
      editMenuOpen: false,
      titleTruncated: false,
      copiedPasscode: false,
      copiedUsername: false,
      showPasscode: false,
    };
  },
  watch: {
    /* Watch for when item gets rename, to re-measure it's length check for truncation */
    'item.title': function titleChanged() {
      this.$nextTick(this.checkTitleTruncation);
    },
  },
  methods: {
    shortUrl(value) {
      if (!value || typeof value !== 'string') {
        return '';
      }
      try {
        // Use URL constructor to parse the input
        const url = new URL(value);
        return url.hostname;
      } catch {
        // If the input is not a valid URL, try to handle it as an IP address
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}/;
        const match = value.match(ipPattern);
        if (match) {
          return match[0];
        }
        return '';
      }
    },
    /* Returns configuration object for the tooltip */
    getTooltipOptions() {
      const {
        title, description, provider, hotkey,
      } = this.item;
      if (!description && !provider && !this.titleTruncated) return {}; // Nothing to show
      const parts = [];
      if (this.titleTruncated) parts.push(`<b>${title}</b>`);
      if (provider) parts.push(`<b>Provider</b>: ${provider}`);
      if (description) parts.push(description);
      if (hotkey) parts.push(`Press '${hotkey}' to launch`);
      const editKey = this.appConfig.disableContextMenu
        ? 'interactive-editor.edit-section.edit-tooltip-basic'
        : 'interactive-editor.edit-section.edit-tooltip';
      const editText = this.$t(editKey);
      return {
        content: (this.isEditMode ? editText : parts.join('<br>')),
        html: true,
        placement: this.statusResponse || this.pingResponse ? 'left' : 'auto',
        delay: { show: 600, hide: 200 },
        popperClass: `item-description-tooltip tooltip-is-${this.size}`,
      };
    },
    /* Measure whether the title is truncated in its tile */
    checkTitleTruncation() {
      const title = this.$refs.titleText;
      this.titleTruncated = !!title && title.scrollWidth > title.clientWidth;
    },
    /* Slowly scroll truncated titles into view, while hovered or focused */
    startTitleScroll() {
      const TITLE_SCROLL_SPEED = 90; // Pixels per second for item scroll
      clearTimeout(this.titleScrollTimer);
      cancelAnimationFrame(this.titleScrollRaf);
      if (!this.titleTruncated || !window.matchMedia('(hover: hover)').matches) return;
      this.titleScrollTimer = setTimeout(() => {
        const title = this.$refs.titleText;
        if (!title) return;
        const target = title.scrollWidth - title.clientWidth;
        if (target <= title.scrollLeft) return;
        if (this.reducedMotion()) {
          title.scrollLeft = target;
          return;
        }
        let start; let from; let duration;
        const step = (now) => {
          if (!start) {
            start = now;
            from = title.scrollLeft;
            duration = ((target - from) / TITLE_SCROLL_SPEED) * 1000;
          }
          const progress = Math.min((now - start) / duration, 1);
          title.scrollLeft = from + (target - from) * progress;
          if (progress < 1) this.titleScrollRaf = requestAnimationFrame(step);
        };
        this.titleScrollRaf = requestAnimationFrame(step);
      }, 300);
    },
    /* Scroll the title back, unless the item is still hovered or focused */
    endTitleScroll(event) {
      const link = event?.currentTarget;
      if (link && (link.matches(':hover') || link === document.activeElement)) return;
      clearTimeout(this.titleScrollTimer);
      cancelAnimationFrame(this.titleScrollRaf);
      const title = this.$refs.titleText;
      if (title && title.scrollLeft > 0) {
        title.scrollTo({ left: 0, behavior: this.reducedMotion() ? 'auto' : 'smooth' });
      }
    },
    reducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    openItemSettings() {
      this.editMenuOpen = true;
      this.contextMenuOpen = false;
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
    },
    /* Ensure conditional is updated, once menu closed */
    closeEditMenu() {
      this.editMenuOpen = false;
    },
    /* Open the modal for moving/ copying item to other section */
    openMoveItemMenu() {
      this.$modal.show(`${modalNames.MOVE_ITEM_TO}-${this.item.id}`);
      this.$store.commit(StoreKeys.SET_MODAL_OPEN, true);
      this.closeContextMenu();
    },
    /* Deletes the current item from the state */
    openDeleteItem() {
      const parentSection = this.$store.getters.getParentSectionOfItem(this.item.id);
      const payload = { itemId: this.item.id, sectionName: parentSection.name };
      this.$store.commit(StoreKeys.REMOVE_ITEM, payload);
      this.closeContextMenu();
    },
    copyPasscode() {
      const code = this.item.passcode || this.item.password;
      if (!code) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          this.copiedPasscode = true;
          setTimeout(() => { this.copiedPasscode = false; }, 2000);
        });
      } else {
        const temp = document.createElement('textarea');
        temp.value = code;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        this.copiedPasscode = true;
        setTimeout(() => { this.copiedPasscode = false; }, 2000);
      }
    },
    copyUsername() {
      const user = this.item.username;
      if (!user) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(user).then(() => {
          this.copiedUsername = true;
          setTimeout(() => { this.copiedUsername = false; }, 2000);
        });
      } else {
        const temp = document.createElement('textarea');
        temp.value = user;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        this.copiedUsername = true;
        setTimeout(() => { this.copiedUsername = false; }, 2000);
      }
    },
    async quickDeleteItem() {
      if (!confirm(`¿Eliminar el servicio "${this.item.title}"?`)) return;
      const parentSection = this.$store.getters.getParentSectionOfItem(this.item.id);
      if (parentSection) {
        const payload = { itemId: this.item.id, sectionName: parentSection.name };
        this.$store.commit(StoreKeys.REMOVE_ITEM, payload);
        const fullConfig = this.$store.state.config;
        await this.writeConfigToDisk(fullConfig);
        this.saveConfigLocally(fullConfig);
      }
    },
  },
  mounted() {
    // Watch for size changes, to know when title no longer fits
    if (typeof ResizeObserver !== 'undefined') {
      this.titleObserver = new ResizeObserver(this.checkTitleTruncation);
      this.titleObserver.observe(this.$refs.titleText);
    }
    if (document.fonts) document.fonts.ready.then(this.checkTitleTruncation);
    // If ping checking is enabled, then check ping status
    if (this.isPingCheckEnabled) {
      this.checkPingStatus();
      // If continious ping checking is enabled, then start ever-lasting loop
      if (this.pingCheckInterval > 0) {
        this.pingIntervalId = setInterval(this.checkPingStatus, this.pingCheckInterval * 1000);
      }
    }
    // If status checking is enabled, then check service status
    if (this.enableStatusCheck) {
      this.checkWebsiteStatus();
      // If continious status checking is enabled, then start ever-lasting loop
      if (this.statusCheckInterval > 0) {
        this.intervalId = setInterval(this.checkWebsiteStatus, this.statusCheckInterval * 1000);
      }
    }
  },
  beforeUnmount() {
    // Stop periodic ping-check and status-check when item is destroyed (e.g. navigating in multi-page setup)
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.titleObserver) this.titleObserver.disconnect();
    clearTimeout(this.titleScrollTimer);
    cancelAnimationFrame(this.titleScrollRaf);
  },
};
</script>

<style lang="scss">

.item-wrapper {
  display: flex;
  flex-grow: 1;
  flex-basis: 6rem;
  min-width: 0;
  &.wrap-size-large {
    flex-basis: 12rem;
  }
  &.wrap-size-small {
    flex-grow: revert;
    &.span-1 { min-width: 100%; }
    &.span-2 { min-width: 50%; }
    &.span-3 { min-width: 33%; }
    &.span-4 { min-width: 25%; }
    &.span-5 { min-width: 20%; }
    &.span-6 { min-width: 16%; }
    &.span-7 { min-width: 14%; }
    &.span-8 { min-width: 12.5%; }
  }
  .item-url {
    display: none;
  }
}

.item {
  flex-grow: 1;
  min-width: 0;
  color: var(--item-text-color);
  vertical-align: middle;
  margin: 0.5rem;
  background: var(--item-background);
  text-align: center;
  padding: 2px;
  outline: 2px solid transparent;
  border: 1px solid var(--outline-color);
  border-radius: var(--curve-factor);
  box-shadow: var(--item-shadow);
  cursor: pointer;
  text-decoration: none;
  position: relative;
  transition: all 0.2s ease-in-out 0s;
  &:hover {
    box-shadow: var(--item-hover-shadow);
    background: var(--item-background-hover);
    color: var(--item-text-color-hover);
  }
  &:focus {
    outline: 2px solid var(--primary);
  }
  &.add-new {
    border: 2px dashed var(--primary) !important;
  }
  &.short:not(.size-large) {
    min-height: 2rem;
  }
}

/* Text in tile */
.tile-title {
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1 1 auto;
  height: 30px;
  position: relative;
  padding: 0;
  z-index: 2;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  word-break: keep-all;
  overflow: hidden;
  span.text {
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    display: block;
  }
}

/* Container for status and ping indicators */
.indicators-container {
  display: flex;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
}

.opening-method-icon {
  display: none; // Hidden by default, visible on hover
}

/* Manage hover and focus actions */
.item:hover, .item:focus {
  /* Show opening-method icon */
  .opening-method-icon {
    display: block;
  }

  /* Hide the ellipsis while a truncated title is scrolled into view */
  .tile-title span.text {
    text-overflow: clip;
  }

  /* Apply transformation of icons on hover */
  .tile-icon, .tile-svg  {
    filter: var(--item-icon-transform-hover);
  }
}

/* Edit icon, visible in edit mode */
.item .edit-mode-item {
  width: 1rem;
  height: 1rem;
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
}

p.description {
  display: none; // By default, we don't show the description
}

/* Specify layout for alternate sized icons */
.item {
  /* Small Tile Specific Themes */
  &.size-small {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    align-items: center;
    height: 2rem;
    padding-top: 0.25rem;
    padding-left: 0.5rem;
    div img {
      width: 2rem;
    }
    .tile-title {
      height: fit-content;
      min-height: 1.2rem;
      text-align: left;
      max-width: 12rem;
      overflow: hidden;
      span.text {
        text-align: left;
        padding-left: 10%;
      }
    }
  }
  /* Medium Tile Specific Themes */
  &.size-medium {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: auto;
    width: 100%;
    .tile-title {
      min-width: 0;
      flex: 1 1 auto;
      max-width: none;
      &.no-icon {
        text-align: left;
        width: 100%;
        max-width: inherit;
        margin-left: 0.5rem;
      }
    }
  }
  /* Large Tile Specific Themes */
  &.size-large {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    text-align: left;
    overflow: hidden;
    align-items: center;
    max-height: 6rem;
    margin: 0.2rem;
    padding: 0.5rem;
    img {
      padding: 0.1rem 0.25rem;
    }
    .tile-title {
      height: auto;
      padding: 0.1rem 0.25rem;
      span.text {
        position: relative;
        font-weight: bold;
        font-size: 1.1rem;
        width: 100%;
      }
      p.description {
        margin: 0;
        display: block;
        white-space: pre-wrap;
        text-overflow: ellipsis;
        font-size: .9em;
        line-height: 1rem;
        height: 2rem;
        overflow: hidden;
      }
    }
  }
  &:before { // Certain themes (e.g. material) show css animated fas icon on hover
    display: none;
    font-family: FontAwesome;
    content: var(--open-icon, "\f054") !important;
  }
}

/* Adjust positioning of status indicator, when in edit mode */
a.item.is-edit-mode {
  &.size-medium .indicators-container { top: 1rem; }
  &.size-small .indicators-container { right: 1rem; }
  &.size-large .indicators-container { top: 1.5rem; }
}

.tile-passcode-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.15s ease;
  z-index: 2;

  &:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  .passcode-val {
    font-family: monospace;
    letter-spacing: 0.05em;
  }

  .eye-mini-btn {
    background: transparent;
    border: none;
    padding: 0 2px;
    color: #64748b;
    cursor: pointer;
    font-size: 0.75rem;
    &:hover {
      color: #0f172a;
    }
  }
}

.tile-quick-delete-btn {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 6px !important;
  color: #64748b !important;
  font-size: 0.75rem !important;
  padding: 4px 7px !important;
  cursor: pointer !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0.35 !important;
  transition: all 0.15s ease !important;

  &:hover {
    opacity: 1 !important;
    background: rgba(225, 29, 72, 0.2) !important;
    border-color: rgba(225, 29, 72, 0.5) !important;
    color: #f43f5e !important;
    box-shadow: 0 0 10px rgba(225, 29, 72, 0.3) !important;
  }
}

.item:hover .tile-quick-delete-btn {
  opacity: 0.75 !important;
}

</style>

<!-- An un-scoped style tag, since tooltip is outside this DOM tree -->
<style lang="scss">
.disabled-link {
  pointer-events: none;
}
.tooltip.item-description-tooltip {
  z-index: 7;
}
</style>
