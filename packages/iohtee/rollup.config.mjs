import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

const plugins = [
  resolve({
    preferBuiltins: true,
  }),
  typescript({
    tsconfig: './tsconfig.rollup.json',
    declaration: false,
    sourceMap: false,
  }),
  terser(),
]

const external = (id) =>
  id.startsWith('node:') ||
  id === 'viem' ||
  id.startsWith('viem/') ||
  id === 'pg' ||
  id === '@riaskov/iohtee-contracts'

export default [
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'lib-bundle/esm/iohtee.min.mjs',
      format: 'es',
      sourcemap: false,
    },
    plugins,
  },
  {
    input: 'src/index.ts',
    external,
    output: {
      file: 'lib-bundle/cjs/iohtee.min.cjs',
      format: 'cjs',
      sourcemap: false,
      exports: 'named',
    },
    plugins,
  },
]
