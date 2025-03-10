import cjs from '@rollup/plugin-commonjs';
import node from '@rollup/plugin-node-resolve';
import {terser} from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: 'venomaps.js',
    output: [
      {file: '../js/venomaps-bundle.js', format: 'iife', sourcemap: true, inlineDynamicImports: true}
    ],
    plugins: [
      node({browser: true}),
      cjs(),
      production && terser()
    ],
  },
  {
    input: 'venomaps-admin.js',
    output: [
      {file: '../js/venomaps-admin-bundle.js', format: 'iife', sourcemap: true, inlineDynamicImports: true}
    ],
    plugins: [
      node({browser: true}),
      cjs(),
      production && terser()
    ],
  }
];
