/**
 * Component for rendering an interactive, expandable tree node in the calculation tree view.
 */
export default {
    name: 'CalcTreeNode',
    props: {
        node: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            collapsed: false
        };
    },
    computed: {
        hasChildren() {
            return Array.isArray(this.node.children) && this.node.children.length > 0;
        },
        badgeClass() {
            if (this.node.type === 'function') return 'bg-primary text-white';
            if (this.node.type === 'step') return 'bg-info text-dark';
            if (this.node.type === 'recSelf') return 'bg-secondary text-white';
            if (this.node.type === 'leaf') return 'bg-light text-dark border';
            return 'bg-secondary text-white';
        }
    },
    methods: {
        toggleCollapse() {
            if (this.hasChildren) {
                this.collapsed = !this.collapsed;
            }
        }
    },
    template: `
        <div class="calc-tree-node-wrapper d-flex flex-column align-items-center">
            <div class="calc-tree-card card shadow-sm mb-2"
                 :class="{ 'cursor-pointer': hasChildren }"
                 @click.stop="toggleCollapse">
                <div class="card-body p-2 px-3 d-flex align-items-center gap-2">
                    <span v-if="hasChildren" class="badge bg-light text-dark border p-1" style="font-size: 0.75rem;">
                        {{ collapsed ? '+' : '−' }}
                    </span>
                    <span class="badge font-monospace fs-6" :class="badgeClass">
                        {{ node.expr }}
                    </span>
                    <span v-if="node.label && !node.expr.startsWith(node.label)" class="text-muted small">
                        ({{ node.label }})
                    </span>
                </div>
            </div>

            <div v-if="hasChildren && !collapsed" class="calc-tree-children-container d-flex flex-row justify-content-center pt-3 position-relative">
                <div v-for="(child, idx) in node.children" :key="idx" class="calc-tree-child-item px-3 position-relative">
                    <calc-tree-node :node="child"></calc-tree-node>
                </div>
            </div>
        </div>
    `
};
