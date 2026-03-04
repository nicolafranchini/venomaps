import node from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import postCSSImport from 'postcss-import';
import cssnano from 'cssnano';

const isWatch = process.env.ROLLUP_WATCH;

/**
 * @param {string} input - Sorgente
 * @param {string} name - Nome base
 * @param {boolean} isMinified - Se minificare
 */
const createConfig = (input, name, isMinified) => {
  const suffix = isMinified ? '.min' : '';
  const outputJS = `js/${name}-bundle${suffix}.js`;
  const outputCSS = `${name}-bundle${suffix}.css`;

  const useSourceMaps = isWatch && !isMinified;

  return {
    input: input,
    output: {
      dir: '.',
      entryFileNames: outputJS,
      format: 'iife',
      name: name.replace('-', '_'),
      sourcemap: useSourceMaps,
    },
    plugins: [
      node({ browser: true }),
      cjs(),
      postcss({
        extract: `css/${outputCSS}`,
        minimize: isMinified,
        sourceMap: useSourceMaps,
        plugins: [
          postCSSImport(),
          isMinified && cssnano()
        ].filter(Boolean)
      }),
      isMinified && terser()
    ]
  };
};

const configs = [];

configs.push(createConfig('src/venomaps.js', 'venomaps', false));
configs.push(createConfig('src/venomaps-admin.js', 'venomaps-admin', false));

if (!isWatch) {
  configs.push(createConfig('src/venomaps.js', 'venomaps', true));
  configs.push(createConfig('src/venomaps-admin.js', 'venomaps-admin', true));
}

export default configs;