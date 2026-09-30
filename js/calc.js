/**
 * Calculation module for Primitive Recursive Simulator.
 */

import { getFunctionDefinition } from './data.js';

let tempResults = {};
let recMaxTemp = {};

export function clearCalcCache() {
    tempResults = {};
    recMaxTemp = {};
}

export function calculate(name, input) {
    if (!tempResults[name]) {
        tempResults[name] = {};
    }
    const inputKey = JSON.stringify(input);
    if (tempResults[name][inputKey] !== undefined) {
        return tempResults[name][inputKey];
    }

    const func = getFunctionDefinition(name);
    if (!func) {
        throw new Error(`Function '${name}' is not defined`);
    }

    let result;
    switch (func.type) {
        case 0:
            result = calculateRec(name, input);
            break;
        case 1:
            result = calculateAdv(func.init[0], input, name);
            break;
        default:
            throw new Error(`Unknown function type: ${func.type}`);
    }

    tempResults[name][inputKey] = result;
    return result;
}

function calculateRec(name, input) {
    let currentRecMax = 0;
    const func = getFunctionDefinition(name);
    const recDefIndex = func.recDefIndex;

    if (!recMaxTemp[name]) {
        recMaxTemp[name] = {};
    }

    let inputToChange = [...input];
    inputToChange.splice(recDefIndex, 1);
    const splicedInputString = JSON.stringify(inputToChange);

    if (recMaxTemp[name][splicedInputString] !== undefined && recMaxTemp[name][splicedInputString] <= input[recDefIndex]) {
        currentRecMax = recMaxTemp[name][splicedInputString];
    }

    let lastResult = 0;
    inputToChange = [...input];

    if (currentRecMax === 0) {
        inputToChange[recDefIndex] = 0;
        lastResult = calculateAdv(func.init[0], inputToChange, name);
    } else {
        inputToChange[recDefIndex] = currentRecMax;
        lastResult = tempResults[name][JSON.stringify(inputToChange)];
    }

    for (let i = currentRecMax + 1; i <= input[recDefIndex]; i++) {
        inputToChange[recDefIndex] = i;
        lastResult = calculateAdv(func.recDef[0], inputToChange, name, recDefIndex, lastResult);
    }

    recMaxTemp[name][splicedInputString] = input[recDefIndex];
    return lastResult;
}

function calculateAdv(jsonFunc, input, origName, recDefIndex = -1, lastResult = null) {
    const name = jsonFunc.name;
    const inner = jsonFunc.inner;

    let result;

    if (name === "param") {
        result = input[inner];
        if (inner === recDefIndex) {
            result--;
        }
        return result;
    } else if (name === "const") {
        return inner;
    } else if (name === origName) {
        if (recDefIndex > -1) {
            return lastResult;
        } else {
            throw new Error("Illegal recursion");
        }
    }

    const nextInput = doNextInputCalc(inner, input, origName, recDefIndex, lastResult);

    if (name === "add") {
        result = nextInput[0] + nextInput[1];
    } else if (name === "mult") {
        result = nextInput[0] * nextInput[1];
    } else if (name === "s") {
        result = nextInput[0] + 1;
    } else {
        result = calculate(name, nextInput);
    }

    return result;
}

function doNextInputCalc(inner, input, origName, recDefIndex, lastResult) {
    const nextInput = [];
    for (let i = 0; i < inner.length; i++) {
        if (inner[i].name === origName) {
            if (recDefIndex > -1) {
                nextInput[i] = lastResult;
            } else {
                throw new Error("Illegal recursion");
            }
        } else {
            nextInput[i] = calculateAdv(inner[i], input, origName, recDefIndex, lastResult);
        }
    }
    return nextInput;
}
