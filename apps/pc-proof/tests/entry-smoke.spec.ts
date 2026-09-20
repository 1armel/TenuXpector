/**
 * Fumée des points d’entrée (couverture des câblages Electron).
 */
import { describe, expect, it } from 'vitest';

describe('entry modules', () => {
  it('charge le préchargement sans lever', async () => {
    await expect(import('../src/preload/preload')).resolves.toBeTypeOf('object');
  });

  it('charge le processus principal sans lever', async () => {
    await expect(import('../src/main/main')).resolves.toBeTypeOf('object');
  });
});
