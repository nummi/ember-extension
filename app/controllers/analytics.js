import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class Analytics extends Controller {
  @tracked enabled = true;
  message = window.EmberENV.ANALYTICS.message;

  @action toggleAnalytics() {
    this.enabled = !this.enabled;
  }
}
