import Component from '@ember/component';
import { inject as service } from '@ember/service';
import layout from '../templates/components/toolbar-x';

export default Component.extend({
  layout,
  layoutService: service('layout'),
  classNames: ['toolbar'],

  didInsertElement() {
    this.get('layoutService').on('resize', this.onResize);
  },

  onResize() {
  }
});
