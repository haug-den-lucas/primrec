let funcJSON = {};
let funcPreDefined = ["s", "param", "const", "placeholder"];

let currentSelect;
let currentInput = [];
let expectedSize;

let tempResults = {};
let recMaxTemp = {};

function getDataFromLocalStorage() {
    if (typeof(Storage) !== "undefined") {
        parseJSON(JSON.parse(localStorage.getItem("json")));
    }
}

function parseJSON(json = funcJSON) {
    let list = $("#functionList");
    list.html("");
    Object.keys(json).forEach(function (key) {
        let toAppend = '<label id="' + key + '" class="btn btn-block btn-outline-success"><input type="radio" name="options" id="radio' + key + '" autocomplete="off">' + key + '</label>';
        list.append(toAppend);
    });
    funcJSON = json;
    setJSON();
    tempResults = {};
}