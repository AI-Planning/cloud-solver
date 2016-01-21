

function run_tests() {

    $('#go-button').prop('disabled', true);

    var PIDs = {1:8, 2:8, 3:8, 4:8, 5:8, 6:8, 7:8, 8:8, 9:8, 10:8};

    //solve(PIDs[1], function(resp1) {show_result('test1', resp1)})

    var cb = function(resp) {show_result('test10', resp)};
    for (var i=9; i>=1; --i) {
        cb = function(resp) {show_result('test'+i, resp); solve(PIDs[i+1], cb)};
    }
    solve(PIDs[1], cb);
}

function show_result(lid, resp) {
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

