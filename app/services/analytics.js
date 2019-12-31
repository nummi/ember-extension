import Service from '@ember/service';
import { inject as service } from '@ember/service';

export default class AnalyticsService extends Service {
  @service router;

  send() {
    console.log('send:', arguments);
  }

  appLaunch() {
    const {
      name, version, os
    } = window.platform;

    this.send({
      page: '/',
      title: 'launch',
      data: {
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
        navigator: {
          language: window.navigator.language
        },
        browser: {
          name,
          version,
        },
        os: {
          family: os.family,
          version: os.version,
        }
      }
    });
  }

  pageView() {
    this.send('pageview', {
      page: this.router.currentURL,
      title: this.router.currentRouteName,
    });
  }
}
