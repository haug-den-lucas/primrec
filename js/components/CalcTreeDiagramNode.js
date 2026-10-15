/**
 * CalcTreeDiagramNode component:
 * Renders a node in a top-down visual 2D tree diagram with connecting branches (Option 2).
 * Explicitly displays roles (Inner Call vs Outer Combiner) to clarify functional data flow.
 */

export default {
    name: 'CalcTreeDiagramNode',
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
            return this.selectedNodeId === this.node.id;
        },
        isActive() {
            return this.activeStepNodeId === this.node.id;
        },
        isCollapsed() {
            return !!this.collapsedNodes[this.node.id];
        },
        hasChildren() {
            return Array.isArray(this.node.children) && this.node.children.length > 0;
        },
        displayRole() {
            return this.node.role || (this.node.stepType === 'base' ? 'Base Case' : 'Call');
        },
        displayEquation() {
            return this.node.reductionEquation || this.node.stepEquation || this.node.equation;
        },
        equationLabel() {
            if (this.node.stepType === 'base') return 'Base Equation';
            if (this.node.stepType === 'step') return 'Reduction';
            if (this.node.stepType === 'composition') return 'Composition';
            return 'Equation';
        },
        roleBadgeClass() {
            if (this.displayRole === 'Base Case') return 'bg-success text-white';
            if (this.displayRole === 'Inner Call') return 'bg-info text-dark';
            if (this.displayRole === 'Outer Combiner') return 'bg-secondary text-white';
            if (this.displayRole === 'Top Call') return 'bg-primary text-white';
            if (this.node.stepType === 'base') return 'bg-success text-white';
            if (this.node.stepType === 'step') return 'bg-primary text-white';
            return 'bg-secondary text-white';
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
                        <span class="badge" :class="roleBadgeClass" style="font-size: 0.7rem;">
                            {{ displayRole }}
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
                        {{ node.callSig || (node.name + '(' + node.args.join(', ') + ')') }}
                    </div>

                    <div v-if="node.roleDescription" class="text-muted small mt-1" style="font-size: 0.68rem; line-height: 1.15;">
                        {{ node.roleDescription }}
                    </div>
                </div>

                <!-- Reduction Equation Box directly at the bottom of the card -->
                <div v-if="displayEquation"
                     class="tree-node-equation px-2 py-1 bg-light border-top text-center font-monospace">
                    <div class="text-muted text-uppercase" style="font-size: 0.6rem; letter-spacing: 0.5px;">
                        {{ equationLabel }}
                    </div>
                    <div class="fw-bold text-dark text-break" style="font-size: 0.74rem; line-height: 1.25;">
                        {{ displayEquation }}
                    </div>
                </div>
            </div>

            <!-- Children branch -->
            <ul v-if="hasChildren && !isCollapsed">
                <calc-tree-diagram-node
                    v-for="child in node.children"
                    :key="child.id"
                    :node="child"
                    :selected-node-id="selectedNodeId"
                    :active-step-node-id="activeStepNodeId"
                    :active-step-type="activeStepType"
                    :collapsed-nodes="collapsedNodes"
                    @select-node="$emit('select-node', $event)"
                    @toggle-collapse="$emit('toggle-collapse', $event)">
                </calc-tree-diagram-node>
            </ul>
        </li>
    `
};
