import { getFunctionDefinition } from './data.js';
import { renderFunctionString, renderDefinitionLines } from './formatter.js';

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
    const defLines = renderDefinitionLines(name, func);

    if (n === 0) {
        // Base case: line 1 = defLines[0]
        const symbolicLine = defLines[0] || `${name}(...)`;
        const exprTree = buildExpressionTree(func.init[0], input, name, recDefIndex, true);

        const subExprFormatted = renderConcreteRhs(func.init[0], input, name, recDefIndex, true);
        const concreteLine = `${name}(${input.join(', ')}) = ${subExprFormatted.fullWithHighlight} = ${exprTree.result}`;

        if (exprTree.node) {
            return {
                symbolicLine,
                concreteLine,
                result: exprTree.result,
                type: 'function',
                children: [exprTree.node]
            };
        }

        return {
            symbolicLine,
            concreteLine,
            result: exprTree.result,
            type: 'function',
            children: []
        };
    } else {
        // Step case: line 1 = defLines[1]
        const symbolicLine = defLines[1] || `${name}(...)`;
        const exprTree = buildExpressionTree(func.recDef[0], input, name, recDefIndex, false);

        const subExprFormatted = renderConcreteRhs(func.recDef[0], input, name, recDefIndex, false);
        const concreteLine = `${name}(${input.join(', ')}) = ${subExprFormatted.fullWithHighlight} = ${exprTree.result}`;

        if (exprTree.node) {
            return {
                symbolicLine,
                concreteLine,
                result: exprTree.result,
                type: 'function',
                children: [exprTree.node]
            };
        }

        return {
            symbolicLine,
            concreteLine,
            result: exprTree.result,
            type: 'function',
            children: []
        };
    }
}

/**
 * Builds calculation tree for a function defined via composition (type 1).
 */
function buildCompositionTree(name, func, input) {
    const defLines = renderDefinitionLines(name, func);
    const symbolicLine = defLines[0] || `${name}(...) = ...`;

    const rootExprTree = buildExpressionTree(func.init[0], input, name, -1, false);
    const subExprFormatted = renderConcreteRhs(func.init[0], input, name, -1, false);
    const concreteLine = `${name}(${input.join(', ')}) = ${subExprFormatted.fullWithHighlight} = ${rootExprTree.result}`;

    if (rootExprTree.node) {
        return {
            symbolicLine,
            concreteLine,
            result: rootExprTree.result,
            type: 'function',
            children: [rootExprTree.node]
        };
    }

    return {
        symbolicLine,
        concreteLine,
        result: rootExprTree.result,
        type: 'function',
        children: []
    };
}

/**
 * Helper to render concrete RHS expression with <u>...</u> around the inner sub-call part.
 */
function renderConcreteRhs(node, input, origName, recDefIndex, isInitStep) {
    if (!node) return { fullWithHighlight: "" };

    const name = node.name;

    if (name === "param") {
        const paramIdx = node.inner;
        let val;
        if (paramIdx === recDefIndex) {
            val = isInitStep ? 0 : input[paramIdx] - 1;
        } else {
            val = input[paramIdx];
        }
        return { fullWithHighlight: String(val) };
    }

    if (name === "const") {
        return { fullWithHighlight: String(node.inner) };
    }

    if (name === origName) {
        let prevInput = [...input];
        prevInput[recDefIndex] = input[recDefIndex] - 1;
        const callStr = `${origName}(${prevInput.join(', ')})`;
        return { fullWithHighlight: `<u>${callStr}</u>` };
    }

    const childNodes = Array.isArray(node.inner) ? node.inner : [];
    const innerParts = childNodes.map(cNode => renderConcreteRhs(cNode, input, origName, recDefIndex, isInitStep));
    const innerStr = innerParts.map(p => p.fullWithHighlight).join(", ");

    if (name === "s") {
        return { fullWithHighlight: `${name}(${innerStr})` };
    }

    return { fullWithHighlight: `<u>${name}(${innerStr})</u>` };
}

/**
 * Recursively builds expression evaluation tree node.
 * Returns { result: number, node: TreeObject|null }
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
        return { result: val, node: null };
    }

    if (name === "const") {
        return { result: node.inner, node: null };
    }

    if (name === origName) {
        if (recDefIndex > -1) {
            let prevInput = [...input];
            prevInput[recDefIndex] = input[recDefIndex] - 1;
            const tree = calculateWithTree(origName, prevInput);
            return { result: tree.result, node: tree };
        }
        throw new Error("Illegal recursion");
    }

    const childNodes = Array.isArray(node.inner) ? node.inner : [];
    const evaluatedChildren = childNodes.map(child =>
        buildExpressionTree(child, input, origName, recDefIndex, isInitStep)
    );
    const childArgs = evaluatedChildren.map(c => c.result);
    const argChildNodes = evaluatedChildren.map(c => c.node).filter(Boolean);

    let result;
    let nodeObject = null;

    if (name === "s") {
        result = childArgs[0] + 1;
        if (argChildNodes.length > 0) {
            nodeObject = argChildNodes[0];
        }
    } else {
        // Predefined function ('add', 'mult') or custom defined function
        const subTree = calculateWithTree(name, childArgs);
        result = subTree.result;

        // Attach argument child nodes (e.g. mult(0, 1)) as children of subTree (e.g. add(0, 1))
        subTree.children = [...argChildNodes, ...subTree.children];
        nodeObject = subTree;
    }

    return {
        result,
        node: nodeObject
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
