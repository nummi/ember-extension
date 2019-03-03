import Component from '@ember/component';
import layout from '../templates/components/toolbar-search-field';

export default Component.extend({
  layout,
  classNames: ['toolbar__search'],

  actions: {
    clear() {
      this.element.querySelector('input').focus();
      this.set('value', '');
    }
  }
});
