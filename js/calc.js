function calculate(name, input) {
    /*let result;
    if (tempResults[name] === undefined) {
        tempResults[name] = {};
    }
    if (tempResults[name][JSON.stringify(input)] !== undefined) {
        return tempResults[name][JSON.stringify(input)];
    }

    // noinspection FallThroughInSwitchStatementJS
    switch (funcJSON[name]["type"]) {
        case 0:
            if (input[funcJSON[name]["recDefIndex"]] > 0) {
                result = calculateAdv(funcJSON[name]["recDef"][0], input, name, funcJSON[name]["recDefIndex"]);
                break;
            }
        case 1:
            result = calculateAdv(funcJSON[name]["init"][0], input, name);
            break;
    }
    tempResults[name][JSON.stringify(input)] = result;
    return result;*/

    let result;
    if (tempResults[name] === undefined) {
        tempResults[name] = {};
    }
    if (tempResults[name][JSON.stringify(input)] !== undefined) {
        return tempResults[name][JSON.stringify(input)];
    }

    // noinspection FallThroughInSwitchStatementJS
    switch (funcJSON[name]["type"]) {
        case 0:
            result = calculateRec(name, input);
            break;
        case 1:
            result = calculateAdv(funcJSON[name]["init"][0], input, name);
            break;
    }
    tempResults[name][JSON.stringify(input)] = result;
    return result;
}

function calculateRec(name, input) {
    let currentRecMax = 0;
    if (recMaxTemp[name] === undefined) {
        recMaxTemp[name] = {};
    }
    let inputToChange = input.slice(0);
    let splicedInputString = JSON.stringify(inputToChange.splice(funcJSON[name]["recDefIndex"], 1));
    if (tempResults[name][splicedInputString] !== undefined) {
        currentRecMax = tempResults[name][splicedInputString];
    }

    let func = funcJSON[name];
    let recDefIndex = func["recDefIndex"];
    let lastResult = 0;

    if (currentRecMax === 0) {
        lastResult = calculateAdv(func["init"][0], input, name);
    } else {
        lastResult = tempResults[name][splicedInputString];
    }

    let tempInput = input.slice(0);
    for (let i = currentRecMax + 1; i < input[recDefIndex]; i++) {
        tempInput[recDefIndex] = i;
        let nextInput = doNextInputCalc(func["recDef"][0]["inner"], tempInput, name, recDefIndex, lastResult);
        calculateAdv(func["recDef"][0], nextInput, name, recDefIndex, lastResult);
    }

    tempResults[name][splicedInputString] = input[recDefIndex];
    return lastResult;
}

function calculateAdv(jsonFunc, input, origname, recDefIndex = -1, lastResult) {
    let name = jsonFunc["name"];
    let inner = jsonFunc["inner"];

    let result;

    if (name === "param") {
        result = input[inner];
        if (inner === recDefIndex)
            result--;
        return result;
    } else if (name === "const") {
        result = inner;
        return result;
    } else if (name === origname) {
        if (recDefIndex > -1) {
            return lastResult;
        } else {
            throw "Unerlaubte Rekursion";
        }
    }

    const nextInput = doNextInputCalc(inner, input, origname, recDefIndex, lastResult);

    if (name === "s") {
        result = nextInput[0] + 1;
    } else {
        result = calculate(name, nextInput);
    }
    return result;
}

function doNextInputCalc(inner, input, origname, recDefIndex, lastResult) {
    let nextInput = [];
    for (let i = 0; i < inner.length; i++) {
        if (inner[i]["name"] === origname) {
            if (recDefIndex > -1) {
                nextInput[i] = lastResult;
            } else {
                throw "Unerlaubte Rekursion";
            }
        } else {
            nextInput[i] = calculateAdv(inner[i], input, origname, recDefIndex, lastResult);
        }
    }

    return nextInput;
}