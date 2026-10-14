export default {
    name: 'ChooseTypeModal',
    props: {
        newFuncType: { type: Number, required: true },
        wizardStep: { type: Number, required: true },
        newFuncName: { type: String, required: true },
        newParamCount: { type: Number, default: 1 }
    },
    emits: ['choose-type'],
    data() {
        return {
            showParamPicker: false
        };
    },
    methods: {
        selectParam(idx) {
            this.showParamPicker = false;
            this.$emit('choose-type', 'param', idx);
        },
        resetState() {
            this.showParamPicker = false;
        }
    },
    template: `
    <div class="modal fade" id="chooseTypeModal" tabindex="-1" aria-labelledby="chooseTypeModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="chooseTypeModalLabel">
                        {{ showParamPicker ? 'Select Parameter Variable' : 'Choose Expression Component' }}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="resetState"></button>
                </div>
                <div class="modal-body">
                    <template v-if="showParamPicker">
                        <div class="d-grid gap-2">
                            <button v-for="i in newParamCount" :key="i - 1" type="button"
                                    class="btn btn-outline-primary fs-5 py-2 fw-bold"
                                    @click="selectParam(i - 1)">
                                Parameter {{ String.fromCharCode(96 + i) }} (Index {{ i }})
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary mt-2" @click="showParamPicker = false">
                                &laquo; Back
                            </button>
                        </div>
                    </template>
                    <template v-else>
                        <div class="list-group">
                            <button type="button" class="list-group-item list-group-item-action" @click="$emit('choose-type', 'constant')">
                                Constant Number
                            </button>
                            <button type="button" class="list-group-item list-group-item-action" @click="showParamPicker = true">
                                Parameter Variable
                            </button>
                            <button type="button" class="list-group-item list-group-item-action" @click="$emit('choose-type', 'succ')">
                                Successor Function s(n) = n + 1
                            </button>
                            <button type="button" class="list-group-item list-group-item-action" @click="$emit('choose-type', 'function')">
                                Existing Function
                            </button>
                            <button v-if="newFuncType === 0 && wizardStep === 3" type="button" class="list-group-item list-group-item-action list-group-item-warning" @click="$emit('choose-type', 'recDef')">
                                Recursive Self-Call ({{ newFuncName }})
                            </button>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
    `
};
