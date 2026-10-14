/**
 * Vue 3 Application module for Primitive Recursive Simulator.
 */

import {
    PREDEFINED_FUNCTIONS,
    PREDEFINED_FUNCTION_KEYS,
    getUserFunctions,
    setUserFunctions,
    getFunctionDefinition,
    loadFunctionsFromStorage,
    saveFunctionsToStorage
} from './data.js';

import { calculate, clearCalcCache } from './calc.js';
import { renderDefinitionLines } from './formatter.js';
import TreeNode from './components/TreeNode.js';
import AddFunctionModal from './components/AddFunctionModal.js';
import ChooseTypeModal from './components/ChooseTypeModal.js';
import ChooseFunctionModal from './components/ChooseFunctionModal.js';

const { createApp, ref, computed, onMounted } = Vue;

createApp({
    components: {
        TreeNode,
        AddFunctionModal,
        ChooseTypeModal,
        ChooseFunctionModal
    },
    setup() {
        // --- State ---
        const userFuncs = ref({});
        const selectedFuncName = ref(null);
        const inputParams = ref([]);
        const calculationResult = ref(null);
        const calculationError = ref(null);
        const jsonCodeArea = ref("");

        // Creation Wizard State
        const wizardStep = ref(1); // 1: meta, 2: recParam / init, 3: recDef
        const newFuncName = ref("");
        const newParamCount = ref(1);
        const newFuncType = ref(1); // 1: composed, 0: recursive
        const newRecIndex = ref(-1);

        const newInit = ref([{ name: "placeholder", inner: 0 }]);
        const newRecDef = ref([{ name: "placeholder", inner: 0 }]);

        // Inner Choice Modal State
        const currentlyTargetPlaceholder = ref(null);

        // Modals references
        let addFuncModalInstance = null;
        let chooseTypeModalInstance = null;
        let chooseFuncModalInstance = null;

        // --- Computed ---
        const allPredefinedKeys = computed(() => Object.keys(PREDEFINED_FUNCTIONS));

        const userFuncKeys = computed(() => Object.keys(userFuncs.value));

        const currentFuncObj = computed(() => {
            if (!selectedFuncName.value) return null;
            return getFunctionDefinition(selectedFuncName.value);
        });

        const isPredefinedSelected = computed(() => {
            return selectedFuncName.value && PREDEFINED_FUNCTION_KEYS.includes(selectedFuncName.value);
        });

        const definitionLines = computed(() => {
            if (!selectedFuncName.value || !currentFuncObj.value) return [];
            return renderDefinitionLines(selectedFuncName.value, currentFuncObj.value);
        });

        // --- Methods ---
        const initModals = () => {
            const addEl = document.getElementById('addFunctionModal');
            if (addEl) addFuncModalInstance = new bootstrap.Modal(addEl);

            const typeEl = document.getElementById('chooseTypeModal');
            if (typeEl) chooseTypeModalInstance = new bootstrap.Modal(typeEl);

            const funcEl = document.getElementById('chooseFunctionModal');
            if (funcEl) chooseFuncModalInstance = new bootstrap.Modal(funcEl);
        };

        const loadFromStorage = () => {
            userFuncs.value = loadFunctionsFromStorage();
            updateJsonCodeArea();
        };

        const updateJsonCodeArea = () => {
            jsonCodeArea.value = JSON.stringify(userFuncs.value, null, 2);
        };

        const saveToStorage = () => {
            setUserFunctions(userFuncs.value);
            saveFunctionsToStorage();
            updateJsonCodeArea();
            clearCalcCache();
        };

        const loadCodeFromJson = () => {
            try {
                const parsed = JSON.parse(jsonCodeArea.value);
                if (parsed && typeof parsed === 'object') {
                    PREDEFINED_FUNCTION_KEYS.forEach(k => delete parsed[k]);
                    userFuncs.value = parsed;
                    saveToStorage();
                    alert("Code successfully loaded!");
                } else {
                    alert("Invalid JSON format.");
                }
            } catch (err) {
                alert("Error parsing JSON: " + err.message);
            }
        };

        const selectFunction = (name) => {
            selectedFuncName.value = name;
            calculationResult.value = null;
            calculationError.value = null;

            const func = getFunctionDefinition(name);
            if (func) {
                inputParams.value = new Array(func.params).fill(0);
            }
        };

        const deleteSelectedFunction = () => {
            if (!selectedFuncName.value || isPredefinedSelected.value) return;

            if (confirm("If you delete this function, any functions depending on it may break. Are you sure?")) {
                delete userFuncs.value[selectedFuncName.value];
                selectedFuncName.value = null;
                calculationResult.value = null;
                calculationError.value = null;
                saveToStorage();
            }
        };

        const runCalculation = () => {
            if (!selectedFuncName.value) return;
            if (inputParams.value.some(v => v === null || v === "" || isNaN(v) || v < 0)) {
                alert("Please enter valid non-negative integer values for all parameters.");
                return;
            }

            try {
                calculationError.value = null;
                calculationResult.value = calculate(selectedFuncName.value, inputParams.value);
            } catch (err) {
                calculationError.value = err.message;
                calculationResult.value = null;
            }
        };

        // --- Helper formatting for header / equations ---
        const getFunctionSignature = (name, params, recDefIdx = -1, isInit = false) => {
            let sig = `${name}(`;
            for (let i = 0; i < params; i++) {
                if (i === recDefIdx) {
                    sig += isInit ? "0" : `${String.fromCharCode(97 + i)}+1`;
                } else {
                    sig += String.fromCharCode(97 + i);
                }
                if (i < params - 1) sig += ", ";
            }
            return sig + ")";
        };

        // --- Wizard Methods ---
        const openCreateModal = () => {
            newFuncName.value = "";
            newParamCount.value = 1;
            newFuncType.value = 1;
            newRecIndex.value = -1;
            wizardStep.value = 1;
            newInit.value = [{ name: "placeholder", inner: 0 }];
            newRecDef.value = [{ name: "placeholder", inner: 0 }];

            if (addFuncModalInstance) addFuncModalInstance.show();
        };

        const wizardNextStep1 = () => {
            const name = newFuncName.value.trim();
            if (!name) {
                alert("Please enter a function name.");
                return;
            }
            if (PREDEFINED_FUNCTION_KEYS.includes(name) || (name in userFuncs.value)) {
                alert("A function with this name already exists.");
                return;
            }
            if (!newParamCount.value || newParamCount.value <= 0) {
                alert("Please enter a valid number of parameters (> 0).");
                return;
            }

            if (newFuncType.value === 0) {
                wizardStep.value = 2; // select recParam & init
                newRecIndex.value = -1;
            } else {
                wizardStep.value = 3; // final definition
            }
        };

        const selectRecParam = (idx) => {
            newRecIndex.value = idx;
            newInit.value = [{ name: "placeholder", inner: 0 }];
        };

        const wizardNextStep2 = () => {
            if (newFuncType.value === 0 && newRecIndex.value === -1) {
                alert("Please select the recursion parameter.");
                return;
            }
            wizardStep.value = 3;
        };

        // Tree placeholder click
        const openChoiceModal = (node) => {
            currentlyTargetPlaceholder.value = node;
            if (chooseTypeModalInstance) chooseTypeModalInstance.show();
        };

        const chooseInnerType = (type, paramIdx) => {
            if (!currentlyTargetPlaceholder.value) return;

            if (type === 'constant') {
                currentlyTargetPlaceholder.value.name = "const";
                currentlyTargetPlaceholder.value.inner = 0;
                if (chooseTypeModalInstance) chooseTypeModalInstance.hide();
            } else if (type === 'param') {
                let parsed = paramIdx;
                if (parsed === undefined || parsed === null) {
                    const val = prompt(`Enter parameter index (1 to ${newParamCount.value}):`);
                    if (val === null) return;
                    parsed = parseInt(val, 10) - 1;
                }
                if (isNaN(parsed) || parsed < 0 || parsed >= newParamCount.value) {
                    alert("Invalid parameter index.");
                    return;
                }
                currentlyTargetPlaceholder.value.name = "param";
                currentlyTargetPlaceholder.value.inner = parsed;
                if (chooseTypeModalInstance) chooseTypeModalInstance.hide();
            } else if (type === 'succ') {
                currentlyTargetPlaceholder.value.name = "s";
                currentlyTargetPlaceholder.value.inner = [{ name: "placeholder", inner: 0 }];
                if (chooseTypeModalInstance) chooseTypeModalInstance.hide();
            } else if (type === 'recDef') {
                currentlyTargetPlaceholder.value.name = newFuncName.value.trim();
                delete currentlyTargetPlaceholder.value.inner;
                if (chooseTypeModalInstance) chooseTypeModalInstance.hide();
            } else if (type === 'function') {
                if (chooseTypeModalInstance) chooseTypeModalInstance.hide();
                if (chooseFuncModalInstance) chooseFuncModalInstance.show();
            }
        };

        const selectInnerFunction = (funcKey) => {
            if (!currentlyTargetPlaceholder.value) return;

            const funcDef = getFunctionDefinition(funcKey);
            const paramCount = funcDef ? funcDef.params : 1;

            const newInner = [];
            for (let i = 0; i < paramCount; i++) {
                newInner.push({ name: "placeholder", inner: 0 });
            }

            currentlyTargetPlaceholder.value.name = funcKey;
            currentlyTargetPlaceholder.value.inner = newInner;

            if (chooseFuncModalInstance) chooseFuncModalInstance.hide();
        };

        const finishCreateFunction = () => {
            const name = newFuncName.value.trim();
            const toAdd = {
                params: newParamCount.value,
                type: newFuncType.value,
                init: newInit.value
            };

            if (newFuncType.value === 0) {
                toAdd.recDefIndex = newRecIndex.value;
                toAdd.recDef = newRecDef.value;
            }

            userFuncs.value[name] = toAdd;
            saveToStorage();

            if (addFuncModalInstance) addFuncModalInstance.hide();
            selectFunction(name);
        };

        onMounted(() => {
            initModals();
            loadFromStorage();
        });

        return {
            userFuncs,
            selectedFuncName,
            inputParams,
            calculationResult,
            calculationError,
            jsonCodeArea,

            wizardStep,
            newFuncName,
            newParamCount,
            newFuncType,
            newRecIndex,
            newInit,
            newRecDef,

            allPredefinedKeys,
            userFuncKeys,
            currentFuncObj,
            isPredefinedSelected,
            definitionLines,

            loadCodeFromJson,
            selectFunction,
            deleteSelectedFunction,
            runCalculation,
            getFunctionSignature,

            openCreateModal,
            wizardNextStep1,
            selectRecParam,
            wizardNextStep2,
            openChoiceModal,
            chooseInnerType,
            selectInnerFunction,
            finishCreateFunction
        };
    }
}).mount('#app');
