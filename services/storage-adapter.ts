// 检测运行环境
const isElectron = () => {
    return typeof window !== 'undefined' && 'electronAPI' in window;
};

interface StorageAdapter {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

// Electron 存储适配器
class ElectronStorageAdapter implements StorageAdapter {
    async getItem(key: string): Promise<string | null> {
        return await (window as any).electronAPI.getData(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        await (window as any).electronAPI.setData(key, value);
    }

    async removeItem(key: string): Promise<void> {
        await (window as any).electronAPI.removeData(key);
    }
}

// 浏览器 localStorage 适配器
class BrowserStorageAdapter implements StorageAdapter {
    async getItem(key: string): Promise<string | null> {
        return localStorage.getItem(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        localStorage.setItem(key, value);
    }

    async removeItem(key: string): Promise<void> {
        localStorage.removeItem(key);
    }
}

// 导出统一接口
export const storage: StorageAdapter = isElectron()
    ? new ElectronStorageAdapter()
    : new BrowserStorageAdapter();

// IndexedDB 适配器
export class IndexedDBAdapter {
    private dbName: string;

    constructor(dbName: string) {
        this.dbName = dbName;
    }

    async open() {
        if (isElectron()) {
            await (window as any).electronAPI.idb.open(this.dbName);
        }
        // 浏览器环境的 IndexedDB 在 memory.ts 中已处理
    }

    async get(storeName: string, key: string) {
        if (isElectron()) {
            return await (window as any).electronAPI.idb.get(this.dbName, storeName, key);
        }
        return null;
    }

    async put(storeName: string, key: string, value: any) {
        if (isElectron()) {
            await (window as any).electronAPI.idb.put(this.dbName, storeName, key, value);
        }
    }

    async getAll(storeName: string) {
        if (isElectron()) {
            return await (window as any).electronAPI.idb.getAll(this.dbName, storeName);
        }
        return [];
    }

    async delete(storeName: string, key: string) {
        if (isElectron()) {
            await (window as any).electronAPI.idb.delete(this.dbName, storeName, key);
        }
    }

    async clear(storeName: string) {
        if (isElectron()) {
            await (window as any).electronAPI.idb.clear(this.dbName, storeName);
        }
    }
}

// 导出环境检测
export const isDesktopApp = isElectron();

// ==================== Cloud Storage Support ====================

export type StorageMode = 'local' | 'cloud';

class StorageManager {
    private mode: StorageMode = 'local';
    private cloudAdapter: any = null;
    private userId: string | null = null;

    setMode(mode: StorageMode): void {
        this.mode = mode;
    }

    getMode(): StorageMode {
        return this.mode;
    }

    async setUserId(userId: string): Promise<void> {
        this.userId = userId;
        if (this.mode === 'cloud' && this.cloudAdapter) {
            await this.cloudAdapter.setUserId(userId);
        }
    }

    async getItem(key: string): Promise<string | null> {
        if (this.mode === 'cloud' && this.cloudAdapter) {
            return await this.cloudAdapter.getItem(key);
        }
        return await storage.getItem(key);
    }

    async setItem(key: string, value: string): Promise<void> {
        if (this.mode === 'cloud' && this.cloudAdapter) {
            await this.cloudAdapter.setItem(key, value);
        } else {
            await storage.setItem(key, value);
        }
    }

    async removeItem(key: string): Promise<void> {
        if (this.mode === 'cloud' && this.cloudAdapter) {
            await this.cloudAdapter.removeItem(key);
        } else {
            await storage.removeItem(key);
        }
    }

    async isCloudAvailable(): Promise<boolean> {
        try {
            const { isSupabaseConfigured } = await import('./supabase-adapter');
            return isSupabaseConfigured();
        } catch {
            return false;
        }
    }

    setCloudAdapter(adapter: any): void {
        this.cloudAdapter = adapter;
    }
}

// Singleton instance
export const storageManager = new StorageManager();

