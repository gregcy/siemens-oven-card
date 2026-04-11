import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/siemens-oven-card.ts',
  output: {
    file: 'dist/siemens-oven-card.js',
    format: 'es',
    sourcemap: false,
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser(),
  ],
};
