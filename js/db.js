/* ============================================
   db.js — IndexedDB Data Layer
   CaféControl — v4 (Ciclos)
   ============================================ */

const DB_NAME = 'CafeControlDB';
const DB_VERSION = 5;

const STORES = {
    obreros: { keyPath: 'id', autoIncrement: true, indexes: ['nombre', 'estado'] },
    lotes: { keyPath: 'id', autoIncrement: true, indexes: ['nombre', 'fincaId'] },
    jornales: { keyPath: 'id', autoIncrement: true, indexes: ['obreroId', 'loteId', 'fecha', 'fincaId', 'cicloId'] },
    asistencia: { keyPath: 'id', autoIncrement: true, indexes: ['obreroId', 'fecha'] },
    comida: { keyPath: 'id', autoIncrement: true, indexes: ['obreroId', 'fecha', 'cicloId'] },
    productos: { keyPath: 'id', autoIncrement: true, indexes: ['nombre', 'categoria'] },
    ventasCaja: { keyPath: 'id', autoIncrement: true, indexes: ['obreroId', 'productoId', 'fecha', 'cicloId'] },
    cascota: { keyPath: 'id', autoIncrement: true, indexes: ['loteId', 'fecha', 'fincaId'] },
    conversion: { keyPath: 'id', autoIncrement: true, indexes: ['fecha', 'fincaId'] },
    pagos: { keyPath: 'id', autoIncrement: true, indexes: ['obreroId', 'fechaPago', 'fincaId', 'cicloId'] },
    fincas: { keyPath: 'id', autoIncrement: true, indexes: ['nombre'] },
    ciclos: { keyPath: 'id', autoIncrement: true, indexes: ['fincaId', 'activo'] },
    cycle_stats: { keyPath: 'id', autoIncrement: true, indexes: ['fincaId', 'cycle_id'] },
    transportes: { keyPath: 'id', autoIncrement: true, indexes: ['fincaId', 'loteId', 'cicloId', 'fecha', 'createdAt'] },
    config: { keyPath: 'key' }
};

class CafeDB {
    constructor() {
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                for (const [name, opts] of Object.entries(STORES)) {
                    if (!db.objectStoreNames.contains(name)) {
                        const storeOpts = { keyPath: opts.keyPath };
                        if (opts.autoIncrement) storeOpts.autoIncrement = true;
                        const store = db.createObjectStore(name, storeOpts);
                        if (opts.indexes) {
                            opts.indexes.forEach(idx => {
                                store.createIndex(idx, idx, { unique: false });
                            });
                        }
                    } else {
                        // Add new indexes to existing stores if missing
                        try {
                            const tx = e.target.transaction;
                            const store = tx.objectStore(name);
                            if (opts.indexes) {
                                opts.indexes.forEach(idx => {
                                    if (!store.indexNames.contains(idx)) {
                                        store.createIndex(idx, idx, { unique: false });
                                    }
                                });
                            }
                        } catch (err) {
                            console.warn(`Could not add index to ${name}:`, err);
                        }
                    }
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;

                // Verify all stores exist
                const storeNames = Array.from(this.db.objectStoreNames);
                const allExist = Object.keys(STORES).every(s => storeNames.includes(s));

                if (!allExist) {
                    // Close and delete the broken database, then retry
                    this.db.close();
                    const delReq = indexedDB.deleteDatabase(DB_NAME);
                    delReq.onsuccess = () => {
                        this.init().then(resolve).catch(reject);
                    };
                    delReq.onerror = () => reject(new Error('Could not delete broken database'));
                    return;
                }

                resolve(this.db);
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    // --- Finca helpers ---

    async initFincaDefault() {
        const fincas = await this.getAll('fincas');
        if (fincas.length === 0) {
            await this.add('fincas', {
                nombre: 'Finca Principal',
                ubicacion: '',
                areaTotal: '',
                fechaCreacion: new Date().toLocaleDateString('en-CA')
            });
        }

        // Get active finca ID from localStorage or default to first
        let fincaId = 1;
        try {
            fincaId = parseInt(localStorage.getItem('fincaActiva'));
        } catch (err) {
            console.warn("localStorage bloqueado. Usando finca default 1.");
        }

        if (!fincaId) {
            try {
                const all = await this.getAll('fincas');
                fincaId = all.length > 0 ? all[0].id : 1;
                localStorage.setItem('fincaActiva', fincaId);
            } catch (dbErr) {
                fincaId = 1;
            }
        }

        return fincaId;
    }

    getFincaActiva() {
        try {
            return parseInt(localStorage.getItem('fincaActiva')) || 1;
        } catch (err) {
            return 1;
        }
    }

    setFincaActiva(id) {
        try {
            localStorage.setItem('fincaActiva', id);
        } catch (err) {
            console.error("No se pudo guardar la finca activa", err);
        }
    }

    // --- Generic CRUD ---

    _tx(storeName, mode = 'readonly') {
        const tx = this.db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }

    add(storeName, data) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName, 'readwrite');

            // Inyectar forzosamente la Finca Activa a los registros si no la tiene (Excepto en Config y Fincas)
            if (storeName !== 'config' && storeName !== 'fincas' && typeof data === 'object' && !data.fincaId) {
                data.fincaId = this.getFincaActiva();
            }

            const req = store.add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    put(storeName, data) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName, 'readwrite');
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    get(storeName, id) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName);
            const req = store.getAll();
            req.onsuccess = () => {
                const result = req.result;
                resolve(Array.isArray(result) ? result : Array.from(result || []));
            };
            req.onerror = () => reject(req.error);
        });
    }

    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName, 'readwrite');
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    getAllByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName);
            const index = store.index(indexName);
            const req = index.getAll(value);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    }

    clear(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._tx(storeName, 'readwrite');
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    // --- Config helpers ---

    async getConfig(key, defaultValue = null) {
        const result = await this.get('config', key);
        return result ? result.value : defaultValue;
    }

    async setConfig(key, value) {
        return this.put('config', { key, value });
    }

    // --- Default configs ---

    async initDefaults() {
        const defaults = {
            tarifaKilo: 500,
            tarifaDia: 40000,
            tarifaDomingo: 60000,
            factorConversion: 0.5,
            precioDesayuno: 3000,
            precioAlmuerzo: 5000,
            precioCena: 3000,
            password: '1234',
            diaCorte: 1
        };

        for (const [key, value] of Object.entries(defaults)) {
            const existing = await this.get('config', key);
            if (!existing) {
                await this.setConfig(key, value);
            }
        }

        // Init default finca
        await this.initFincaDefault();

        // Migrate legacy data objects to current active finca
        await this.migrateLegacyData();

        // Init default ciclo
        await this.initCicloDefault();
    }

    // --- Ciclo helpers ---

    async migrateLegacyData() {
        const fincaId = this.getFincaActiva();
        const storesToMigrate = ['obreros', 'jornales', 'asistencia', 'comida', 'ventasCaja', 'pagos', 'transportes', 'conversion', 'cascota', 'lotes'];

        for (const store of storesToMigrate) {
            try {
                const records = await this.getAll(store);
                let migrated = 0;
                for (const record of records) {
                    let needsUpdate = false;
                    if (!record.fincaId) {
                        record.fincaId = fincaId;
                        needsUpdate = true;
                    }
                    // Parche crítico: Obrero Legacy sin estado rompía los `filter(estado === activo)`
                    if (store === 'obreros' && !record.estado) {
                        record.estado = 'activo';
                        needsUpdate = true;
                    }
                    if (needsUpdate) {
                        await this.put(store, record);
                        migrated++;
                    }
                }
                if (migrated > 0) {
                    console.log(`[Migración] ${migrated} registros de '${store}' parcheados a Finca ${fincaId} y estado seguro`);
                }
            } catch (err) {
                console.warn(`No se pudo migrar la tabla ${store}:`, err);
            }
        }
    }

    async initCicloDefault() {
        const fincaId = this.getFincaActiva();
        const ciclos = await this.getAll('ciclos');
        const ciclosFinca = ciclos.filter(c => c.fincaId === fincaId);

        if (ciclosFinca.length === 0) {
            const diaCorte = await this.getConfig('diaCorte', 1);
            const hoy = new Date();
            const inicio = Ciclos.calcularInicioSemana(hoy, diaCorte);
            const fin = new Date(inicio);
            fin.setDate(fin.getDate() + 6);

            const numSemana = Ciclos.getNumeroSemana(inicio);

            await this.add('ciclos', {
                fincaId,
                nombre: `Semana ${numSemana}`,
                fechaInicio: inicio.toLocaleDateString('en-CA'),
                fechaFin: fin.toLocaleDateString('en-CA'),
                activo: true,
                totalKilos: 0,
                totalPagado: 0
            });
        }
    }

    async getCicloActivo() {
        const ciclos = await this.getAll('ciclos');
        const fincaId = this.getFincaActiva();
        return ciclos.find(c => c.activo && c.fincaId === fincaId) || null;
    }

    // --- Aggregation helpers ---

    async getJornalesByObreroAndRange(obreroId, fechaInicio, fechaFin) {
        const all = await this.getAllByIndex('jornales', 'obreroId', obreroId);
        return all.filter(j => j.fecha >= fechaInicio && j.fecha <= fechaFin);
    }

    async getComidaByObreroAndRange(obreroId, fechaInicio, fechaFin) {
        const all = await this.getAllByIndex('comida', 'obreroId', obreroId);
        return all.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin);
    }

    async getVentasByObreroAndRange(obreroId, fechaInicio, fechaFin) {
        const all = await this.getAllByIndex('ventasCaja', 'obreroId', obreroId);
        return all.filter(v => v.fiado && v.fecha >= fechaInicio && v.fecha <= fechaFin);
    }

    async getTotalKilosByLote(loteId) {
        const jornales = await this.getAllByIndex('jornales', 'loteId', loteId);
        return jornales.reduce((sum, j) => sum + (j.kilosRecolectados || 0), 0);
    }

    async getTotalCascotaByLote(loteId) {
        const cascota = await this.getAllByIndex('cascota', 'loteId', loteId);
        return cascota.reduce((sum, c) => sum + (c.kilos || 0), 0);
    }

    // --- Finca-filtered getters ---

    async getByFinca(storeName) {
        let all = await this.getAll(storeName);
        if (!Array.isArray(all)) {
            all = Array.from(all || []);
        }

        const fincaId = this.getFincaActiva();

        // Retornar solo elementos que explícitamente pertenezcan a la Finca o que sean legacy (sin finca configurada) temporalmente
        return all.filter(item => item.fincaId === fincaId || !item.fincaId);
    }

    // --- Validation helpers ---

    /**
     * Verifica si ya existe un jornal con la misma combinación obrero+fecha+lote+finca
     * @returns {boolean} true si ya existe
     */
    async existeJornal(obreroId, fecha, loteId, fincaId) {
        const jornales = await this.getAllByIndex('jornales', 'obreroId', obreroId);
        return jornales.some(j =>
            j.fecha === fecha &&
            j.loteId === loteId &&
            j.fincaId === fincaId
        );
    }

    /**
     * Verifica si el obrero ya tiene registro de comida en esa fecha
     * @returns {boolean} true si ya existe
     */
    async existeComidaHoy(obreroId, fecha) {
        const comidas = await this.getAllByIndex('comida', 'obreroId', obreroId);
        return comidas.some(c => c.fecha === fecha);
    }

    /**
     * Busca pagos existentes cuyo rango de fechas se solape con el rango dado
     * Lógica: nuevo.inicio <= existente.fin AND nuevo.fin >= existente.inicio
     * @returns {Array} pagos solapados
     */
    async getPagosSolapados(obreroId, fechaInicio, fechaFin) {
        const pagos = await this.getAllByIndex('pagos', 'obreroId', obreroId);
        return pagos.filter(p =>
            fechaInicio <= p.fechaFin &&
            fechaFin >= p.fechaInicio
        );
    }

    // --- Backup / Restore ---

    async exportAll() {
        const data = {};
        for (const storeName of Object.keys(STORES)) {
            data[storeName] = await this.getAll(storeName);
        }
        return data;
    }

    async importAll(data) {
        for (const [storeName, records] of Object.entries(data)) {
            if (STORES[storeName]) {
                await this.clear(storeName);
                for (const record of records) {
                    await this.put(storeName, record);
                }
            }
        }
    }
}

// Global instance
const db = new CafeDB();
