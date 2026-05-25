/* ============================================
   db.js — Supabase Data Layer (Drop-in replacement)
   CaféControl
   ============================================ */

class CafeDB {
    constructor() {
        // window.supabaseClient is defined in js/supabase.js
        this.sb = window.supabaseClient;
    }

    async init() {
        // Just verify connection
        if (!this.sb) throw new Error("Supabase Client not initialized");
        return true;
    }

    // --- Key Mapping Helpers ---
    // Maps JS camelCase and legacy table names to Supabase lowercase and snake_case names
    _mapToDB(storeName, data) {
        if (!data) return data;
        const mapped = {};
        for (const [key, value] of Object.entries(data)) {
            let newKey = key.toLowerCase();
            // fix typo in SQL
            if (newKey === 'obreroid') newKey = 'obrereid';
            // map JS 'tipo' to DB 'estado' for attendance
            if (storeName === 'asistencia' && newKey === 'tipo') newKey = 'estado';
            mapped[newKey] = value;
        }
        return mapped;
    }

    _mapFromDB(storeName, data) {
        if (!data) return data;
        const mapped = { ...data };
        
        // Restore standard camelCase keys based on common patterns
        const camelCaseMap = {
            'fincaid': 'fincaId',
            'obrereid': 'obreroId',
            'obreroid': 'obreroId',
            'loteid': 'loteId',
            'cicloid': 'cicloId',
            'productoid': 'productoId',
            'areatotal': 'areaTotal',
            'fechacreacion': 'fechaCreacion',
            'fechaingreso': 'fechaIngreso',
            'fechainicio': 'fechaInicio',
            'fechafin': 'fechaFin',
            'totalkilos': 'totalKilos',
            'totalpagado': 'totalPagado',
            'kilosrecolectados': 'kilosRecolectados',
            'totalpago': 'totalPago',
            'fechapago': 'fechaPago',
            'montokilos': 'montoKilos',
            'diastrabajados': 'diasTrabajados',
            'montodias': 'montoDias',
            'totalbruto': 'totalBruto',
            'descuentocomida': 'descuentoComida',
            'descuentotienda': 'descuentoTienda',
            'totalneto': 'totalNeto',
            'metodopago': 'metodoPago',
            'kiloscereza': 'kilosCereza',
            'kilospergamino': 'kilosPergamino',
            'tipopago': 'tipoPago',
            'tarifadia': 'tarifaDia',
            'totaldia': 'totalDia',
            'kilosam': 'kilosAM',
            'kilospm': 'kilosPM',
            'desctransportevalor': 'descTransporteValor',
            'netoapagar': 'netoAPagar',
            'valortotal': 'valorTotal',
            'preciokilo': 'precioKilo',
            'valorjornal': 'valorJornal'
        };

        for (const [key, value] of Object.entries(data)) {
            if (camelCaseMap[key]) {
                mapped[camelCaseMap[key]] = value;
                delete mapped[key];
            }
        }

        // Map DB 'estado' to JS 'tipo' for attendance
        if (storeName === 'asistencia' && mapped.estado !== undefined) {
            mapped.tipo = mapped.estado;
            delete mapped.estado;
        }

        return mapped;
    }

    _getTableName(storeName) {
        return storeName === 'ventasCaja' ? 'ventas_caja' : storeName;
    }

    _getIndexName(indexName) {
        let name = indexName.toLowerCase();
        if (name === 'obreroid') return 'obrereid';
        return name;
    }

    // --- User Auth & Management helpers ---

    async sha256(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async getUsuarioByLogin(identifier) {
        const { data, error } = await this.sb
            .from('usuarios')
            .select('*')
            .or(`username.eq.${identifier},cedula.eq.${identifier},telefono.eq.${identifier}`)
            .eq('estado', 'activo')
            .maybeSingle();

        if (error) throw new Error(JSON.stringify(error));
        return data;
    }

    async getUsuarios() {
        const { data, error } = await this.sb
            .from('usuarios')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw new Error(JSON.stringify(error));
        return data || [];
    }

    async addUsuario(usuarioData) {
        const { data, error } = await this.sb
            .from('usuarios')
            .insert([usuarioData])
            .select()
            .single();

        if (error) throw new Error(JSON.stringify(error));
        return data;
    }

    async updateUsuario(id, fields) {
        const { data, error } = await this.sb
            .from('usuarios')
            .update(fields)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(JSON.stringify(error));
        return data;
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

        let fincaId;
        try {
            fincaId = parseInt(localStorage.getItem('fincaActiva'));
        } catch (err) {}

        if (!fincaId) {
            const allFincas = await this.getAll('fincas');
            fincaId = allFincas.length > 0 ? allFincas[0].id : 1;
            try {
                localStorage.setItem('fincaActiva', fincaId);
            } catch (err) {}
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

    async add(storeName, data) {
        if (storeName !== 'config' && storeName !== 'fincas' && typeof data === 'object' && !data.fincaId) {
            data.fincaId = this.getFincaActiva();
        }
        
        const table = this._getTableName(storeName);
        const mappedData = this._mapToDB(storeName, data);
        delete mappedData.id; // Let DB auto-increment

        const { data: result, error } = await this.sb
            .from(table)
            .insert([mappedData])
            .select()
            .single();

        if (error) throw new Error(JSON.stringify(error));
        // IndexedDB normally returns the inserted ID
        return result.id;
    }

    async put(storeName, data) {
        const table = this._getTableName(storeName);
        const mappedData = this._mapToDB(storeName, data);

        // Supabase upsert requires primary key. If no id, insert.
        if (!mappedData.id && storeName !== 'config') {
            return this.add(storeName, data);
        }

        const pk = storeName === 'config' ? 'key' : 'id';
        const { data: result, error } = await this.sb
            .from(table)
            .upsert([mappedData], { onConflict: pk })
            .select()
            .single();

        if (error) throw new Error(JSON.stringify(error));
        return result.id || result.key;
    }

    async get(storeName, id) {
        const table = this._getTableName(storeName);
        const pk = storeName === 'config' ? 'key' : 'id';
        
        const { data, error } = await this.sb
            .from(table)
            .select('*')
            .eq(pk, id)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(JSON.stringify(error)); // PGRST116 is not found
        return this._mapFromDB(storeName, data);
    }

    async getAll(storeName) {
        const table = this._getTableName(storeName);
        const { data, error } = await this.sb
            .from(table)
            .select('*');

        if (error) throw new Error(JSON.stringify(error));
        return (data || []).map(row => this._mapFromDB(storeName, row));
    }

    async delete(storeName, id) {
        const table = this._getTableName(storeName);
        const pk = storeName === 'config' ? 'key' : 'id';
        
        const { error } = await this.sb
            .from(table)
            .delete()
            .eq(pk, id);

        if (error) throw new Error(JSON.stringify(error));
    }

    async getAllByIndex(storeName, indexName, value) {
        const table = this._getTableName(storeName);
        const dbIndex = this._getIndexName(indexName);
        
        const { data, error } = await this.sb
            .from(table)
            .select('*')
            .eq(dbIndex, value);

        if (error) throw new Error(JSON.stringify(error));
        return (data || []).map(row => this._mapFromDB(storeName, row));
    }

    async clear(storeName) {
        const table = this._getTableName(storeName);
        const pk = storeName === 'config' ? 'key' : 'id';
        
        const { error } = await this.sb
            .from(table)
            .delete()
            .neq(pk, 0); // Delete all

        if (error) throw new Error(JSON.stringify(error));
    }

    // --- Config helpers ---

    async getConfig(key, defaultValue = null) {
        const result = await this.get('config', key);
        // IndexedDB format was { key, value }
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

        await this.initFincaDefault();
        await this.initCicloDefault();
    }

    // --- Ciclo helpers ---

    async initCicloDefault() {
        const fincaId = this.getFincaActiva();
        const ciclos = await this.getAll('ciclos');
        const ciclosFinca = ciclos.filter(c => c.fincaId === fincaId);

        if (ciclosFinca.length === 0) {
            const diaCorte = await this.getConfig('diaCorte', 1);
            const hoy = new Date();
            // Use local Date helper from window if exists, else approximate
            const inicio = window.Ciclos ? window.Ciclos.calcularInicioSemana(hoy, diaCorte) : hoy;
            const fin = new Date(inicio);
            fin.setDate(fin.getDate() + 6);

            const numSemana = window.Ciclos ? window.Ciclos.getNumeroSemana(inicio) : 1;

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

    // Returns the ciclo that covers a specific date range (active or not)
    async getCicloByDateRange(fechaInicio, fechaFin) {
        const ciclos = await this.getAll('ciclos');
        const fincaId = this.getFincaActiva();
        // Try exact match first
        const exact = ciclos.find(c => c.fincaId === fincaId && c.fechaInicio === fechaInicio && c.fechaFin === fechaFin);
        if (exact) return exact;
        // Try overlapping
        const overlapping = ciclos.filter(c => c.fincaId === fincaId && c.fechaInicio <= fechaFin && c.fechaFin >= fechaInicio);
        return overlapping.length > 0 ? overlapping[0] : null;
    }

    async getTotalKilosByLote(loteId) {
        const jornales = await this.getAllByIndex('jornales', 'loteId', loteId);
        return jornales.reduce((sum, j) => sum + (Number(j.kilosRecolectados) || 0), 0);
    }

    async getTotalCascotaByLote(loteId) {
        const cascota = await this.getAllByIndex('cascota', 'loteId', loteId);
        return cascota.reduce((sum, c) => sum + (Number(c.kilos) || 0), 0);
    }

    // --- Finca-filtered getters ---

    async getByFinca(storeName) {
        const all = await this.getAll(storeName);
        const fincaId = this.getFincaActiva();
        return all.filter(item => item.fincaId === fincaId || !item.fincaId);
    }

    // --- Validation helpers ---

    async existeJornal(obreroId, fecha, loteId, fincaId) {
        const jornales = await this.getAllByIndex('jornales', 'obreroId', obreroId);
        return jornales.some(j =>
            j.fecha === fecha &&
            j.loteId === loteId &&
            j.fincaId === fincaId
        );
    }

    async existeComidaHoy(obreroId, fecha) {
        const comidas = await this.getAllByIndex('comida', 'obreroId', obreroId);
        return comidas.some(c => c.fecha === fecha);
    }

    async getPagosSolapados(obreroId, fechaInicio, fechaFin) {
        const pagos = await this.getAllByIndex('pagos', 'obreroId', obreroId);
        return pagos.filter(p =>
            fechaInicio <= p.fechaFin &&
            fechaFin >= p.fechaInicio
        );
    }

    async exportAll() {
        return {}; // Not supported in cloud yet
    }

    async importAll(data) {
        // Not supported in cloud yet
    }
}

// Global instance
const db = new CafeDB();
