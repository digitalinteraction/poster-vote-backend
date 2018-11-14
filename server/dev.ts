import { join } from 'path'

const resolve = (file: string) => join(__dirname, '../frontend', file)

export async function startBundler() {
  let Bundler = await import('parcel-bundler')

  let bundler = new Bundler([resolve('app.ts')], {
    outDir: 'dist/frontend',
    watch: true
  })

  await bundler.bundle()
}
