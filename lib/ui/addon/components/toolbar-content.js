import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import layout from '../templates/components/toolbar-content';

export default Component.extend({
  layout,
  layoutService: service('layout'),
  classNames: ['toolbar-content'],

  hiddenItemStartIndex: 1000,

  hiddenItems: computed('hiddenItemStartIndex', function() {
    return this.items.slice(this.hiddenItemStartIndex, this.items.length);
  }),

  visibleItems: computed('hiddenItemStartIndex', function() {
    return this.items.slice(0, this.hiddenItemStartIndex - 1);
  }),

  didInsertElement() {
    if (this.items) {
      this.get('layoutService').on('resize', this, this.onResize);
      this.get('layoutService').on('content-height-update', this, this.onResize);
      this.onResize();
    }
  },

  willDestroyElement() {
    if (this.items) {
      this.get('layoutService').off('resize', this, this.onResize);
      this.get('layoutService').off('content-height-update', this, this.onResize);
    }
  },

  onResize() {
    if (!this.element) { return; }
    const clone = this.element.querySelector('.toolbar__cloned-content');
    const children = Array.from(clone.children);
    const toolbarWidth = clone.getBoundingClientRect().width;

    let firstHiddenIndex = 1000;

    children.slice().reverse().forEach((c) => {
      const itemWidth = c.getClientRects()[0].width;

      // -30 for toolbar hide button
      if (c.offsetLeft + (itemWidth / 2) > (toolbarWidth - 30)) {
        firstHiddenIndex = children.indexOf(c);
      }
    });

    this.set('hiddenItemStartIndex', firstHiddenIndex);
  },

  actions: {
    toggleMore() {

    }
  }
});
