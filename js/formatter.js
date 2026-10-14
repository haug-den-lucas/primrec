import { getFunctionDefinition } from './data.js';

export function renderFunctionString(node, funcName, params, recDefIndex = -1, isInitStep = false) {
    if (!node) return "";

    const name = node.name;

    if (name === "placeholder") {
        return "+";
    }
    if (name === "const") {
        return String(node.inner);
    }
    if (name === "param") {
        const val = node.inner;
        if (val === recDefIndex && isInitStep) {
            return "0";
        }
        return String.fromCharCode(97 + val);
    }
    if (name === funcName && (!node.inner || node.inner.length === 0)) {
        let args = [];
        for (let i = 0; i < params; i++) {
            args.push(String.fromCharCode(97 + i));
        }
        return `${funcName}(${args.join(", ")})`;
    }

    if (Array.isArray(node.inner)) {
        const children = node.inner.map(child => renderFunctionString(child, funcName, params, recDefIndex, isInitStep));
        return `${name}(${children.join(", ")})`;
    }

    return name;
}

export function renderDefinitionLines(name, funcObj) {
    if (!funcObj) return [];

    const params = funcObj.params;
    const recDefIndex = funcObj.recDefIndex ?? -1;

    if (funcObj.type === 0) {
        // Recursive
        // Init line: e.g. add(a, 0) = b
        let initArgs = [];
        for (let i = 0; i < params; i++) {
            if (i === recDefIndex) {
                initArgs.push("0");
            } else {
                initArgs.push(String.fromCharCode(97 + i));
            }
        }
        const initLhs = `${name}(${initArgs.join(", ")})`;
        const initRhs = renderFunctionString(funcObj.init[0], name, params, recDefIndex, true);

        // Rec step line: e.g. add(a, b+1) = s(add(a, b))
        let recArgs = [];
        for (let i = 0; i < params; i++) {
            if (i === recDefIndex) {
                recArgs.push(`${String.fromCharCode(97 + i)}+1`);
            } else {
                recArgs.push(String.fromCharCode(97 + i));
            }
        }
        const recLhs = `${name}(${recArgs.join(", ")})`;
        const recRhs = renderFunctionString(funcObj.recDef[0], name, params, recDefIndex, false);

        return [
            `${initLhs} = ${initRhs}`,
            `${recLhs} = ${recRhs}`
        ];
    } else {
        // Composed
        let args = [];
        for (let i = 0; i < params; i++) {
            args.push(String.fromCharCode(97 + i));
        }
        const lhs = `${name}(${args.join(", ")})`;
        const rhs = renderFunctionString(funcObj.init[0], name, params);
        return [`${lhs} = ${rhs}`];
    }
}
