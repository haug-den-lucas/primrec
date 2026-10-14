/**
 * Component for rendering an interactive, expandable tree node in the calculation tree view.
 * Each node renders two lines:
 *   Line 1: Symbolic definition (formula)
 *   Line 2: Concrete valuation with underlined sub-expression
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
                <div class="card-body p-2 px-3 text-start">
                    <div class="d-flex align-items-center justify-content-between gap-2 mb-1 border-bottom pb-1">
                        <span class="text-primary font-monospace fw-bold small">
                            {{ node.symbolicLine }}
                        </span>
                        <span v-if="hasChildren" class="badge bg-light text-dark border p-1" style="font-size: 0.7rem;">
                            {{ collapsed ? '+' : '−' }}
                        </span>
                    </div>
                    <div class="font-monospace fs-6 text-dark" v-html="node.concreteLine"></div>
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
