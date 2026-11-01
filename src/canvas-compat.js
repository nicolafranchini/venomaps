const PATCH_FLAG = '__venomapsCanvasPatched';

export function patchFirefoxCanvas() {
  if (typeof window === 'undefined' || window[PATCH_FLAG]) return;

  const isFirefox = /firefox/i.test(navigator.userAgent) ||
    (typeof CSS !== 'undefined' && CSS.supports('-moz-appearance', 'none'));

  if (!isFirefox || typeof HTMLCanvasElement === 'undefined') return;

  const getContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function (type, attributes) {
    if (type === '2d') {
      attributes = Object.assign({}, attributes, { willReadFrequently: true });
    }
    return getContext.call(this, type, attributes);
  };

  window[PATCH_FLAG] = true;
}
