//import { createClient } from '@supabase/supabase-js';
import { Expense, Category } from './models.js';

// Initialize Supabase client
const supabase = window.supabase.createClient('https://bghpbovoirwybzxxxafr.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnaHBib3ZvaXJ3eWJ6eHh4YWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1Nzc5NzUsImV4cCI6MjA1NjE1Mzk3NX0.DQQfum6WnxtrmJBL-1_4EXG6miXmrYz7vbQfbVh7CD8') //'#$m3Q5gm!St.bDV');

class DbSet {
    constructor(tableName, modelType, data, options) {
        this.tableName = tableName; // Supabase table name
        this.modelType = modelType; // Model class
        this.data = data
        this.options = options || {}
        this.transactions = []
    }

    async loadData() {
        if(this.data) return this.data;

        const { data, error } = await supabase.from(this.tableName).select('*');
        if (error) throw error;
        return data.map(item => Object.assign(new this.modelType(), item));
    }
    async toList(){
        return await this.loadData();
    }
    async save(){
        if(this.transactions.length === 0) return null;
        const { data, error } = await supabase.from(this.tableName).upsert(this.transactions);
        if (error) throw error;
        this.transactions = []
    }

    async add(item) {
        this.transactions.push({
            item,
            type: 'insert'
        });
    }
    async addToDatabase(item) {
        const { data, error } = await supabase.from(this.tableName).insert([item]).select();
        if (error) throw error;
        return data;
    }

    async addRange(items) {
        const { data, error } = await supabase.from(this.tableName).insert(items).select();
        if (error) throw error;
        return data;
    }

    async firstOrDefault(predicate) {
        const { column, value } = predicate;
        const { data, error } = await supabase.from(this.tableName).select('*').eq(column, value).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? Object.assign(new this.modelType(), data) : null;
    }

    async where(column, value) {
        const { data, error } = await supabase.from(this.tableName).select('*').eq(column, value);
        if (error) throw error;
        return new DbSet(this.tableName, this.modelType, data);
    }

    async orderBy(selector) {
        if(options['orderBy'] || options['orderByDescending']) throw new Error("orderBy or orderByDescending is already called");

        const data = await this.loadData();
        const sortedData = [...data].sort((a, b) => {
            const valA = selector(a);
            const valB = selector(b);
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        });
        return new DbSet(this.tableName, this.modelType, sortedData,{...options, orderBy: true });
    }

    async thenBy(selector) {
        if (!options['orderBy'] && !options['orderByDescending']) throw new Error("thenBy must be called after orderBy or orderByDescending");

        const sortedData = [...this.data].sort((a, b) => {
            const valA = selector(a);
            const valB = selector(b);
            return valA > valB ? 1 : valA < valB ? -1 : 0;
        });
        return new DbSet(this.tableName, this.modelType, sortedData, {...options, thenBy: true });
    }

    async orderByDescending(selector) {
        if(options['orderBy'] || options['orderByDescending']) throw new Error("orderBy or orderByDescending is already called");

        const data = await this.loadData();
        const sortedData = [...data].sort((a, b) => {
            const valA = selector(a);
            const valB = selector(b);
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        });
        return new DbSet(this.tableName, this.modelType, sortedData,{...options, orderByDescending: true });
    }

    async thenByDescending(selector) {
        if (!options['orderBy'] && !options['orderByDescending']) throw new Error("thenByDescending must be called after orderByDescending");
        const sortedData = [...this.data].sort((a, b) => {
            const valA = selector(a);
            const valB = selector(b);
            return valA < valB ? 1 : valA > valB ? -1 : 0;
        });
        return new DbSet(this.tableName, this.modelType, sortedData,{...options, thenByDescending: true });
    }

    async find(column, value) {
        const { data, error } = await supabase.from(this.tableName).select('*').eq(column, value).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        return data ? Object.assign(new this.modelType(), data) : null;
    }

    async remove(id) {
        const { error } = await supabase.from(this.tableName).delete().match({ id });
        if (error) throw error;
    }

    async update(updatedItem) {
        const { error } = await supabase.from(this.tableName).update(updatedItem).match({ id: updatedItem.id });
        if (error) throw error;
    }

    async any(column, value) {
        const { data, error } = await supabase.from(this.tableName).select('id').eq(column, value).limit(1);
        if (error) throw error;
        return data.length > 0;
    }

    async count(column, value) {
        const { count, error } = await supabase.from(this.tableName).select('*', { count: 'exact', head: true }).eq(column, value);
        if (error) throw error;
        return count;
    }

    async clear() {
        const { error } = await supabase.from(this.tableName).delete().neq('id', 0);
        if (error) throw error;
    }

    async join(otherDbSet, keySelector, otherKeySelector, resultSelector) {
        const table1 = await this.toList();
        const table2 = await otherDbSet.toList();

        return table1.flatMap(item1 =>
            table2
                .filter(item2 => keySelector(item1) === otherKeySelector(item2))
                .map(item2 => resultSelector(item1, item2))
        );
    }
    async leftJoin(otherDbSet, keySelector, otherKeySelector, resultSelector) {
        const table1 = await this.toList();
        const table2 = await otherDbSet.toList();
    
        return table1.map(item1 => {
            const matches = table2.filter(item2 => keySelector(item1) === otherKeySelector(item2));
            return matches.length > 0
                ? matches.map(item2 => resultSelector(item1, item2))
                : [resultSelector(item1, null)];
        }).flat();
    }

    async groupBy(keySelector, resultSelector) {
        const { data, error } = await supabase.from(this.tableName).select('*');
        if (error) throw error;

        const groups = new Map();
        data.forEach(item => {
            const key = keySelector(item);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        });

        return Array.from(groups, ([key, items]) => resultSelector(key, items));
    }
}

class SuperDbContext {
    constructor() {
        this.Expense = new DbSet('Expense', Expense);
        this.Category = new DbSet('Category', Category);
    }
}

export default SuperDbContext;
