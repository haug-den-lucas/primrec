/**
 * Tree calculation and execution tracing engine for Primitive Recursive Simulator.
 *
 * Produces a complete hierarchical tree of primitive recursive evaluations,
 * including base cases, recursive steps, composition, algebraic derivations,
 * and a linear execution trace for interactive step-by-step playback.
 */

import { getFunctionDefinition } from './data.js';

let nodeIdCounter = 0;

function nextId() {
    return `node_${++nodeIdCounter}`;
}

/**
 * Formats a function call string, e.g. "add(2, 3)"
 */
export function formatCall(name, args) {
    return `${name}(${args.join(', ')})`;
}

/**
 * Renders an expression tree node into a symbolic string given current parameter values.
 *
 * @param {Object} expr - Expression node
 * @param {string} origName - The parent function name
 * @param {number[]} args - The arguments array
 * @param {number} recDefIndex - The index of the recursion parameter (-1 if init/composition)
 * @param {string|number|null} recValuePlaceholder - String or value to substitute for recursive self-call
 * @param {boolean} substituteValues - Whether to substitute numeric parameter values or letter names
 */
export function formatExpression(expr, origName, args, recDefIndex = -1, recValuePlaceholder = null, substituteValues = true) {
    if (!expr) return '';

    if (expr.name === 'const') {
        return String(expr.inner);
    }

    if (expr.name === 'param') {
        const pIdx = expr.inner;
        if (pIdx === recDefIndex) {
            if (substituteValues && args && args[pIdx] !== undefined) {
                return String(args[pIdx] - 1);
            }
            return String.fromCharCode(97 + pIdx);
        }
        if (substituteValues && args && args[pIdx] !== undefined) {
            return String(args[pIdx]);
        }
        return String.fromCharCode(97 + pIdx);
    }

    if (expr.name === origName && (!expr.inner || expr.inner.length === 0)) {
        if (recValuePlaceholder !== null) {
            return String(recValuePlaceholder);
        }
        // Symbolic recursive call
        if (substituteValues && args && recDefIndex >= 0) {
            const predArgs = [...args];
            predArgs[recDefIndex] = args[recDefIndex] - 1;
            return `${origName}(${predArgs.join(', ')})`;
        }
        return `${origName}(...)`;
    }

    if (expr.name === 's') {
        const inner = expr.inner && expr.inner[0]
            ? formatExpression(expr.inner[0], origName, args, recDefIndex, recValuePlaceholder, substituteValues)
            : '';
        return `s(${inner})`;
    }

    if (Array.isArray(expr.inner)) {
        const innerStrs = expr.inner.map(child =>
            formatExpression(child, origName, args, recDefIndex, recValuePlaceholder, substituteValues)
        );
        return `${expr.name}(${innerStrs.join(', ')})`;
    }

    return expr.name;
}

/**
 * Evaluates a function and builds an execution tree with trace and derivation.
 *
 * @param {string} name - Top-level function name
 * @param {number[]} input - Numerical input parameters
 * @param {Object} [options={}] - Options (e.g. maxNodes)
 * @returns {Object} Tree evaluation result
 */
export function evaluateWithTree(name, input, options = {}) {
    nodeIdCounter = 0;
    const maxNodes = options.maxNodes || 1000;
    let nodeCount = 0;
    const executionTrace = [];
    let maxDepthReached = 0;
    let baseCaseCount = 0;
    let stepCaseCount = 0;

    function checkNodeLimit() {
        nodeCount++;
        if (nodeCount > maxNodes) {
            throw new Error(`Evaluation tree reached the limit of ${maxNodes} steps. Please try smaller input values (e.g., 0 to 5) to visualize the tree.`);
        }
    }

    function evalFunc(funcName, args, depth = 0, parentContext = {}) {
        checkNodeLimit();
        if (depth > maxDepthReached) {
            maxDepthReached = depth;
        }

        const id = nextId();
        const callSig = formatCall(funcName, args);

        // Successor basic function: s(n) = n + 1
        if (funcName === 's') {
            const val = args[0] + 1;
            const node = {
                id,
                name: 's',
                args: [...args],
                result: val,
                stepType: 'primitive',
                label: `s(${args[0]})`,
                callSig: `s(${args[0]})`,
                resultLabel: `s(${args[0]}) = ${val}`,
                rule: 'Successor: s(n) = n + 1',
                equation: `s(${args[0]}) = ${val}`,
                depth,
                children: [],
                isHelper: depth > 0 && funcName !== parentContext.rootName,
                role: 'Successor',
                roleDescription: 'Primitive successor operation s(n) = n + 1'
            };
            executionTrace.push({
                type: 'call',
                nodeId: id,
                callSig,
                node,
                depth,
                message: `Calling primitive successor s(${args[0]})...`
            });
            executionTrace.push({
                type: 'return',
                nodeId: id,
                callSig,
                node,
                depth,
                result: val,
                message: `s(${args[0]}) evaluates to ${val}.`
            });
            return node;
        }

        const func = getFunctionDefinition(funcName);
        if (!func) {
            throw new Error(`Function '${funcName}' is not defined.`);
        }

        if (args.length !== func.params) {
            throw new Error(`Function '${funcName}' expects ${func.params} arguments, but received ${args.length}.`);
        }

        const isHelper = depth > 0 && funcName !== parentContext.rootName;
        const node = {
            id,
            name: funcName,
            args: [...args],
            depth,
            funcType: func.type,
            children: [],
            isHelper,
            callSig,
            parentName: parentContext.parentName || null
        };

        if (func.type === 0) {
            // Primitive Recursion
            const recIdx = func.recDefIndex;
            const recVal = args[recIdx];
            const paramLetter = String.fromCharCode(97 + recIdx);
            node.recIndex = recIdx;
            node.recVal = recVal;

            if (recVal === 0) {
                // Base Case: y = 0
                baseCaseCount++;
                node.stepType = 'base';
                node.rule = `Base Case: parameter ${paramLetter} = 0`;
                node.role = 'Base Case';
                node.roleDescription = `Base case: parameter ${paramLetter} = 0`;
                node.label = callSig;

                executionTrace.push({
                    type: 'call',
                    nodeId: id,
                    callSig,
                    node,
                    depth,
                    message: `Calling ${callSig} [Base Case: ${paramLetter} = 0]. Evaluating base definition...`
                });

                // Evaluate init expression
                const initResult = evalExpr(
                    func.init[0],
                    args,
                    funcName,
                    -1,
                    null,
                    depth + 1,
                    node,
                    { rootName: funcName, parentName: funcName }
                );

                node.result = initResult.val;
                node.resultLabel = `${callSig} = ${node.result}`;
                const initExprStr = formatExpression(func.init[0], funcName, args, -1, null, true);
                node.reductionStep = String(initExprStr);
                node.reductionEquation = `${callSig} = ${initExprStr}`;
                if (String(initExprStr) === String(node.result)) {
                    node.equation = `${callSig} = ${node.result}`;
                } else {
                    node.equation = `${callSig} = ${initExprStr} = ${node.result}`;
                }
                node.symbolicRule = `${funcName}(..., 0, ...) = ${formatExpression(func.init[0], funcName, args, -1, null, false)}`;

                if (initResult.nodes.length > 0) {
                    node.children.push(...initResult.nodes);
                }

                executionTrace.push({
                    type: 'return',
                    nodeId: id,
                    callSig,
                    node,
                    depth,
                    result: node.result,
                    message: `${callSig} reached Base Case. Evaluated init expression -> returns ${node.result}.`
                });
            } else {
                // Recursive Step: y = k + 1 (recVal > 0)
                stepCaseCount++;
                node.stepType = 'step';
                const predVal = recVal - 1;
                node.rule = `Recursive Step: parameter ${paramLetter} = ${predVal} + 1`;
                node.label = callSig;

                executionTrace.push({
                    type: 'call',
                    nodeId: id,
                    callSig,
                    node,
                    depth,
                    message: `Calling ${callSig} [Recursive Step: ${paramLetter} = ${predVal} + 1]. Recursing down to ${paramLetter} = ${predVal}...`
                });

                // 1. Recursive call on predecessor
                const predArgs = [...args];
                predArgs[recIdx] = predVal;
                const recChild = evalFunc(funcName, predArgs, depth + 1, {
                    rootName: funcName,
                    parentName: funcName
                });
                if (recChild.stepType === 'base') {
                    recChild.role = 'Base Case';
                    recChild.roleDescription = `Base case (${paramLetter} = 0): base value feeds into outer combiner`;
                } else {
                    recChild.role = 'Inner Call';
                    recChild.roleDescription = 'Inner recursive call: evaluated first to feed into outer combiner';
                }
                node.children.push(recChild);

                // 2. Evaluate recDef expression with lastResult = recChild.result
                const recDefResult = evalExpr(
                    func.recDef[0],
                    args,
                    funcName,
                    recIdx,
                    recChild.result,
                    depth + 1,
                    node,
                    { rootName: funcName, parentName: funcName }
                );

                node.result = recDefResult.val;
                node.resultLabel = `${callSig} = ${node.result}`;

                const symbolicRhs = formatExpression(func.recDef[0], funcName, args, recIdx, `${funcName}(${predArgs.join(', ')})`, true);
                const substitutedRhs = formatExpression(func.recDef[0], funcName, args, recIdx, recChild.result, true);
                node.reductionStep = symbolicRhs;
                node.reductionEquation = `${callSig} = ${symbolicRhs}`;
                node.stepEquation = `${callSig} = ${symbolicRhs}`;
                node.equation = `${callSig} = ${symbolicRhs} = ${substitutedRhs} = ${node.result}`;
                node.symbolicRule = `${funcName}(..., ${paramLetter}+1, ...) = ${formatExpression(func.recDef[0], funcName, args, recIdx, `${funcName}(..., ${paramLetter}, ...)`, false)}`;

                if (recDefResult.nodes.length > 0) {
                    recDefResult.nodes.forEach(child => {
                        child.role = 'Outer Combiner';
                        child.roleDescription = `Outer combiner: combines recursive result (${recChild.result}) with arguments`;
                    });
                    node.children.push(...recDefResult.nodes);
                }

                executionTrace.push({
                    type: 'return',
                    nodeId: id,
                    callSig,
                    node,
                    depth,
                    result: node.result,
                    message: `Returning to ${callSig}. Computed step definition with recursive result ${recChild.result} -> returns ${node.result}.`
                });
            }
        } else if (func.type === 1) {
            // Function Composition
            node.stepType = 'composition';
            node.rule = `Composition`;
            node.label = callSig;

            executionTrace.push({
                type: 'call',
                nodeId: id,
                callSig,
                node,
                depth,
                message: `Calling ${callSig} [Composition]. Evaluating inner composed functions...`
            });

            const compResult = evalExpr(
                func.init[0],
                args,
                funcName,
                -1,
                null,
                depth + 1,
                node,
                { rootName: funcName, parentName: funcName }
            );

            node.result = compResult.val;
            node.resultLabel = `${callSig} = ${node.result}`;
            const compExprStr = formatExpression(func.init[0], funcName, args, -1, null, true);
            node.reductionStep = compExprStr;
            node.reductionEquation = `${callSig} = ${compExprStr}`;
            node.stepEquation = `${callSig} = ${compExprStr}`;
            if (String(compExprStr) === String(node.result)) {
                node.equation = `${callSig} = ${node.result}`;
            } else {
                node.equation = `${callSig} = ${compExprStr} = ${node.result}`;
            }
            node.symbolicRule = `${funcName}(...) = ${formatExpression(func.init[0], funcName, args, -1, null, false)}`;

            if (compResult.nodes.length > 0) {
                node.children.push(...compResult.nodes);
            }

            executionTrace.push({
                type: 'return',
                nodeId: id,
                callSig,
                node,
                depth,
                result: node.result,
                message: `${callSig} composition evaluated -> returns ${node.result}.`
            });
        }

        return node;
    }

    function evalExpr(exprNode, currentArgs, origName, recDefIndex, lastResult, depth, parentNode, ctx) {
        if (!exprNode) return { val: 0, nodes: [] };

        if (exprNode.name === 'const') {
            return { val: exprNode.inner, nodes: [] };
        }

        if (exprNode.name === 'param') {
            const pIdx = exprNode.inner;
            const val = (pIdx === recDefIndex) ? (currentArgs[pIdx] - 1) : currentArgs[pIdx];
            return { val, nodes: [] };
        }

        if (exprNode.name === origName && (!exprNode.inner || exprNode.inner.length === 0)) {
            if (lastResult !== null && lastResult !== undefined) {
                return { val: lastResult, nodes: [] };
            }
            throw new Error(`Illegal recursion in '${origName}'.`);
        }

        if (exprNode.name === 's') {
            const childResult = evalExpr(exprNode.inner[0], currentArgs, origName, recDefIndex, lastResult, depth, parentNode, ctx);
            const val = childResult.val + 1;
            return {
                val,
                nodes: childResult.nodes
            };
        }

        // Composed function call inside expression (e.g. add, mult, userFunc)
        const childArgs = [];
        const childNodes = [];

        if (Array.isArray(exprNode.inner)) {
            for (const argExpr of exprNode.inner) {
                const sub = evalExpr(argExpr, currentArgs, origName, recDefIndex, lastResult, depth + 1, parentNode, ctx);
                childArgs.push(sub.val);
                if (sub.nodes.length > 0) {
                    childNodes.push(...sub.nodes);
                }
            }
        }

        const calledNode = evalFunc(exprNode.name, childArgs, depth, ctx);
        return {
            val: calledNode.result,
            nodes: [...childNodes, calledNode]
        };
    }

    const rootNode = evalFunc(name, input, 0, { rootName: name, parentName: null });
    rootNode.role = rootNode.stepType === 'base' ? 'Base Case' : (rootNode.stepType === 'step' ? 'Top Call' : 'Composition');
    rootNode.roleDescription = 'Top-level function evaluation';

    // Generate mathematical derivations
    const derivations = buildDerivationLines(rootNode, name);

    // Generate Expression / Reduction AST (Option 1)
    const expressionAst = buildExpressionAst(rootNode);

    return {
        result: rootNode.result,
        root: rootNode,
        expressionAst,
        trace: executionTrace,
        derivations,
        stats: {
            totalCalls: nodeCount,
            maxDepth: maxDepthReached,
            baseCases: baseCaseCount,
            stepCases: stepCaseCount
        }
    };
}

/**
 * Builds algebraic step-by-step substitution derivation lines.
 */
function buildDerivationLines(rootNode, rootName) {
    const lines = [];
    if (!rootNode) return lines;

    // Collect spine of primary recursive calls
    const spine = [];
    let current = rootNode;
    while (current) {
        spine.push(current);
        // Find recursive child
        current = current.children.find(child => child.name === rootName && !child.isHelper);
    }

    if (spine.length <= 1) {
        // Simple composition or immediate base case
        lines.push({
            step: 1,
            expr: rootNode.equation || `${rootNode.callSig} = ${rootNode.result}`,
            annotation: rootNode.rule
        });
        return lines;
    }

    // Step 0: Initial call
    lines.push({
        step: 1,
        expr: spine[0].callSig,
        annotation: 'Initial expression'
    });

    // Unwinding phase: from top to base case
    for (let i = 0; i < spine.length - 1; i++) {
        const node = spine[i];
        const nextNode = spine[i + 1];
        lines.push({
            step: lines.length + 1,
            expr: `= ${node.equation.split(' = ')[1] || node.equation}`,
            annotation: `Apply ${node.rule}`
        });
    }

    // Base case reached
    const baseNode = spine[spine.length - 1];
    lines.push({
        step: lines.length + 1,
        expr: `= ${baseNode.equation.split(' = ')[1] || baseNode.result}`,
        annotation: `Base case: ${baseNode.callSig} = ${baseNode.result}`
    });

    // Folding phase: back up to root
    for (let i = spine.length - 2; i >= 0; i--) {
        const node = spine[i];
        lines.push({
            step: lines.length + 1,
            expr: `= ${node.result}`,
            annotation: `Evaluate ${node.callSig} = ${node.result}`
        });
    }

    return lines;
}

/**
 * Builds a functional programming Expression / Reduction AST (Option 1).
 * In this tree:
 * - The outer combiner function (e.g. add, s) is the parent operator node.
 * - Its arguments (the inner recursive call, parameters, constants) are child branches.
 */
export function buildExpressionAst(node) {
    if (!node) return null;
    let astIdCounter = 0;

    function build(n) {
        if (!n) return null;
        const func = getFunctionDefinition(n.name);

        if (n.stepType === 'base' || !func || func.type === undefined) {
            return {
                id: `ast_${++astIdCounter}`,
                nodeId: n.id,
                type: 'base',
                role: 'Base Case',
                operator: n.callSig,
                label: n.callSig,
                result: n.result,
                funcName: n.name,
                args: n.args,
                reductionStep: n.reductionStep,
                reductionEquation: n.reductionEquation,
                stepEquation: n.stepEquation || n.equation,
                equation: n.equation,
                children: []
            };
        }

        if (n.stepType === 'step') {
            const recIdx = n.recIndex;
            const recVal = n.recVal;
            const predVal = recVal - 1;

            const recChild = n.children.find(c => c.name === n.name && !c.isHelper);
            const innerAst = build(recChild);

            const recDefExpr = func.recDef && func.recDef[0] ? func.recDef[0] : null;

            function mapExpr(expr) {
                if (!expr) return null;
                // Recursive self-call
                if (expr.name === n.name && (!expr.inner || expr.inner.length === 0)) {
                    if (innerAst && innerAst.type !== 'base') {
                        innerAst.role = 'Inner Call';
                    }
                    return innerAst;
                }
                // Parameter argument
                if (expr.name === 'param') {
                    const pIdx = expr.inner;
                    const val = pIdx === recIdx ? predVal : n.args[pIdx];
                    const letter = String.fromCharCode(97 + pIdx);
                    return {
                        id: `ast_${++astIdCounter}`,
                        nodeId: n.id,
                        type: 'argument',
                        role: 'Argument',
                        operator: letter,
                        label: `${letter} = ${val}`,
                        result: val,
                        children: []
                    };
                }
                // Constant argument
                if (expr.name === 'const') {
                    return {
                        id: `ast_${++astIdCounter}`,
                        nodeId: n.id,
                        type: 'constant',
                        role: 'Constant',
                        operator: String(expr.inner),
                        label: String(expr.inner),
                        result: expr.inner,
                        children: []
                    };
                }
                // Sub-expression / inner combiner
                const subChildren = (expr.inner || []).map(mapExpr).filter(Boolean);
                return {
                    id: `ast_${++astIdCounter}`,
                    nodeId: n.id,
                    type: 'outer_combiner',
                    role: 'Outer Combiner',
                    operator: expr.name,
                    label: expr.name,
                    children: subChildren
                };
            }

            let ast = null;
            if (recDefExpr) {
                ast = mapExpr(recDefExpr);
            }

            if (!ast) {
                ast = {
                    id: `ast_${++astIdCounter}`,
                    nodeId: n.id,
                    type: 'outer_combiner',
                    role: 'Outer Combiner',
                    operator: n.name,
                    label: n.name,
                    children: innerAst ? [innerAst] : []
                };
            }

            ast.result = n.result;
            ast.funcName = n.name;
            ast.args = n.args;
            ast.callSig = n.callSig;
            ast.reductionStep = n.reductionStep;
            ast.reductionEquation = n.reductionEquation;
            ast.stepEquation = n.stepEquation || n.reductionEquation || n.equation;
            ast.equation = n.equation;
            ast.role = 'Outer Combiner';
            return ast;
        }

        return {
            id: `ast_${++astIdCounter}`,
            nodeId: n.id,
            type: 'composition',
            role: 'Composition',
            operator: n.name,
            label: n.callSig,
            result: n.result,
            funcName: n.name,
            args: n.args,
            reductionStep: n.reductionStep,
            reductionEquation: n.reductionEquation,
            stepEquation: n.stepEquation || n.equation,
            equation: n.equation,
            children: (n.children || []).map(build).filter(Boolean)
        };
    }

    return build(node);
}

