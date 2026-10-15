/**
 * Recursive tree node component for the Primitive Recursion calculation tree.
 * Displays roles (Inner Call vs Outer Combiner) in the nested list view.
 */

export default {
    name: 'CalcTreeNodeItem',
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
        <div class="mb-2">
            <div class="card p-2 bg-white border"
                 :class="{
                     'border-primary bg-light': isActive && activeStepType === 'call',
                     'border-success bg-light': isActive && activeStepType === 'return',
                     'border-dark': isSelected
                 }"
                 style="cursor: pointer;"
                 @click.stop="$emit('select-node', node)">

                <div class="d-flex align-items-center flex-wrap gap-2">
                    <span class="badge" :class="roleBadgeClass">{{ displayRole }}</span>
                    <span class="font-monospace fw-bold">{{ node.name }}({{ node.args.join(', ') }})</span>

                    <span v-if="node.result !== undefined" class="badge bg-success font-monospace ms-auto">
                        = {{ node.result }}
                    </span>

                    <button v-if="hasChildren"
                            type="button"
                            class="btn btn-sm btn-outline-secondary py-0 px-2"
                            @click.stop="$emit('toggle-collapse', node.id)"
                            :title="isCollapsed ? 'Expand' : 'Collapse'">
                        {{ isCollapsed ? '+' : '-' }}
                    </button>
                </div>

                <div class="text-muted small mt-1" v-if="node.roleDescription" style="font-size: 0.75rem;">
                    {{ node.roleDescription }}
                </div>

                <div class="text-muted font-monospace small mt-1" v-if="node.equation">
                    {{ node.equation }}
                </div>
                <div class="text-secondary small mt-1" v-else-if="node.rule">
                    {{ node.rule }}
                </div>
            </div>

            <!-- Sub-tree branches -->
            <div class="calc-tree-children" v-if="hasChildren && !isCollapsed">
                <calc-tree-node-item
                    v-for="child in node.children"
                    :key="child.id"
                    :node="child"
                    :selected-node-id="selectedNodeId"
                    :active-step-node-id="activeStepNodeId"
                    :active-step-type="activeStepType"
                    :collapsed-nodes="collapsedNodes"
                    @select-node="$emit('select-node', $event)"
                    @toggle-collapse="$emit('toggle-collapse', $event)">
                </calc-tree-node-item>
            </div>
        </div>
    `
};
