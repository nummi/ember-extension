import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('search-field', function(hooks) {
  setupRenderingTest(hooks);

  test('should render the search field', async function(assert) {
    assert.expect(2);

    this.set('value', 'GLIMMER!');

    await render(hbs`{{search-field value=value}}`);

    assert.equal(
      this.element.querySelector('input').value,
      'GLIMMER!',
      'value is displayed'
    );

    await click('button');

    assert.equal(
      this.element.querySelector('input').value,
      '',
      'value is cleared'
    );
  });
});
