import LocalDbContext from './localDb.js'; // Import LocalDbContext
import SuperDbContext from './superBaseDb.js'; // Import LocalDbContext
import { ExpenseResult, Expense } from './models.js'; // Import ExpenseResult

//const _context = new LocalDbContext();
const _context = new SuperDbContext();
await _context.Category.loadData()

const categories = await _context.Category.where(x => x.active).toList();
//console.log(await _scontext.Category.getAll())

function loadCategories() {
    const select = $("#category").empty();

    select.append('<option value="" disabled selected>Select a Category</option>');

    categories.forEach(category => {
        let option = document.createElement("option");
        option.value = category.id; 
        option.textContent = category.name; 
        select.append(option);
    });
}
loadCategories() 

const form = $('#addExpenseForm').on('submit', function(e) {
    e.preventDefault();

    const data = form.serializeArray();
    const expense = new Expense();
    data.forEach(item => {
        expense[item.name] = item.value;
    });
    expense.date = new Date(expense.date).toLocaleDateString();
    expense.id = _context.Expense.count() + 1;
    
    _context.Expense.add(expense);

    form.trigger('reset');
    reloadTable();
})
$('#close-add').on('click',() => form.trigger('reset'));
$(document).on('click','.delExpense', function() {
    const id = $(this).data('id');
    const newExpenses = _context.Expense.firstOrDefault(e => e.id === id);
    if(newExpenses) {
        _context.Expense.remove(newExpenses);
        reloadTable();
    }
    else alert('Expense not found')
})

const table = $('#expenseTable').DataTable({
    responsive: true,
    dom: "<'row'<'col-md-6 text-start'B><'col-md-6 text-end'f>>" + // Moves search bar to right
         "rtip",
    data: loadExpenses(),
    "columns": [
        { "data": "id" },
        { "data": "expense" },
        { "data": "amount" },
        { "data": "date" },
        { 
            "data": "Action",
            "render": function(data, type, row, meta) {
                const editBtn = '<button class="" data-id="' + row.id + '"><i class="fa-solid fa-pen-to-square"></i></button>'
                const delBtn = '<button class="delExpense" data-id="' + row.id + '"><i class="fa-solid fa-trash"></i></button>'
                return `${editBtn} ${delBtn}`
            }
         }
    ],
    initComplete: function () {
        let searchInput = $('.dt-search input');
        searchInput.addClass('form-control form-control-sm w-50'); 
        searchInput.attr('placeholder', '🔍 Search...');
        $('.dt-search').addClass('d-flex justify-content-end align-items-center');
    }
});
function loadExpenses() {
    
    const result = _context.Expense.join(
        _context.Category, 
        e => e.categoryId, 
        c => c.id,
        (e, c) => Object.assign(
            new ExpenseResult(), 
            { 
                id: e.id, 
                expense: e.expense, 
                amount: e.amount, 
                date: e.date, 
                categoryName: c.name 
            }
        )
    )
    
    return result;
}
function reloadTable() {
    const newData = loadExpenses();
    table.clear();        
    table.rows.add(newData); 
    table.draw(false);   
}
let chartDom = $('#chart');
let myChart = echarts.init(chartDom[0]);

let option = {
    title: {
        text: 'Your Expenses'
    },
    tooltip: {},
    xAxis: {
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    yAxis: {},
    series: [
        {
            name: 'Sales',
            type: 'bar',
            data: [500, 600, 800, 1000, 750, 900]
        }
    ]
};

myChart.setOption(option)

window.addEventListener('resize', function() {
    myChart.resize();
});

$('#showExpenseGraph').on('click', function() {
    setTimeout(() => {
        myChart.resize();
    }, 200);

    const currentWeek = getCurrentWeek()
    loadRangeDates(currentWeek[0],currentWeek[1])
    rePlotChart(currentWeek[0],currentWeek[1])
});
function rePlotChart(start,end) {
    const total = getWeeklyExpensesTotal(start,end)
    const dayNames = getDayNamesInRange(start,end)
    const amount = []
    const options = { weekday: 'long' }; 
    for(let i = 0; i < dayNames.length; i++) {
        let found = total.find(t => new Date(t.date).toLocaleDateString('en-US', options) === dayNames[i])
        amount.push(found ? found.totalAmount : 0)
    }

    myChart.setOption({
        xAxis: {
            data: dayNames
        },
        series: [
            {
                name: 'Sales',
                type: 'bar',
                data: amount
            }
        ]
    })
    $('.message').text(`Your total expenses for this week amount to ₹${amount.reduce((a, b) => a + b, 0)}/-. Stay on track with your budget!`)
}
function getWeeklyExpensesTotal(start,end) {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0); 
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0); 

    return _context.Expense
        .where(expense => {
            const expenseDate = new Date(expense.date);
            expenseDate.setHours(0, 0, 0, 0);
            return expenseDate >= startDate && expenseDate <= endDate;
        })
        .groupBy(
            expense => new Date(expense.date).toDateString(),
            (date, expenses) => ({
                date: date,
                totalAmount: expenses.reduce((sum, expense) => sum + new Number(expense.amount), 0)
            })
        );
}
function getCurrentWeek() {
    let today = moment();
    let startOfWeek = today.clone().startOf('isoWeek'); 
    let endOfWeek = today.clone().endOf('isoWeek'); 
    return [startOfWeek, endOfWeek];
}
function getDayNamesInRange(start, end) {
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0); 
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    const dayNames = [];
    const options = { weekday: 'long' }; 

    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
        dayNames.push(currentDate.toLocaleDateString('en-US', options)); // Get weekday name
        currentDate.setDate(currentDate.getDate() + 1); // Move to next day
    }

    return dayNames;
}
function getCurrentWeekRange() {
    let today = moment();
    let startOfWeek = today.clone().startOf('isoWeek'); // Monday start
    let endOfWeek = startOfWeek.clone().add(6, 'days'); // Sunday end
    return [startOfWeek, endOfWeek];
}

const range = getCurrentWeekRange();

loadRangeDates(range[0], range[1])

function loadRangeDates(start, end){
    $('#startDate')
    .val(start.format('YYYY-MM-DD')).attr('max', start.format('YYYY-MM-DD'))
    .on('change', function() {
        let startOfWeek = moment($('#startDate').val());
        let endOfWeek = startOfWeek.clone().add(6, 'days').format('YYYY-MM-DD');
        $('#endDate').val(endOfWeek).attr({'max': endOfWeek, 'min': startOfWeek.format('YYYY-MM-DD')});
    })

    $('#endDate')
    .val(end.format('YYYY-MM-DD'))
    .attr({'max': end.format('YYYY-MM-DD'), 'min': start.format('YYYY-MM-DD')})
}
$('#showGraph').on('click', function() {
    const start = $('#startDate').val()
    const end = $('#endDate').val()
    rePlotChart(start,end)
})