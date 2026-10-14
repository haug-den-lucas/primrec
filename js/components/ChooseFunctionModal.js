export default {
    name: 'ChooseFunctionModal',
    props: {
        allPredefinedKeys: { type: Array, required: true },
        userFuncKeys: { type: Array, required: true }
    },
    emits: ['select-inner-function'],
    template: `
    <div class="modal fade" id="chooseFunctionModal" tabindex="-1" aria-labelledby="chooseFunctionModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="chooseFunctionModalLabel">Select Function</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="list-group">
                        <button v-for="key in allPredefinedKeys" :key="key" type="button" class="list-group-item list-group-item-action" @click="$emit('select-inner-function', key)">
                            {{ key }}
                        </button>
                        <button v-for="key in userFuncKeys" :key="key" type="button" class="list-group-item list-group-item-action" @click="$emit('select-inner-function', key)">
                            {{ key }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};
