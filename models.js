export class Category{
    constructor(id, name){
        this.id = id;
        this.name = name;
    }
}

export class Expense{
    id;
    expense;
    amount;
    date;
    categoryId;
}

export class ExpenseResult{
    id;
    expense;
    amount;
    date;
    categoryName;
}