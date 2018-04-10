import { computed } from '@ember/object';
import Component from '@ember/component';
import { equal, alias, and } from '@ember/object/computed';

export default Component.extend({
  isEdit: false,

  /**
   * Passed through the template.
   *
   * The mixin-detail component
   * @type {Ember.Component}
   */
  mixin: null,

  // Bound to editing textbox
  txtValue: null,
  dateValue: null,

  isCalculated: computed('model.value.type', function() {
    return this.get('model.value.type') !== 'type-descriptor';
  }),

  isService: alias('model.isService'),

  isOverhidden: alias('model.overridden'),

  isEmberObject: equal('model.value.type', 'type-ember-object'),

  isComputedProperty: alias('model.value.computed'),

  isFunction: equal('model.value.type', 'type-function'),

  isArray: equal('model.value.type', 'type-array'),

  isDate: equal('model.value.type', 'type-date'),

  isDepsExpanded: false,

  showDependedKeys: and('isDepsExpanded', 'model.dependentKeys.length', 'isCalculated'),

  _parseTextValue(value) {
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch (e) {
      // if surrounded by quotes, remove quotes
      let match = value.match(/^"(.*)"$/);
      if (match && match.length > 1) {
        parsedValue = match[1];
      } else {
        parsedValue = value;
      }
    }
    return parsedValue;
  },

  actions: {
    toggleDeps() {
      this.toggleProperty('isDepsExpanded');
    },
    valueClick() {
      if (this.get('isEmberObject') || this.get('isArray')) {
        this.get('mixin').send('digDeeper', this.get('model'));
        return;
      }

      if (this.get('isComputedProperty') && !this.get('isCalculated')) {
        this.get('mixin').send('calculate', this.get('model'));
        return;
      }

      if (this.get('isFunction') || this.get('model.overridden') || this.get('model.readOnly')) {
        return;
      }

      let value = this.get('model.value.inspect');
      let type = this.get('model.value.type');
      if (type === 'type-string') {
        value = `"${value}"`;
      }
      if (!this.get('isDate')) {
        this.set('txtValue', value);
      } else {
        this.set('dateValue', new Date(value));
      }
      this.set('isEdit', true);
    },

    saveProperty() {
      let realValue, dataType;
      if (!this.get('isDate')) {
        realValue = this._parseTextValue(this.get('txtValue'));
      } else {
        realValue = this.get('dateValue').getTime();
        dataType = 'date';
      }
      this.get('mixin').send('saveProperty', this.get('model.name'), realValue, dataType);
    },

    finishedEditing() {
      this.set('isEdit', false);
    },

    dateSelected(val) {
      this.set('dateValue', val);
      this.send('saveProperty');
      this.send('finishedEditing');
    }
  }
});
