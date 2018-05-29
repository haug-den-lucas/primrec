function calculate(name, input) {
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
            if (input[funcJSON[name]["recDefIndex"]] > 0) {
                result = calculateAdv(funcJSON[name]["recDef"][0], input, name, funcJSON[name]["recDefIndex"]);
                break;
            }
        case 1:
            result = calculateAdv(funcJSON[name]["init"][0], input, name);
            break;
    }
    tempResults[name][JSON.stringify(input)] = result;
    return result;
}

function calculateAdv(jsonFunc, input, origname, recDefIndex = -1) {
    let name = jsonFunc["name"];
    let inner = jsonFunc["inner"];

    let result;
    const nextInput = [];

    if (name === "param") {
        result = input[inner];
        if (inner === recDefIndex)
            result--;
        return result;
    } else if (name === "const") {
        result = inner;
        return result;
    }

    for (let i = 0; i < inner.length; i++) {
        if (inner[i]["name"] === origname) {
            if (recDefIndex > -1) {
                let newInput = input.slice(0);
                newInput[recDefIndex] = newInput[recDefIndex] - 1;
                nextInput[i] = calculate(inner[i]["name"], newInput);

            } else {
                throw "Unerlaubte Rekursion";
            }
        } else {
            nextInput[i] = calculateAdv(inner[i], input, origname, recDefIndex);
        }
    }


    if (name === "s") {
        result = nextInput[0] + 1;
    } else {
        result = calculate(name, nextInput);
    }
    return result;
}