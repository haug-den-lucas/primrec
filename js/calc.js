import { getFunctionDefinition } from './data.js';

/**
 * Calculates the output of a named primitive recursive function given input parameters.
 * An optional evaluation context can be passed or created per top-level evaluation
 * to memoize results during that single evaluation without relying on global state.
 *
 * @param {string} name - Function name
 * @param {number[]} input - Numerical arguments
 * @param {Object|null} [ctx=null] - Evaluation context containing memoization tables
 * @returns {number} Function result
 */
export function calculate(name, input, ctx = null) {
    if (!ctx) {
        ctx = { memo: {}, recMax: {} };
    }

    if (!ctx.memo[name]) {
        ctx.memo[name] = {};
    }

    const inputKey = JSON.stringify(input);
    if (ctx.memo[name][inputKey] !== undefined) {
        return ctx.memo[name][inputKey];
    }

    const func = getFunctionDefinition(name);
    if (!func) {
        throw new Error(`Function '${name}' is not defined`);
    }

    let result;
    if (func.type === 0) {
        result = calculatePrimitiveRecursion(name, func, input, ctx);
    } else if (func.type === 1) {
        result = evaluateExpression(func.init[0], input, name, -1, null, ctx);
    } else {
        throw new Error(`Unknown function type: ${func.type}`);
    }

    ctx.memo[name][inputKey] = result;
    return result;
}

/**
 * Builds a full calculation tree for evaluating function `name` with `input`.
 */
export function calculateWithTree(name, input) {
    const func = getFunctionDefinition(name);
    if (!func) {
        throw new Error(`Function '${name}' is not defined`);
    }

    if (func.type === 0) {
        return buildPrimitiveRecursionTree(name, func, input);
    } else if (func.type === 1) {
        return buildCompositionTree(name, func, input);
    } else {
        throw new Error(`Unknown function type: ${func.type}`);
    }
}

/**
 * Builds calculation tree for a function defined via primitive recursion (type 0).
 */
function buildPrimitiveRecursionTree(name, func, input) {
    const recDefIndex = func.recDefIndex;
    const n = input[recDefIndex];

    const label = `${name}(${input.join(', ')})`;

    if (n === 0) {
        // Base case: evaluate func.init[0]
        const exprTree = buildExpressionTree(func.init[0], input, name, recDefIndex, true);
        return {
            label,
            result: exprTree.result,
            expr: `${label} = ${exprTree.result}`,
            type: 'function',
            children: [exprTree]
        };
    } else {
        // Step case: evaluate func.recDef[0]
        const exprTree = buildExpressionTree(func.recDef[0], input, name, recDefIndex, false);
        return {
            label,
            result: exprTree.result,
            expr: `${label} = ${exprTree.result}`,
            type: 'function',
            children: [exprTree]
        };
    }
}

/**
 * Builds calculation tree for a function defined via composition (type 1).
 */
function buildCompositionTree(name, func, input) {
    const rootExprTree = buildExpressionTree(func.init[0], input, name, -1, false);
    const label = `${name}(${input.join(', ')})`;
    const result = rootExprTree.result;

    return {
        label,
        result,
        expr: `${label} = ${result}`,
        type: 'function',
        children: [rootExprTree]
    };
}

/**
 * Recursively builds expression evaluation tree node.
 */
function buildExpressionTree(node, input, origName, recDefIndex, isInitStep) {
    const name = node.name;

    if (name === "param") {
        const paramIdx = node.inner;
        let val;
        if (paramIdx === recDefIndex) {
            val = isInitStep ? 0 : input[paramIdx] - 1;
        } else {
            val = input[paramIdx];
        }
        const paramName = String.fromCharCode(97 + paramIdx);
        return {
            label: `param ${paramName}`,
            result: val,
            expr: `param ${paramName} = ${val}`,
            type: 'leaf',
            children: []
        };
    }

    if (name === "const") {
        const val = node.inner;
        return {
            label: `const ${val}`,
            result: val,
            expr: `const = ${val}`,
            type: 'leaf',
            children: []
        };
    }

    if (name === origName) {
        if (recDefIndex > -1) {
            // Recursive self call: call origName with step - 1 for recDefIndex parameter
            let prevInput = [...input];
            prevInput[recDefIndex] = input[recDefIndex] - 1;
            return calculateWithTree(origName, prevInput);
        }
        throw new Error("Illegal recursion");
    }

    // Node is an inner node (a function call: 'add', 'mult', 's', or a defined user/predefined function)
    const childNodes = Array.isArray(node.inner) ? node.inner : [];
    const evaluatedChildren = childNodes.map(child =>
        buildExpressionTree(child, input, origName, recDefIndex, isInitStep)
    );
    const childArgs = evaluatedChildren.map(c => c.result);

    let result;
    let extraChildren = [];

    if (name === "s") {
        result = childArgs[0] + 1;
    } else if (name === "add") {
        result = childArgs[0] + childArgs[1];
    } else if (name === "mult") {
        result = childArgs[0] * childArgs[1];
    } else {
        // Sub-function evaluation tree
        const subTree = calculateWithTree(name, childArgs);
        result = subTree.result;
        extraChildren = [subTree];
    }

    const label = `${name}(${childArgs.join(', ')})`;
    const allChildren = [...evaluatedChildren, ...extraChildren];

    return {
        label,
        result,
        expr: `${label} = ${result}`,
        type: 'function',
        children: allChildren
    };
}

/**
 * Evaluates a function defined via primitive recursion (type 0).
 */
function calculatePrimitiveRecursion(name, func, input, ctx) {
    const recDefIndex = func.recDefIndex;
    const targetSteps = input[recDefIndex];

    if (!ctx.recMax[name]) {
        ctx.recMax[name] = {};
    }

    let splicedInput = [...input];
    splicedInput.splice(recDefIndex, 1);
    const splicedInputKey = JSON.stringify(splicedInput);

    let currentRecMax = 0;
    if (ctx.recMax[name][splicedInputKey] !== undefined && ctx.recMax[name][splicedInputKey] <= targetSteps) {
        currentRecMax = ctx.recMax[name][splicedInputKey];
    }

    let inputToChange = [...input];
    let lastResult;

    if (currentRecMax === 0) {
        inputToChange[recDefIndex] = 0;
        lastResult = evaluateExpression(func.init[0], inputToChange, name, -1, null, ctx);
        ctx.memo[name][JSON.stringify(inputToChange)] = lastResult;
    } else {
        inputToChange[recDefIndex] = currentRecMax;
        lastResult = ctx.memo[name][JSON.stringify(inputToChange)];
    }

    for (let step = currentRecMax + 1; step <= targetSteps; step++) {
        inputToChange[recDefIndex] = step;
        lastResult = evaluateExpression(func.recDef[0], inputToChange, name, recDefIndex, lastResult, ctx);
        ctx.memo[name][JSON.stringify(inputToChange)] = lastResult;
    }

    ctx.recMax[name][splicedInputKey] = targetSteps;
    return lastResult;
}

/**
 * Checks if an expression tree node is a leaf (param, const, or recursive self-reference).
 */
function isLeafNode(node, origName) {
    return node.name === "param" || node.name === "const" || node.name === origName;
}

/**
 * Evaluates a leaf node value directly.
 */
function evaluateLeafNode(node, input, origName, recDefIndex, lastResult) {
    if (node.name === "param") {
        return node.inner === recDefIndex ? input[node.inner] - 1 : input[node.inner];
    }
    if (node.name === "const") {
        return node.inner;
    }
    if (node.name === origName) {
        if (recDefIndex > -1) {
            return lastResult;
        }
        throw new Error("Illegal recursion");
    }
    throw new Error(`Unknown leaf node type: ${node.name}`);
}

/**
 * Iteratively evaluates an expression tree for function composition, avoiding
 * call stack overflow even for deeply nested expression trees.
 */
function evaluateExpression(rootNode, input, origName, recDefIndex = -1, lastResult = null, ctx = null) {
    if (isLeafNode(rootNode, origName)) {
        return evaluateLeafNode(rootNode, input, origName, recDefIndex, lastResult);
    }

    // Call stack optimization: explicit stack for traversing composition tree
    const stack = [{
        node: rootNode,
        args: [],
        childIndex: 0
    }];

    let lastReturnedValue = null;

    while (stack.length > 0) {
        const top = stack[stack.length - 1];
        const innerNodes = top.node.inner;
        const numChildren = Array.isArray(innerNodes) ? innerNodes.length : 0;

        if (top.childIndex < numChildren) {
            const childNode = innerNodes[top.childIndex];
            top.childIndex++;

            if (isLeafNode(childNode, origName)) {
                top.args.push(evaluateLeafNode(childNode, input, origName, recDefIndex, lastResult));
            } else {
                stack.push({
                    node: childNode,
                    args: [],
                    childIndex: 0
                });
            }
        } else {
            // All child arguments evaluated for this node
            const name = top.node.name;
            const subArgs = top.args;

            if (name === "add") {
                lastReturnedValue = subArgs[0] + subArgs[1];
            } else if (name === "mult") {
                lastReturnedValue = subArgs[0] * subArgs[1];
            } else if (name === "s") {
                lastReturnedValue = subArgs[0] + 1;
            } else {
                lastReturnedValue = calculate(name, subArgs, ctx);
            }

            stack.pop();

            if (stack.length > 0) {
                stack[stack.length - 1].args.push(lastReturnedValue);
            }
        }
    }

    return lastReturnedValue;
}
