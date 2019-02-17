import { computed } from '@ember/object';
import Component from '@ember/component';
import { htmlSafe } from '@ember/string';
import idFromView from 'ember-inspector/libs/id-from-view';

export default Component.extend({
  item: null,
  tagName: '',

  labelStyle: computed('item.parentCount', function() {
    let expanderOffset = this.get('item.hasChildren') ? 12 : 0;
    let padding = this.get('item.parentCount') * 20 - expanderOffset + 25;
    return htmlSafe(`padding-left: ${padding}px;`);
  }),

  hasElement: computed('item', function() {
    return this.get('item.view.tagName') !== '';
  }),

  objectId: computed('item', function() {
    return idFromView(this.get('item'));
  }),

  tagNameClass: computed('currentHighlightedObjectId', 'objectId', 'item.view.isComponent', function() {
    const highlight = this.get('currentHighlightedObjectId') === this.get('objectId') ? 'component-tree-item__tag--current-highlight' : '';
    const bracketType = this.get('item.view.isComponent') ? 'component-tree-item__bracket' : '';
    return `component-tree-item__tag ${highlight} ${bracketType}`;
  })
});
