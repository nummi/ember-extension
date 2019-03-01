import Component from '@ember/component';

export default Component.extend({
  attributeBindings: ['title'],
  classNames: ['toolbar__icon-button'],

  tagName: 'button',

  title: null,

  click() {
    this.onclick();
  }
});
