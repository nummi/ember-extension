import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: '',

  readableTime: computed('model.timestamp', function() {
    const d = new Date(this.get('model.timestamp'));
    const ms = d.getMilliseconds();
    const seconds = d.getSeconds();
    const minutes = d.getMinutes().toString().length === 1 ? `0${d.getMinutes()}` : d.getMinutes();
    const hours = d.getHours().toString().length === 1 ? `0${d.getHours()}` : d.getHours();

    return `${hours}:${minutes}:${seconds}:${ms}`;
  })
});
