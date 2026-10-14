import TreeNode from './TreeNode.js';

export default {
    name: 'AddFunctionModal',
    components: { TreeNode },
    props: {
        wizardStep: { type: Number, required: true },
        newFuncName: { type: String, required: true },
        newParamCount: { type: Number, required: true },
        newFuncType: { type: Number, required: true },
        newRecIndex: { type: Number, required: true },
        newInit: { type: Array, required: true },
        newRecDef: { type: Array, required: true },
        getFunctionSignature: { type: Function, required: true }
    },
    emits: [
        'update:newFuncName',
        'update:newParamCount',
        'update:newFuncType',
        'wizard-next-1',
        'wizard-next-2',
        'select-rec-param',
        'open-choice',
        'finish'
    ],
    template: `
    <div class="modal fade" id="addFunctionModal" tabindex="-1" aria-labelledby="addFunctionModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="addFunctionModalLabel">
                        Create Function - Step {{ wizardStep }} of {{ newFuncType === 0 ? 3 : 2 }}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <!-- Step 1: Function Name, Parameters, and Type -->
                <div class="modal-body" v-if="wizardStep === 1">
                    <form @submit.prevent="$emit('wizard-next-1')">
                        <div class="mb-3 row">
                            <label for="newName" class="col-sm-3 col-form-label fw-bold">Name</label>
                            <div class="col-sm-9">
                                <input type="text" class="form-control" id="newName"
                                       :value="newFuncName"
                                       @input="$emit('update:newFuncName', $event.target.value)"
                                       placeholder="Function Name (e.g. sqr)">
                            </div>
                        </div>
                        <div class="mb-3 row">
                            <label for="newParams" class="col-sm-3 col-form-label fw-bold">Parameters</label>
                            <div class="col-sm-9">
                                <input type="number" min="1" class="form-control" id="newParams"
                                       :value="newParamCount"
                                       @input="$emit('update:newParamCount', parseInt($event.target.value, 10))"
                                       placeholder="Number of parameters">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">How is your function defined?</label>
                            <div class="list-group">
                                <label class="list-group-item cursor-pointer" :class="{ 'active': newFuncType === 1 }">
                                    <input class="form-check-input me-1" type="radio" :value="1"
                                           :checked="newFuncType === 1"
                                           @change="$emit('update:newFuncType', 1)">
                                    Composed strictly from other functions
                                </label>
                                <label class="list-group-item cursor-pointer" :class="{ 'active': newFuncType === 0 }">
                                    <input class="form-check-input me-1" type="radio" :value="0"
                                           :checked="newFuncType === 0"
                                           @change="$emit('update:newFuncType', 0)">
                                    Recursively defined
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Step 2 (Recursive only): Select Recursion Parameter -->
                <div class="modal-body" v-if="wizardStep === 2 && newFuncType === 0">
                    <div class="mb-3 text-center">
                        <label class="form-label fw-bold mb-2">Click on the parameter you want to recurse on:</label>
                        <div class="p-4 bg-light rounded font-monospace fs-4 border d-flex align-items-center justify-content-center gap-1">
                            <span class="fw-bold text-primary">{{ newFuncName || 'func' }}(</span>
                            <template v-for="i in newParamCount" :key="i - 1">
                                <button type="button"
                                        class="btn btn-lg mx-1 fw-bold"
                                        :class="newRecIndex === (i - 1) ? 'btn-primary shadow-sm' : 'btn-outline-primary'"
                                        @click="$emit('select-rec-param', i - 1)">
                                    {{ String.fromCharCode(96 + i) }}
                                </button>
                                <span v-if="i < newParamCount" class="fw-bold text-muted">,</span>
                            </template>
                            <span class="fw-bold text-primary">)</span>
                        </div>
                        <p class="text-muted small mt-2">Selected parameter will be used for step-down recursion (e.g. 0 base case and n+1 step case).</p>
                    </div>
                </div>

                <!-- Step 2 (Composite) / Step 3 (Recursive): Interactive Tree Definition -->
                <div class="modal-body" v-if="(newFuncType === 1 && wizardStep === 2) || (newFuncType === 0 && wizardStep === 3)">
                    <label class="form-label fw-bold">Define Function Expression:</label>

                    <div v-if="newFuncType === 0" class="mb-3 p-3 bg-light rounded">
                        <div class="fw-semibold text-muted mb-1">Base Step:</div>
                        <code>
                            {{ getFunctionSignature(newFuncName, newParamCount, newRecIndex, true) }} =
                            <tree-node :node="newInit[0]" :func-name="newFuncName" :param-count="newParamCount" :rec-def-index="newRecIndex" :is-init="true" @open-choice="$emit('open-choice', $event)"></tree-node>
                        </code>

                        <div class="fw-semibold text-muted mt-3 mb-1">Recursive Step:</div>
                        <code>
                            {{ getFunctionSignature(newFuncName, newParamCount, newRecIndex, false) }} =
                            <tree-node :node="newRecDef[0]" :func-name="newFuncName" :param-count="newParamCount" :rec-def-index="newRecIndex" :is-init="false" @open-choice="$emit('open-choice', $event)"></tree-node>
                        </code>
                    </div>

                    <div v-else class="p-3 bg-light rounded">
                        <code>
                            {{ getFunctionSignature(newFuncName, newParamCount) }} =
                            <tree-node :node="newInit[0]" :func-name="newFuncName" :param-count="newParamCount" @open-choice="$emit('open-choice', $event)"></tree-node>
                        </code>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button v-if="wizardStep === 1" type="button" class="btn btn-primary" @click="$emit('wizard-next-1')">Next</button>
                    <button v-if="newFuncType === 0 && wizardStep === 2" type="button" class="btn btn-primary" @click="$emit('wizard-next-2')">Next</button>
                    <button v-if="(newFuncType === 1 && wizardStep === 2) || (newFuncType === 0 && wizardStep === 3)" type="button" class="btn btn-success" @click="$emit('finish')">Finish</button>
                </div>
            </div>
        </div>
    </div>
    `
};
