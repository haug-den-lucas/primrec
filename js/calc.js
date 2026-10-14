/**
 * Calculation module for Primitive Recursive Simulator.
 *
 * Evaluates primitive recursive functions defined either by composition (type 1)
 * or primitive recursion (type 0).
 */

import { getFunctionDefinition } from './data.js';

/**
 * Clears calculation cache (kept for backwards compatibility).
 */
export function clearCalcCache() {
    // Direct computation without global caching side-effects
}

/**
 * Calculates the output of a named primitive recursive function given input parameters.
 *
 * @param {string} name - Function name
 * @param {number[]} input - Numerical arguments
 * @returns {number} Function result
 */
export function calculate(name, input) {
    const func = getFunctionDefinition(name);
    if (!func) {
        throw new Error(`Function '${name}' is not defined`);
    }

    if (func.type === 0) {
        return calculatePrimitiveRecursion(name, func, input);
    } else if (func.type === 1) {
        return evaluateExpression(func.init[0], input, name);
    }

    throw new Error(`Unknown function type: ${func.type}`);
}

/**
 * Evaluates a function defined via primitive recursion (type 0).
 *
 * For a function h(x1,..., xk, n, y1,..., ym) where n is the recursion parameter at recDefIndex:
 * - base case (n = 0): evaluated using func.init[0]
 * - step case (n -> n + 1): iteratively evaluated using func.recDef[0]
 */
function calculatePrimitiveRecursion(name, func, input) {
    const recDefIndex = func.recDefIndex;
    const targetSteps = input[recDefIndex];

    const currentInput = [...input];

    // Base case: recursion parameter set to 0
    currentInput[recDefIndex] = 0;
    let lastResult = evaluateExpression(func.init[0], currentInput, name);

    // Iteratively apply step definition from 1 to n
    for (let step = 1; step <= targetSteps; step++) {
        currentInput[recDefIndex] = step;
        lastResult = evaluateExpression(func.recDef[0], currentInput, name, recDefIndex, lastResult);
    }

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
function evaluateExpression(rootNode, input, origName, recDefIndex = -1, lastResult = null) {
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
                lastReturnedValue = calculate(name, subArgs);
            }

            stack.pop();

            if (stack.length > 0) {
                stack[stack.length - 1].args.push(lastReturnedValue);
            }
        }
    }

    return lastReturnedValue;
}
