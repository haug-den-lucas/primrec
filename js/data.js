/**
 * Functions storage and definitions module for Primitive Recursive Simulator.
 */

export const PREDEFINED_FUNCTION_KEYS = ["s", "param", "const", "placeholder", "add", "mult"];

export const PREDEFINED_FUNCTIONS = {
    add: {
        params: 2,
        type: 0, // 0 = recursive, 1 = composition
        init: [{ name: "param", inner: 1 }],
        recDefIndex: 0,
        recDef: [{ name: "s", inner: [{ name: "add" }] }]
    },
    mult: {
        params: 2,
        type: 0,
        init: [{ name: "param", inner: 0 }],
        recDefIndex: 0,
        recDef: [{ name: "add", inner: [{ name: "mult" }, { name: "param", inner: 1 }] }]
    }
};

let userFunctions = {};

export function getUserFunctions() {
    return userFunctions;
}

export function setUserFunctions(newFuncs) {
    userFunctions = newFuncs || {};
}

export function getFunctionDefinition(key) {
    if (key in PREDEFINED_FUNCTIONS) {
        return PREDEFINED_FUNCTIONS[key];
    }
    return userFunctions[key];
}

export function loadFunctionsFromStorage() {
    try {
        const stored = localStorage.getItem("json");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed === "object") {
                PREDEFINED_FUNCTION_KEYS.forEach(key => delete parsed[key]);
                userFunctions = parsed;
            }
        }
    } catch (e) {
        console.error("Failed to load functions from localStorage", e);
    }
    return userFunctions;
}

export function saveFunctionsToStorage() {
    try {
        const jsonString = JSON.stringify(userFunctions);
        localStorage.setItem("json", jsonString);
        return jsonString;
    } catch (e) {
        console.error("Failed to save functions to localStorage", e);
        return "{}";
    }
}
