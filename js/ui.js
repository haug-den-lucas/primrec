/*function getStringByInner(inner, initialAmount, initIndex = -1) {
    let toReturn = "";
    if (inner === undefined) {
        for (let i = 0; i < initialAmount; i++) {
            toReturn += String.fromCharCode(97 + i) + ", ";
        }
        return toReturn.slice(0, -2);
    }
    inner.forEach(function (element) {
        if (element["name"] === "param") {
            if (element["inner"] === initIndex) toReturn += "0";
            else toReturn += String.fromCharCode(97 + element["inner"]);
        } else if (element["name"] === "const") {
            toReturn += element["inner"];
        } else {
            toReturn += element["name"] + "(" + getStringByInner(element["inner"], initialAmount, initIndex) + ")";
        }
        toReturn += ", ";
    });
    return toReturn.slice(0, -2);
}*/

function getFunctionDefString(name, params, recDefIndex = -1, isInit = false) {
    let toReturn = "";

    toReturn += name + "(";
    for (let i = 0; i < params; i++) {
        if (i === recDefIndex) {
            if (isInit) {
                toReturn += 0;
            } else {
                toReturn += String.fromCharCode(97 + i) + "+1";
            }
        } else {
            toReturn += String.fromCharCode(97 + i);
        }


        if (i < params - 1)
            toReturn += ", "
    }
    return toReturn + ")";
}


$("#functionList").click(function (event) {
    $("#delete").show();
    $("#doCalc").show();
    let idNow = event.target.id;
    let objNow = funcJSON[idNow];
    currentSelect = idNow;
    currentInput = [];
    expectedSize = objNow["params"];

    $("#funName").html(idNow);

    let def = "";

    let typeNow = "init";
    let recDefIndex = -1;

    if (objNow["type"] === 0) {
        typeNow = "recDef";
        recDefIndex = objNow["recDefIndex"];
        def = getFunctionDefString(idNow, objNow["params"], recDefIndex, true) + " = " + createFunctionString(idNow, objNow["params"], objNow["init"][0], recDefIndex) + "<br>";
    }

    let buttonCreate = idNow + "(";
    def += getFunctionDefString(idNow, objNow["params"], recDefIndex) + " = " + createFunctionString(idNow, objNow["params"], objNow[typeNow][0]);
    for (let i = 0; i < objNow["params"]; i++) {
        buttonCreate += '<button type="button" id="param' + i + '" class="btn btn-secondary btn-sm">' + String.fromCharCode(97 + i) + '</button>';
        if (i < objNow["params"] - 1) {
            buttonCreate += ", ";
        }
    }

    $("#funDef").html(def);
    $("#funInsert").html(buttonCreate + ") = <span id='solution'></span>");

    for (let i = 0; i < objNow["params"]; i++) {
        $("#param" + i).click(paramButtonClicked);
    }
});

function paramButtonClicked(event) {
    let input = prompt("Wert eingeben:");
    let parsed = parseInt(input);
    let index = parseInt($(event.target).attr("id").replace("param", ""));
    if (!isNaN(parsed)) {
        if (parsed < 0) parsed = 0;
        currentInput[index] = parsed;
        $(event.target).html(parsed);
        $(event.target).addClass("btn-success");
        $(event.target).removeClass("btn-secondary");
    } else {
        currentInput[index] = -1;
        $(event.target).html(String.fromCharCode(97 + index));
        $(event.target).removeClass("btn-success");
        $(event.target).addClass("btn-secondary");
    }
}

$("#doCalc").click(function () {
    if (currentInput.length < expectedSize || currentInput.includes(-1)) {
        alert("Bitte erst Parameter eingeben");
        return;
    }
    try {
        $("#solution").html(calculate(currentSelect, currentInput));
    } catch (err) {
        $("#solution").html(err);
    }

});

$("#loadCode").click(function () {
    parseJSON(JSON.parse($("#jsonArea").val()));
});

function setJSON() {
    let string = JSON.stringify(funcJSON);
    $("#jsonArea").val(string);
    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("json", string);
    }
}

$("#delete").click(function () {
    if (
        confirm("Wenn du diese Funktion löschst, funktionieren alle Funktionen, welche auf diese zugreifen nicht mehr.\nBist du sicher?")
    ) {
        delete funcJSON[currentSelect];
        $("#delete").hide();
        $("#doCalc").hide();
        $("#funName").html("Bitte Funktion auswählen");
        $("#funDef").html("");
        $("#funInsert").html("");
        parseJSON();
        setJSON();
    }

});

let newName, newParamAmount, newType, newRecIndex, newInit, newRecDef, currentStep, placeholders = {},
    currentlyChoosing;
$('#nextStep1').click(function () {
    newName = $("#newName").val();
    newParamAmount = $("#newParams").val();
    newType = -1;
    if ($("#labelNewType0").hasClass("active")) {
        newType = 1;
    } else if ($("#labelNewType1").hasClass("active")) {
        newType = 0;
    }

    if (newName === "") {
        alert("Bitte gib einen Namen ein");
        return;
    }
    if ((newName in funcJSON) || funcPreDefined.includes(newName)) {
        alert("Eine Funktion mit diesem Namen existiert schon");
        return;
    }
    if (isNaN(newParamAmount) || newParamAmount <= 0) {
        alert("Bitte gebe eine gültige Zahl ein >0");
        return;
    }
    if (newType === -1) {
        alert("Bitte wähle die Art deiner Funktion aus");
        return;
    }

    newRecIndex = -1;

    let recParam = $("#recParam");
    recParam.html(newName);
    let toAppend = "(";
    for (let i = 0; i < newParamAmount; i++) {
        toAppend += ('<label id="labelRec' + i + '" class="btn btn-sm btn-outline-primary"><input type="radio" name="options" id="rec' + i + '" autocomplete="off">' + String.fromCharCode(97 + i) + '</label>');
        if (i < newParamAmount - 1) {
            toAppend += (", ");
        }
    }
    recParam.append(toAppend + ")");
    $("#addFunctionModal").modal('hide');
    if (newType === 0) {
        $("#recursiveFunctionModal").modal('show');
        currentStep = 1;
    } else {
        currentStep = 2;
        $('#finalFunctionModal').modal("show");
        showInitFunctionCreate();
    }
    $("#createFunInit").hide();
});

$("#nextStep2").click(function () {
    if ((currentMaxPlaceholder > 0 || newRecIndex === -1) && newType === 0) {
        alert("Bitte erst den Rekursionsanfang fertig definieren");
        return;
    }
    currentStep = 2;
    showInitFunctionCreate();
    $("#recursiveFunctionModal").modal("hide");
    $("#finalFunctionModal").modal("show");
});

$("#recParam").click(function (event) {
    newRecIndex = parseInt(event.target.id.replace("labelRec", ""));
    newInit = [{name: "placeholder", inner: 0}];
    showInitFunctionCreate();
});

let currentMaxPlaceholder;

$('#innerFunctionGroup').click(function (event) {
    let name = event.target.id.replace("labelFunSel", "");
    let newInner = [];
    for (let i = 0; i < funcJSON[name]["params"]; i++) {
        newInner.push({name: "placeholder", init: 0});
    }

    currentlyChoosing["name"] = name;
    currentlyChoosing["inner"] = newInner;
    $("#chooseFunctionModal").modal('hide');
    $("#chooseTypeModal").modal('hide');
    showInitFunctionCreate();
});

function innerTypeGroupChosen(event) {
    let name;
    let newInner = [];
    switch (event.target.id) {
        case "labelRecDef":
            name = newName;
            break;
        case "labelConstant":
            name = "const";
            newInner = parseInt(prompt("Bitte gebe den Wert der Konstanten ein"));
            if (isNaN(newInner) || newInner < 0) {
                alert("Ungültige Eingabe");
                return;
            }
            break;
        case "labelParam":
            name = "param";
            newInner = parseInt(prompt("Bitte gebe den Index des Parameters ein (Startet bei 1)")) - 1;
            if (isNaN(newInner) || newInner < 0 || newInner >= newParamAmount) {
                alert("Ungültige Eingabe");
                return;
            }
            break;
        case "labelSucc":
            name = "s";
            newInner = [{name: "placeholder", init: 0}];
            break;
        case "labelInnerFunction":
            let list = $('#innerFunctionGroup');
            list.html("");
            if (Object.keys(funcJSON).length > 0) {
                Object.keys(funcJSON).forEach(function (key) {
                    let toAppend = '<label id="labelFunSel' + key + '" class="btn btn-block btn-outline-secondary"><input type="radio" name="options" id="funSel' + key + '" autocomplete="off">' + key + '</label>';
                    list.append(toAppend);
                });
                $('#chooseFunctionModal').modal('show');
            } else {
                alert("Du hast bisher keine Funktionen.")
            }
            return;
    }
    currentlyChoosing["name"] = name;
    currentlyChoosing["inner"] = newInner;
    if (event.target.id === "labelRecDef") delete currentlyChoosing["inner"];
    $("#chooseTypeModal").modal('hide');
    showInitFunctionCreate();

}

function createFunInitClicked(event) {
    if (event.target.id === "createFunRec" || event.target.id === "createFunInit") {
        return;
    }
    $("#chooseTypeModal").modal('show');
    let labelRecDef = $("#labelRecDef");
    if (newType === 0 && currentStep === 2) {
        labelRecDef.show();
    } else {
        labelRecDef.hide();
    }
    $("#innerTypeGroup").children().removeClass("active");
    currentlyChoosing = placeholders[parseInt(event.target.id.replace("placeholderInitLabel", ""))];
}

$('#innerTypeGroup').click(innerTypeGroupChosen);

$("#createFunction").click(function () {
    $("#newName").val("");
    $("#newParams").val("");
    $("#typeGroup").children().removeClass("active");
    newInit = [{name: "placeholder", inner: 0}];
    newRecDef = [{name: "placeholder", inner: 0}];
});

function showInitFunctionCreate() {
    let createFun;
    if (currentStep === 1) {
        createFun = $("#createFunInit");
        if (isNaN(newRecIndex) || newRecIndex === -1) {
            createFun.hide();
            return;
        }
    } else {
        createFun = $("#createFunRec");
    }

    let def = getFunctionDefString(newName, newParamAmount, newRecIndex, true);

    placeholders = [];
    currentMaxPlaceholder = 0;
    let functionCreateString;
    if (newType === 0 && currentStep === 2) {
        functionCreateString = createFunctionString(newName, newParamAmount, newRecDef[0]);
    } else if (currentStep === 1) {
        functionCreateString = createFunctionString(newName, newParamAmount, newInit[0], newRecIndex);
    } else {
        functionCreateString = createFunctionString(newName, newParamAmount, newInit[0]);
    }

    createFun.html(def + " = " + functionCreateString);

    if (currentStep === 1) createFun.show();
}

$("#createFunInit").click(createFunInitClicked);
$("#createFunRec").click(createFunInitClicked);
$("#finishCreate").click(function () {
    let toAdd = {};
    toAdd["params"] = newParamAmount;
    toAdd["type"] = newType;
    toAdd["init"] = newInit;

    if (newType === 0) {
        toAdd["recDefIndex"] = newRecIndex;
        toAdd["recDef"] = newRecDef;
    }
    funcJSON[newName] = toAdd;
    parseJSON(funcJSON);
    $("#finalFunctionModal").modal("hide");
});


function createFunctionString(name, params, inner, recDefIndex = -1) {
    if (inner["name"] === "placeholder") {
        placeholders[currentMaxPlaceholder] = inner;
        let toReturn = '<label id="placeholderInitLabel' + currentMaxPlaceholder + '" class="btn btn-sm btn-outline-secondary"><input type="radio" name="options" id="placeholderInit' + currentMaxPlaceholder + '" autocomplete="off">+</label>';
        currentMaxPlaceholder++;
        return toReturn;
    } else if (inner["name"] === "const") {
        return inner["inner"];
    } else if (inner["name"] === "param") {
        let val = inner["inner"];
        if (val === recDefIndex) {
            return "0";
        } else {
            return String.fromCharCode(97 + val);
        }
    } else if (inner["name"] === name) {
        let def = name + "(";
        for (let i = 0; i < params; i++) {
            def += String.fromCharCode(97 + i);
            if (i < params - 1)
                def += ", "
        }
        return def + ")";
    } else {
        let toReturn = inner["name"] + "(";
        for (let i = 0; i < inner["inner"].length; i++) {
            toReturn += createFunctionString(name, params, inner["inner"][i], recDefIndex);
            if (i < inner["inner"].length - 1) {
                toReturn += ", ";
            }
        }
        return toReturn + ")";
    }
}