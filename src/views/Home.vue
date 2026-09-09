<!-- Main homepage for default view -->
<template>
  <div class="home" :style="getBackgroundImage()">
    <!-- Search bar, layout options and settings -->
    <SettingsContainer ref="filterComp"
      @user-is-searchin="searching"
      class="settings-outer"
    />
    <!-- Show back button, when on single-section view -->
    <div v-if="singleSectionView">
      <router-link :to="backToAllPath" class="back-to-all-link">
        <BackIcon />
        <span>Back to All</span>
      </router-link>
    </div>
    <!-- Main content, section for each group of items -->
    <!-- Category Quick Filter Bar -->
    <div v-if="checkTheresData(sections) && !singleSectionView && !searchValue" class="quant-category-bar">
      <button
        class="category-tab-btn"
        :class="{ active: selectedCategory === 'ALL' }"
        @click="selectedCategory = 'ALL'"
      >
        <i class="fas fa-layer-group"></i>
        <span>Todos los Sectores</span>
        <span class="tab-count">{{ totalItemCount }}</span>
      </button>
      <button
        v-for="section in rawSections"
        :key="section.name"
        class="category-tab-btn"
        :class="{ active: selectedCategory === section.name }"
        @click="selectedCategory = section.name"
      >
        <i :class="section.icon || 'fas fa-folder'"></i>
        <span>{{ section.name }}</span>
        <span class="tab-count">{{ section.items ? section.items.length : 0 }}</span>
      </button>

      <!-- Auto-Organize Quick Action Button -->
      <button
        v-if="totalItemCount > 0"
        class="category-tab-btn auto-organize-btn"
        @click="handleAutoOrganize"
        title="🪄 Auto-organizar todos los accesos en sectores institucionales limpios con 1 clic"
      >
        <i class="fas fa-magic"></i>
        <span>🪄 Auto-Organizar</span>
      </button>
    </div>

    <div v-if="checkTheresData(sections) || isEditMode" :class="computedClass"
      ref="sectionsContainer" v-drag-sort="sectionDragConfig">
      <template v-for="section in filteredSections" :key="makeSectionId(section)">
        <Section
          :index="section.configIndex"
          :title="section.name"
          :icon="section.icon || undefined"
          :displayData="getDisplayData(section)"
          :groupId="makeSectionId(section)"
          :items="section.filteredItems"
          :widgets="section.widgets"
          :itemSize="itemSizeBound"
          @itemClicked="finishedSearching()"
          @change-modal-visibility="updateModalVisibility"
          :isWide="!!singleSectionView || layoutOrientation === 'horizontal'"
          :class="(searchValue && section.filteredItems.length === 0) ? 'no-results' : ''"
          :activeColCount="activeColCount"
        />
      </template>
      <!-- Show add new section button, in edit mode -->
      <AddNewSection v-if="isEditMode && !singleSectionView" />
    </div>
    <!-- Show Drag & Drop Zone when dashboard is empty -->
    <PasscodeDropZone
      v-if="!checkTheresData(sections) && !searchValue"
      :isEmptyState="true"
    />
    <!-- Floating / Window Drag & Drop when dashboard has items -->
    <PasscodeDropZone
      v-else-if="checkTheresData(sections)"
      :isEmptyState="false"
    />
    <!-- Show message when searching and there are no results -->
    <div v-if="searchValue && checkIfResults(filteredSections) && !isEditMode" class="no-data">
      <template v-if="isBootstrap">
        {{ $t('home.session-expired-line1') }}
        <p class="hint">{{ $t('home.session-expired-line2') }}</p>
        <Button :click="reAuth">{{ $t('home.sign-in-again') }}</Button>
      </template>
      <template v-else>
        {{ $t('home.no-results') }}
      </template>
    </div>
    <!-- Show banner at bottom of screen, for Saving config changes -->
    <EditModeSaveMenu v-if="isEditMode" />
    <!-- Shows pertinent info -->
    <NotificationThing v-if="$store.state.isUsingLocalConfig"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import HomeMixin from '@/mixins/HomeMixin';
import ConfigSavingMixin from '@/mixins/ConfigSaving';
import SettingsContainer from '@/components/Settings/SettingsContainer.vue';
import Section from '@/components/LinkItems/Section.vue';
import NotificationThing from '@/components/Settings/LocalConfigWarning.vue';
import PasscodeDropZone from '@/components/LinkItems/PasscodeDropZone.vue';
import Button from '@/components/FormElements/Button';
import {
  makePageName, makeRoutePath, resolveRouteIntent, viewFromPath,
} from '@/utils/config/ConfigHelpers';
import ErrorHandler from '@/utils/logging/ErrorHandler';
import StoreKeys from '@/utils/StoreMutations';
import { reorder } from '@/directives/DragSort';
import { autoOrganizeSections } from '@/utils/smartClassifier';
import BackIcon from '@/assets/interface-icons/back-arrow.svg';

const EditModeSaveMenu = defineAsyncComponent(() => import('@/components/InteractiveEditor/EditModeSaveMenu.vue'));
const AddNewSection = defineAsyncComponent(() => import('@/components/InteractiveEditor/AddNewSectionLauncher.vue'));

export default {
  name: 'home',
  mixins: [HomeMixin, ConfigSavingMixin],
  components: {
    SettingsContainer,
    EditModeSaveMenu,
    AddNewSection,
    NotificationThing,
    PasscodeDropZone,
    Section,
    BackIcon,
    Button,
  },
  data: () => ({
    layout: '',
    itemSizeBound: '',
    activeColCount: 1,
    selectedCategory: 'ALL',
  }),
  computed: {
    singleSectionView() {
      const { sectionSlug } = resolveRouteIntent(this.$route, this.$store);
      if (!sectionSlug) return undefined;
      return this.findSingleSection(this.$store.getters.sections, sectionSlug);
    },
    /* Back link from single-section view */
    backToAllPath() {
      const view = viewFromPath(this.$route.path);
      const confId = this.$store.state.currentConfigInfo?.confId || null;
      return makeRoutePath(view, confId);
    },
    /* Get class for num columns, if specified by user */
    colCount() {
      let { colCount } = this.appConfig;
      if (!colCount) return null;
      if (colCount < 1) colCount = 1;
      if (colCount > 8) colCount = 8;
      return colCount;
    },
    rawSections() {
      return this.$store.state.config?.sections || [];
    },
    totalItemCount() {
      return this.rawSections.reduce((acc, s) => acc + (s.items?.length || 0), 0);
    },
    /* Return sections with filtered items, that match users search term.
     * Each is tagged with its index in the raw config, since the rendered
     * list may be filtered (e.g. sections hidden for the current user) */
    filteredSections() {
      const rawSections = this.$store.state.config.sections || [];
      let sections = this.singleSectionView || this.sections;
      if (this.selectedCategory !== 'ALL' && !this.singleSectionView && !this.searchValue) {
        sections = sections.filter((s) => s.name === this.selectedCategory);
      }
      const showHidden = this.isEditMode || !!this.searchValue || !!this.singleSectionView;
      return sections.map((section) => ({
        ...section,
        configIndex: rawSections.indexOf(section),
        filteredItems: this.filterTiles(section.items, section.name, { showHidden }),
      }));
    },
    /* Updates layout (when button clicked), and saves in local storage */
    layoutOrientation() {
      return this.$store.getters.layout;
    },
    /* Updates icon size (when button clicked), and saves in local storage */
    iconSize() {
      return this.$store.getters.iconSize;
    },
    computedClass() {
      let classes = 'item-group-container '
      + ` orientation-${this.$store.getters.layout} item-size-${this.itemSizeBound}`;
      if (this.isEditMode) classes += ' edit-mode';
      if (this.singleSectionView) classes += ' single-section-view';
      if (this.colCount) classes += ` col-count-${this.colCount}`;
      return classes;
    },
    /* Config for drag-and-drop. Is disabled if sections don't match stored config */
    sectionDragConfig() {
      const storedSections = this.$store.state.config.sections || [];
      return {
        enabled: this.isEditMode && !this.singleSectionView
          && this.sections.length === storedSections.length,
        handle: '.section-header',
        draggable: '.collapsable',
        onSorted: this.handleSectionMoved,
      };
    },
  },
  watch: {
    /* Re-read col count once after config loaded */
    sections() {
      this.$nextTick(this.readActiveColCount);
    },
  },
  methods: {
    /* Clears input field, once a searched item is opened */
    finishedSearching() {
      if (this.$refs.filterComp) this.$refs.filterComp.clearFilterInput();
    },
    /* Returns optional section display preferences if available */
    getDisplayData(section) {
      const displayData = section.displayData ? { ...section.displayData } : {};
      if (this.singleSectionView) displayData.collapsed = false;
      return displayData;
    },
    /* If on sub-route, and section exists, then return only that section */
    findSingleSection: (allSections, sectionTitle) => {
      if (!sectionTitle) return undefined;
      const target = makePageName(sectionTitle);
      const match = allSections.find((s) => makePageName(s.name || '') === target);
      if (!match) ErrorHandler(`No section named '${sectionTitle}' was found`);
      return match ? [match] : undefined;
    },
    /* Commits the new section order, after a drag-and-drop */
    handleSectionMoved({ oldIndex, newIndex }) {
      const { sections } = this.$store.state.config;
      this.$store.commit(StoreKeys.SET_SECTIONS, reorder(sections || [], oldIndex, newIndex));
    },
    readActiveColCount() {
      const { sectionsContainer } = this.$refs;
      if (!sectionsContainer) return;
      const cs = getComputedStyle(sectionsContainer);
      const varVal = parseInt(cs.getPropertyValue('--col-count'), 10);
      if (!Number.isNaN(varVal) && varVal > 0) {
        this.activeColCount = varVal;
      }
    },
    async handleAutoOrganize() {
      if (this.totalItemCount === 0) return;
      if (!confirm(`¿Auto-organizar ${this.totalItemCount} servicios en sectores institucionales limpios? Todos los accesos se distribuirán automáticamente por categoría (Trading, IA, Cloud, Vault, etc.).`)) {
        return;
      }

      const currentSections = this.$store.state.config?.sections || [];
      const organized = autoOrganizeSections(currentSections);

      this.$store.commit(StoreKeys.SET_SECTIONS, organized);
      const fullConfig = {
        ...this.$store.state.config,
        sections: organized,
      };
      await this.writeConfigToDisk(fullConfig);
      this.saveConfigLocally(fullConfig);
      this.selectedCategory = 'ALL';
    },
  },
  mounted() {
    this.initiateFontAwesome();
    this.initiateMaterialDesignIcons();
    this.layout = this.layoutOrientation;
    this.itemSizeBound = this.iconSize;
    this.readActiveColCount();
    window.addEventListener('resize', this.readActiveColCount);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.readActiveColCount);
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/media-queries.scss';
@import '@/styles/style-helpers.scss';

.home {
  padding-bottom: 1px;
  background: var(--background);
  min-height: calc(99.9vh - var(--footer-height));
}

.back-to-all-link {
  display: flex;
  align-items: center;
  padding: 0.25rem;
  margin: 0.25rem;
  @extend .svg-button;
  svg { margin-right: 0.5rem; }
  text-decoration: none;
}

/* Outside container wrapping the item groups*/
.item-group-container {
  display: grid;
  gap: 0.5rem;
  margin: 0 auto;
  max-width: var(--content-max-width, 90%);
  overflow: auto;
  @extend .scroll-bar;
  @include monitor-up {
    max-width: var(--content-max-width, 85%);
  }

  /* Masonry layout - sections auto-positioned to make best use of space.
   * Row span is computed per-section from content height against --masonry-row-unit */
  &.orientation-masonry {
    grid-auto-rows: var(--masonry-row-unit, 8px);
    grid-auto-flow: row dense;
    row-gap: 0;
  }

  /* Options for alternate layouts, triggered by buttons */
  &.orientation-horizontal {
    display: flex;
    flex-direction: column;
  }
  &.orientation-vertical {
    max-width: 100%;
    @include tablet-up {
      display: flex;
      flex-direction: row;
    }
  }
  &.orientation-horizontal, &.orientation-vertical, &.single-section-view {
    @include phone { max-width: var(--content-max-width, 100%); }
    @include tablet { max-width: var(--content-max-width, 98%); }
    @include laptop { max-width: var(--content-max-width, 90%); }
    @include monitor { max-width: var(--content-max-width, 85%); }
    @include big-screen { max-width: var(--content-max-width, 80%); }
    @include big-screen-up { max-width: var(--content-max-width, 60%); }
  }

  /* Specify number of columns, based on screen size or user preference */
  @include phone { --col-count: 1; }
  @include tablet { --col-count: 2; }
  @include laptop { --col-count: 2; }
  @include monitor { --col-count: 3; }
  @include big-screen { --col-count: 4; }
  @include big-screen-up { --col-count: 5; }

  @include tablet-up {
    &.col-count-1 { --col-count: 1; }
    &.col-count-2 { --col-count: 2; }
    &.col-count-3 { --col-count: 3; }
    &.col-count-4 { --col-count: 4; }
    &.col-count-5 { --col-count: 5; }
    &.col-count-6 { --col-count: 6; }
    &.col-count-7 { --col-count: 7; }
    &.col-count-8 { --col-count: 8; }
  }

  grid-template-columns: repeat(var(--col-count, 2), minmax(0, 1fr));

  /* Hide when search term returns nothing */
  .no-results { display: none !important; }

  /* Additional spacing when in edit mode */
  &.edit-mode {
    margin-bottom: 12rem;
  }

  /* Drag-and-drop things, when section sorting is enabled */
  &.drag-sort-active {
    :deep(.collapsable .section-header) {
      cursor: grab;
    }
    // for empty drop slot
    :deep(.collapsable.drag-sort-ghost) {
      opacity: 0.4;
      outline: 2px dashed var(--primary);
      outline-offset: -2px;
      transition: none !important;
      transform: none !important;
      > * {
        visibility: hidden;
        transition: none !important;
      }
    }
  }

  /* When in single-section view mode */
  &.single-section-view {
    display: block;
  }
  .add-new-section {
    border: 2px dashed var(--primary);
    border-radius: var(--curve-factor);
    padding: var(--item-group-padding);
    background: var(--item-group-background);
    color: var(--primary);
    font-size: 1.2rem;
    cursor: pointer;
    text-align: center;
    height: fit-content;
    margin: 10px;
  }
}

/* Custom styles only applied when there is no sections in config */
.no-data {
    background: var(--background-darker);
    color: var(--primary);
    width: fit-content;
    margin: 2rem auto;
    padding: 0.5rem 1rem;
    border-radius: var(--curve-factor);
    border: 1px solid var(--primary);
    font-size: 1.8rem;
    text-align: center;
    .hint {
      margin: 0.25rem auto;
      font-size: 1rem;
      opacity: 0.8;
    }
}

/* Settings section, includes search, config and user settings */
section.settings-outer {
  border-bottom: 1px solid var(--outline-color);
  @include phone {
    flex-direction: column;
  }
}

/* Quant Sector Quick Filter Bar */
.quant-category-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 1850px;
  margin: 0 auto;
  padding: 0.5rem 2rem 1rem 2rem;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  .category-tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 7px 14px;
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: inherit;
    letter-spacing: 0.01em;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    flex-shrink: 0;

    i {
      color: #64748b;
      font-size: 0.82rem;
      transition: color 0.2s ease;
    }

    .tab-count {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      padding: 1px 6px;
      border-radius: 6px;
    }

    &:hover {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(59, 130, 246, 0.4);
      color: #f8fafc;
      i { color: #38bdf8; }
    }

    &.active {
      background: rgba(37, 99, 235, 0.2);
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);

      i {
        color: #38bdf8;
      }

      .tab-count {
        background: #3b82f6;
        color: #ffffff;
      }
    }

    &.auto-organize-btn {
      margin-left: auto;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(14, 165, 233, 0.25));
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #38bdf8;
      font-weight: 700;

      i {
        color: #38bdf8;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.5), rgba(14, 165, 233, 0.5));
        border-color: #38bdf8;
        color: #ffffff;
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
        transform: translateY(-1px);
      }
    }
  }
}

</style>
