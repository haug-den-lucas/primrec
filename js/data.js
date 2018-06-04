let funcJSON = {};
let validatedFunctions = {};
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
    validateFunctions();
}

function validateFunctions() {
    validatedFunctions = {};
    let funcNow;

    //Check for addition
    Object.keys(funcJSON).forEach(function (key) {
        funcNow = funcJSON[key];
        if (funcNow["params"] === 2 && funcNow["type"] === 0) {
            let init = funcNow["init"][0];
            let recDef = funcNow["recDef"][0];
            if (init["name"] === "param" && (init["inner"] === 0 || init["inner"] === 1) &&
                recDef["name"] === "s" && recDef["inner"][0]["name"] === key) {

                validatedFunctions["add"] = key;
            }
        }
    });

    //Check for multiplication
    Object.keys(funcJSON).forEach(function (key) {
        funcNow = funcJSON[key];
        if (funcNow["params"] === 2 && funcNow["type"] === 0) {
            let init = funcNow["init"][0];
            let recDef = funcNow["recDef"][0];

            let recDefIndex = funcNow["recDefIndex"];
            let notRecDefIndex;
            if (recDefIndex === 0) {
                notRecDefIndex = 1;
            } else {
                notRecDefIndex = 0;
            }

            if ((init["name"] === "param" && init["inner"] === recDefIndex || init["name"] === "const" && init["inner"] === "0") &&
                recDef["name"] === validatedFunctions["add"]) {

                if ((recDef["inner"][0]["name"] === key && recDef["inner"][1]["name"] === "param" && recDef["inner"][1]["inner"] === notRecDefIndex) ||
                    (recDef["inner"][1]["name"] === key && recDef["inner"][0]["name"] === "param" && recDef["inner"][0]["inner"] === notRecDefIndex)) {


                    validatedFunctions["mult"] = key;
                }
            }
        }
    });
}