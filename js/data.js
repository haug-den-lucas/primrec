let funcJSON = {};
let validatedFunctions = {};

let fm = new FunctionManager();
fm.load(predefined, function(){
    getDataFromLocalStorage();
});
let funcPreDefinedDef = fm.predefined;

let funcPreDefined = ["s", "param", "const", "placeholder", "add", "mult"];

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

    if (json === undefined || json === null) {
        json = {};
    }

    let innerFunctionGroup = $('#innerFunctionGroup');
    innerFunctionGroup.html("");

    funcPreDefined.forEach(function (key) {
        delete json[key];
    });

    let toAppend = "";
    let toAppendInnerFunctionGroup = "";
    Object.keys(funcPreDefinedDef).forEach(function (key) {
        toAppend += '<label id="' + key + '" class="btn btn-block btn-outline-info"><input type="radio" name="options" id="radio' + key + '" autocomplete="off">' + key + '</label>';
        toAppendInnerFunctionGroup += '<label id="labelFunSel' + key + '" class="btn btn-block btn-outline-secondary"><input type="radio" name="options" id="funSel' + key + '" autocomplete="off">' + key + '</label>';
    });
    Object.keys(json).forEach(function (key) {
        toAppend += '<label id="' + key + '" class="btn btn-block btn-outline-success"><input type="radio" name="options" id="radio' + key + '" autocomplete="off">' + key + '</label>';
        toAppendInnerFunctionGroup += '<label id="labelFunSel' + key + '" class="btn btn-block btn-outline-secondary"><input type="radio" name="options" id="funSel' + key + '" autocomplete="off">' + key + '</label>';
    });

    list.append(toAppend);
    innerFunctionGroup.append(toAppendInnerFunctionGroup);

    funcJSON = json;
    setJSON();
    tempResults = {};
    //validateFunctions();
}

function getJson(key) {
    if (key in funcPreDefinedDef) {
        return funcPreDefinedDef[key];
    } else {
        return funcJSON[key];
    }
}