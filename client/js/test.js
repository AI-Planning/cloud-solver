
function test1() {
    solve(8, function(resp) {show_result('test1', resp);});
}

function run_tests() {

    $('#go-button').prop('disabled', true);
    
    test1();
    /*test2();
    test3();
    test4();
    test5();
    test6();
    test7();
    test8();
    test9();
    test10();*/
}

function show_results(lid, resp) {
    console.log(resp);
}

function solve_and_validate(pid, cb) {

}

function solve(pid, cb) {
    query('solve', {probID:pid}, cb);
}

function validate(pid, cb) {

}

function query(qs, params, cb) {
    var SOLVER_URL = '/';
    
    $.ajax({
        url         : SOLVER_URL + qs,
        type        : 'POST',
        contentType : 'application/json',
        data        : JSON.stringify(params)
    }).done(cb);
    
}

