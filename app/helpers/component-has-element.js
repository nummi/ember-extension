import { helper } from '@ember/component/helper';

export function componentHasElement(params) {
  const [view] = params;
  return view.tagName !== '';
}

export default helper(componentHasElement);
