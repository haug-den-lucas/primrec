/**
 * CalcExpressionAstNode component:
 * Renders an expression node in the functional programming Expression / Reduction AST (Option 1).
 * Outer functions wrap inner recursive expressions and arguments as child branches.
 */

export default {
    name: 'CalcExpressionAstNode',
    props: {
        node: { type: Object, required: true },
        selectedNodeId: { type: String, default: null },
        activeStepNodeId: { type: String, default: null },
        activeStepType: { type: String, default: null },
        collapsedNodes: { type: Object, required: true }
    },
    emits: ['select-node', 'toggle-collapse'],
    computed: {
        isSelected() {
            return this.selectedNodeId === (this.node.nodeId || this.node.id);
        },
        isActive() {
            return this.activeStepNodeId === this.node.nodeId;
        },
        isCollapsed() {
            return !!this.collapsedNodes[this.node.id];
        },
        hasChildren() {
            return Array.isArray(this.node.children) && this.node.children.length > 0;
        },
        badgeClass() {
            if (this.node.role === 'Base Case') return 'bg-success text-white';
            if (this.node.role === 'Outer Combiner') return 'bg-secondary text-white';
            if (this.node.role === 'Inner Call') return 'bg-info text-dark';
            if (this.node.role === 'Argument') return 'bg-light text-dark border';
            if (this.node.role === 'Constant') return 'bg-light text-secondary border';
            return 'bg-secondary text-white';
        },
        displayEquation() {
            return this.node.reductionEquation || this.node.stepEquation;
        }
    },
    template: `
        <li :class="{ 'tree-node-has-children': hasChildren }">
            <div class="card bg-white border shadow-sm text-center tree-graph-card"
                 :class="{
                     'border-primary bg-light': isActive && activeStepType === 'call',
                     'border-success bg-light': isActive && activeStepType === 'return',
                     'border-dark': isSelected,
                     'tree-node-has-children': hasChildren
                 }"
                 style="cursor: pointer; min-width: 170px; max-width: 250px;"
                 @click.stop="$emit('select-node', node)">

                <div class="p-2 pb-1">
                    <div class="d-flex justify-content-between align-items-center mb-1 gap-1">
                        <span class="badge" :class="badgeClass" style="font-size: 0.7rem;">
                            {{ node.role }}
                        </span>
                        <div class="d-flex align-items-center gap-1">
                            <span v-if="node.result !== undefined" class="badge bg-success font-monospace" style="font-size: 0.72rem;">
                                = {{ node.result }}
                            </span>
                            <button v-if="hasChildren" type="button"
                                    class="btn btn-sm btn-outline-secondary py-0 px-1 border-0"
                                    style="font-size: 0.7rem; line-height: 1;"
                                    @click.stop="$emit('toggle-collapse', node.id)"
                                    :title="isCollapsed ? 'Expand' : 'Collapse'">
                                {{ isCollapsed ? '+' + node.children.length : '-' }}
                            </button>
                        </div>
                    </div>

                    <div class="font-monospace fw-bold fs-6 text-nowrap my-1">
                        {{ node.operator || node.label }}
                    </div>

                    <div v-if="node.funcName && node.callSig && node.role === 'Outer Combiner'" class="small text-muted font-monospace" style="font-size: 0.72rem;">
                        {{ node.callSig }}
                    </div>
                </div>

                <!-- Reduction Equation Box -->
                <div v-if="displayEquation"
                     class="tree-node-equation px-2 py-1 bg-light border-top text-center font-monospace">
                    <div class="text-muted text-uppercase" style="font-size: 0.6rem; letter-spacing: 0.5px;">
                        Reduction
                    </div>
                    <div class="fw-bold text-dark text-break" style="font-size: 0.74rem; line-height: 1.25;">
                        {{ displayEquation }}
                    </div>
                </div>
            </div>

            <!-- Child branches: inner recursive expressions and arguments -->
            <ul v-if="hasChildren && !isCollapsed">
                <calc-expression-ast-node
                    v-for="child in node.children"
                    :key="child.id"
                    :node="child"
                    :selected-node-id="selectedNodeId"
                    :active-step-node-id="activeStepNodeId"
                    :active-step-type="activeStepType"
                    :collapsed-nodes="collapsedNodes"
                    @select-node="$emit('select-node', $event)"
                    @toggle-collapse="$emit('toggle-collapse', $event)">
                </calc-expression-ast-node>
            </ul>
        </li>
    `
};
