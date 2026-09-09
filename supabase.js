// Configuration Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // À remplacer par votre URL
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY'; // À remplacer par votre clé publique

// Client Supabase simple
class SupabaseClient {
    constructor(url, key) {
        this.url = url;
        this.key = key;
    }

    async from(table) {
        return new TableReference(this.url, this.key, table);
    }
}

class TableReference {
    constructor(url, key, table) {
        this.url = url;
        this.key = key;
        this.table = table;
        this.filters = [];
    }

    select(columns = '*') {
        this.columns = columns;
        return this;
    }

    eq(column, value) {
        this.filters.push({ type: 'eq', column, value });
        return this;
    }

    ilike(column, value) {
        this.filters.push({ type: 'ilike', column, value });
        return this;
    }

    async then(onFulfilled, onRejected) {
        try {
            const result = await this.execute();
            return onFulfilled(result);
        } catch (error) {
            if (onRejected) return onRejected(error);
            throw error;
        }
    }

    async execute() {
        let url = `${this.url}/rest/v1/${this.table}?select=${this.columns || '*'}`;

        // Ajouter les filtres
        for (const filter of this.filters) {
            if (filter.type === 'eq') {
                url += `&${filter.column}=eq.${encodeURIComponent(filter.value)}`;
            } else if (filter.type === 'ilike') {
                url += `&${filter.column}=ilike.%${encodeURIComponent(filter.value)}%`;
            }
        }

        const response = await fetch(url, {
            headers: {
                'apikey': this.key,
                'Authorization': `Bearer ${this.key}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erreur Supabase: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, error: null };
    }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
