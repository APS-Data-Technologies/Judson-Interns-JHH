import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Some Node builds ship an experimental, flag-gated global `localStorage` that
// shadows jsdom's own working implementation and leaves `window.localStorage`
// undefined unless `--localstorage-file` is passed. Fall back to a small
// in-memory Storage polyfill whenever the environment's localStorage is
// missing or non-functional, so tests are deterministic across Node versions.
function localStorageWorks(): boolean {
  try {
    const key = '__storage_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

if (!localStorageWorks()) {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();

    get length() {
      return this.store.size;
    }

    clear(): void {
      this.store.clear();
    }

    getItem(key: string): string | null {
      return this.store.has(key) ? this.store.get(key)! : null;
    }

    key(index: number): string | null {
      return Array.from(this.store.keys())[index] ?? null;
    }

    removeItem(key: string): void {
      this.store.delete(key);
    }

    setItem(key: string, value: string): void {
      this.store.set(key, String(value));
    }
  }

  Object.defineProperty(window, 'localStorage', {
    value: new MemoryStorage(),
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
