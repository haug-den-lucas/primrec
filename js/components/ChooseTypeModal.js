export default {
    name: 'ChooseTypeModal',
    props: {
        newFuncType: { type: Number, required: true },
        wizardStep: { type: Number, required: true },
        newFuncName: { type: String, required: true }
    },
    emits: ['choose-type'],
    template: `
    <div class="modal fade" id="chooseTypeModal" tabindex="-1" aria-labelledby="chooseTypeModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="chooseTypeModalLabel">Choose Expression Component</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="list-group">
                        <button type="button" class="list-group-item list-group-item-action" @click="$emit('choose-type', 'constant')">
                            Constant Number
                        </button>
                        <button type="button" class="list-group-item list-group-item-action" @click="$emit('choose-type', 'param')">
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
                </div>
            </div>
        </div>
    </div>
    `
};
