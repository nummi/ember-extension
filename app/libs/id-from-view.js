import { get } from '@ember/object';

export default function(view) {
  return get(view, 'view.objectId') || get(view, 'view.controller.objectId') || get(view, 'view.elementId');
}
