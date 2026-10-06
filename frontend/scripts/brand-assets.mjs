// Gera os arquivos de marca do site (logo, hero, favicons, og:image) a partir dos originais em design/.
// Uso: npm run brand:assets (rodar de novo quando o design mudar).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const frontend = join(dirname(fileURLToPath(import.meta.url)), '..');
const design = join(frontend, '../design');
const output = join(frontend, 'public');

const png = (source, target, resize) => sharp(join(design, source)).resize(resize)
  .png({ compressionLevel: 9, palette: true }).toFile(join(output, target));
const webp = (source, target, resize) => sharp(join(design, source)).resize(resize)
  .webp({ quality: 88 }).toFile(join(output, target));

// ICO com as imagens PNG embutidas (formato aceito por todos os navegadores atuais).
async function icon(sources, target)
{
  const images = await Promise.all(sources.map(source => sharp(join(design, source)).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  for (const [index, image] of images.entries())
  {
    const { width, height } = await sharp(image).metadata();
    const entry = 6 + 16 * index;
    header.writeUInt8(width >= 256 ? 0 : width, entry);
    header.writeUInt8(height >= 256 ? 0 : height, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  }
  writeFileSync(join(output, target), Buffer.concat([header, ...images]));
}



await Promise.all([
  png('logo/logo-horizontal.png', 'logo-2turno.png', { height: 96 }),
  webp('hero/hero-desktop.png', 'hero-desktop.webp', { width: 2160 }),
  webp('hero/hero-mobile.png', 'hero-mobile.webp', { width: 1170 }),
  png('favicon/favicon-16.png', 'favicon-16x16.png'),
  png('favicon/favicon-32.png', 'favicon-32x32.png'),
  png('favicon/apple-touch-icon-180.png', 'apple-touch-icon.png'),
  png('social/og-image.png', 'og-image.png'),
  icon(['favicon/favicon-16.png', 'favicon/favicon-32.png'], 'favicon.ico')
]);
process.stdout.write('Arquivos de marca gerados em frontend/public.\n');
