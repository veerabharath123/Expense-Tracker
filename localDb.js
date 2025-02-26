import {Expense,Category} from './models.js';

class DbSet {
    constructor(key, modelType, initialData = null) {
        this.key = key;
        this.modelType = modelType;
        this.data = initialData !== null ? initialData : this._loadData();
    }

    _loadData() {
        const rawData = localStorage.getItem(this.key);
        return rawData ? JSON.parse(rawData).map(item => Object.assign(new this.modelType(), item)) : [];
    }

    _saveData() {
        localStorage.setItem(this.key, JSON.stringify(this.data));
    }

    add(item) {
        this.data.push(Object.assign(new this.modelType(), item));
        this._saveData();
    }
    addRange(items) {
        const v = items.map(item => Object.assign(new this.modelType(), item));
        this.data.push(...v);
        this._saveData();
    }
    firstOrDefault(predicate) {
        return this.data.find(predicate);
    }
    where(predicate) {
        return new DbSet(this.key, this.modelType, this.data.filter(predicate)); 
    }

    toList() {
        return this.data;
    }

    find(predicate) {
        return this.data.find(predicate);
    }

    remove(item) {
        const removeIndex = this.data.findIndex(i => i === item);
        this.data.splice(removeIndex, 1);
        this._saveData();
    }

    update(newData) {
        const index = this.data.findIndex(item => item.id === newData.id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...newData };
            this._saveData();
        }
    }
    any(predicate) {
        return predicate ? this.data.any(predicate) : this.data.length > 0;
    }
    count(predicate) {
        return predicate ? this.data.filter(predicate).length : this.data.length;
    }
    clear(){
        localStorage.removeItem(this.key);
        this.data = [];
    }

    join(otherDbSet, keySelector, otherKeySelector, resultSelector) {
        const result = [];
        this.data.forEach(item => {
            const key = keySelector(item); 
            const matches = otherDbSet.data.filter(otherItem => otherKeySelector(otherItem) == key); 
            matches.forEach(match => {
                result.push(resultSelector(item, match)); 
            });
        });
        return result;
    }
    groupBy(keySelector, resultSelector) {
        const groups = new Map();
        
        this.data.forEach(item => {
            const key = keySelector(item);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        });
    
        return Array.from(groups, ([key, items]) => resultSelector(key, items));
    }
    
}

class LocalDbContext {
    constructor() {
        this.Expense = new DbSet("expenses", Expense);
        this.Category = new DbSet("users", Category);
    }
}

export default LocalDbContext;
