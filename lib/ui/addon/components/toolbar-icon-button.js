import Component from '@ember/component';
import layout from '../templates/components/toolbar-icon-button';

export default Component.extend({
  layout,
  attributeBindings: ['title'],
  classNames: ['toolbar__icon-button'],
  classNameBindings: ['active'],

  tagName: 'button',

  active: false,
  title: null,

  click() {
    this.onclick();
  }
});
