/**
 * CalculationTreeView component:
 * Clean Bootstrap 5 visualizer with:
 * - Option 1: Expression AST (Functional Programming Reduction Tree)
 * - Option 2: Call Tree with Labeled Roles (Inner Call vs Outer Combiner)
 * - Nested List, Algebraic Derivations, Execution Trace, and Stepper.
 */

import CalcTreeNodeItem from './CalcTreeNodeItem.js';
import CalcTreeDiagramNode from './CalcTreeDiagramNode.js';
import CalcExpressionAstNode from './CalcExpressionAstNode.js';

const { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;

export default {
    name: 'CalculationTreeView',
    components: {
        CalcTreeNodeItem,
        CalcTreeDiagramNode,
        CalcExpressionAstNode
    },
    props: {
        treeData: { type: Object, default: null },
        funcName: { type: String, default: '' }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const activeTab = ref('diagram'); // 'diagram' | 'expression' | 'tree' | 'trace'
        const selectedNode = ref(null);
        const collapsedNodes = ref({});
        const zoomLevel = ref(1.0);
        const diagramViewport = ref(null);
        const expressionViewport = ref(null);

        // Stepper state
        const currentStepIndex = ref(-1);
        const isPlaying = ref(false);
        const playbackSpeed = ref(800);
        let timer = null;

        const trace = computed(() => {
            return props.treeData && props.treeData.trace ? props.treeData.trace : [];
        });

        const stats = computed(() => {
            return props.treeData && props.treeData.stats ? props.treeData.stats : {
                totalCalls: 0,
                maxDepth: 0,
                baseCases: 0,
                stepCases: 0
            };
        });

        const currentStep = computed(() => {
            if (currentStepIndex.value >= 0 && currentStepIndex.value < trace.value.length) {
                return trace.value[currentStepIndex.value];
            }
            return null;
        });

        const activeStepNodeId = computed(() => {
            return currentStep.value ? currentStep.value.nodeId : null;
        });

        const activeStepType = computed(() => {
            return currentStep.value ? currentStep.value.type : null;
        });

        const stopPlayback = () => {
            isPlaying.value = false;
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };

        const goToStep = (index) => {
            if (index < 0) {
                currentStepIndex.value = -1;
                selectedNode.value = props.treeData ? props.treeData.root : null;
                return;
            }
            if (index >= trace.value.length) {
                currentStepIndex.value = trace.value.length - 1;
                stopPlayback();
                return;
            }

            currentStepIndex.value = index;
            const step = trace.value[index];
            if (step && step.node) {
                selectedNode.value = step.node;
                if (collapsedNodes.value[step.nodeId]) {
                    collapsedNodes.value[step.nodeId] = false;
                }
                setTimeout(() => {
                    const activeEl = document.querySelector('.tree-graph-card.border-primary, .tree-graph-card.border-success');
                    if (activeEl) {
                        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    }
                }, 50);
            }
        };

        const stepForward = () => {
            if (currentStepIndex.value < trace.value.length - 1) {
                goToStep(currentStepIndex.value + 1);
            } else {
                stopPlayback();
            }
        };

        const stepBackward = () => {
            if (currentStepIndex.value > 0) {
                goToStep(currentStepIndex.value - 1);
            } else {
                goToStep(-1);
            }
        };

        const togglePlay = () => {
            if (isPlaying.value) {
                stopPlayback();
            } else {
                if (currentStepIndex.value >= trace.value.length - 1) {
                    currentStepIndex.value = -1;
                }
                isPlaying.value = true;
                stepForward();
                timer = setInterval(() => {
                    if (currentStepIndex.value < trace.value.length - 1) {
                        stepForward();
                    } else {
                        stopPlayback();
                    }
                }, playbackSpeed.value);
            }
        };

        const resetStepper = () => {
            stopPlayback();
            goToStep(-1);
        };

        const changeSpeed = (ms) => {
            playbackSpeed.value = ms;
            if (isPlaying.value) {
                stopPlayback();
                togglePlay();
            }
        };

        const zoomIn = () => {
            zoomLevel.value = Math.min(Math.round((zoomLevel.value + 0.15) * 100) / 100, 2.0);
        };

        const zoomOut = () => {
            zoomLevel.value = Math.max(Math.round((zoomLevel.value - 0.15) * 100) / 100, 0.4);
        };

        const resetZoom = () => {
            zoomLevel.value = 1.0;
        };

        const toggleCollapse = (nodeId) => {
            collapsedNodes.value[nodeId] = !collapsedNodes.value[nodeId];
        };

        const expandAll = () => {
            collapsedNodes.value = {};
        };

        const collapseAll = () => {
            const map = {};
            function walk(node) {
                if (node.children && node.children.length > 0) {
                    map[node.id] = true;
                    node.children.forEach(walk);
                }
            }
            if (props.treeData) {
                if (props.treeData.root && props.treeData.root.children) {
                    props.treeData.root.children.forEach(walk);
                }
                if (props.treeData.expressionAst && props.treeData.expressionAst.children) {
                    props.treeData.expressionAst.children.forEach(walk);
                }
            }
            collapsedNodes.value = map;
        };

        const selectNode = (node) => {
            selectedNode.value = node;
        };

        const scrollToRootNode = () => {
            nextTick(() => {
                setTimeout(() => {
                    let activeViewport = null;
                    if (activeTab.value === 'diagram') {
                        activeViewport = diagramViewport.value;
                    } else if (activeTab.value === 'expression') {
                        activeViewport = expressionViewport.value;
                    }

                    if (activeViewport) {
                        const rootCard = activeViewport.querySelector('ul > li > .tree-graph-card');
                        if (rootCard) {
                            const viewportWidth = activeViewport.clientWidth;
                            const cardOffsetLeft = rootCard.offsetLeft;
                            const cardWidth = rootCard.offsetWidth;
                            const targetScrollLeft = cardOffsetLeft - (viewportWidth / 2) + (cardWidth / 2);
                            activeViewport.scrollTo({
                                left: Math.max(0, targetScrollLeft),
                                top: 0,
                                behavior: 'smooth'
                            });

                            const rect = rootCard.getBoundingClientRect();
                            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                            if (rect.top < 60 || rect.bottom > windowHeight) {
                                rootCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            return;
                        }
                    }

                    const treeContainer = document.querySelector('.card.mt-4.border');
                    if (treeContainer) {
                        const rect = treeContainer.getBoundingClientRect();
                        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                        if (rect.top < 60 || rect.bottom > windowHeight) {
                            treeContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                }, 120);
            });
        };

        onMounted(() => {
            scrollToRootNode();
        });

        watch(() => props.treeData, (newTree) => {
            stopPlayback();
            currentStepIndex.value = -1;
            collapsedNodes.value = {};
            zoomLevel.value = 1.0;
            if (newTree && newTree.root) {
                selectedNode.value = newTree.root;
            } else {
                selectedNode.value = null;
            }
            scrollToRootNode();
        }, { immediate: true });

        watch(activeTab, (tab) => {
            if (tab === 'expression' || tab === 'diagram') {
                scrollToRootNode();
            }
        });

        onBeforeUnmount(() => {
            stopPlayback();
        });

        const zoomStyle = computed(() => {
            const isZoomSupported = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '1');
            if (isZoomSupported) {
                return { zoom: zoomLevel.value };
            }
            return {
                transform: `scale(${zoomLevel.value})`,
                transformOrigin: 'top center'
            };
        });

        return {
            activeTab,
            selectedNode,
            collapsedNodes,
            zoomLevel,
            zoomStyle,
            diagramViewport,
            expressionViewport,
            currentStepIndex,
            currentStep,
            activeStepNodeId,
            activeStepType,
            isPlaying,
            playbackSpeed,
            trace,
            stats,

            stepForward,
            stepBackward,
            togglePlay,
            resetStepper,
            changeSpeed,
            zoomIn,
            zoomOut,
            resetZoom,
            goToStep,
            toggleCollapse,
            expandAll,
            collapseAll,
            selectNode,
            scrollToRootNode
        };
    },
    template: `
        <div class="card mt-4 border">
            <!-- Header -->
            <div class="card-header bg-light d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
                <div>
                    <h5 class="mb-0 text-dark fw-bold">Calculation Tree</h5>
                    <div class="text-muted small">
                        Visualizing primitive recursion evaluation and function nesting for {{ funcName }}.
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <div class="d-flex flex-wrap gap-1" v-if="treeData">
                        <span class="badge bg-light text-dark border">Calls: {{ stats.totalCalls }}</span>
                        <span class="badge bg-light text-dark border">Depth: {{ stats.maxDepth }}</span>
                        <span class="badge bg-light text-success border">Base: {{ stats.baseCases }}</span>
                        <span class="badge bg-light text-primary border">Steps: {{ stats.stepCases }}</span>
                    </div>
                    <button type="button" class="btn-close ms-2" @click="$emit('close')" aria-label="Close"></button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="card-header bg-white border-bottom p-0">
                <ul class="nav nav-tabs px-3 pt-2 border-bottom-0">
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'diagram' }" @click="activeTab = 'diagram'">
                            Call Tree
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'expression' }" @click="activeTab = 'expression'">
                            Expression AST
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'tree' }" @click="activeTab = 'tree'">
                            Nested List
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'trace' }" @click="activeTab = 'trace'">
                            Execution Trace ({{ trace.length }})
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Stepper Controls Bar -->
            <div class="card-body bg-light border-bottom py-2 px-3" v-if="treeData && trace.length > 0">
                <div class="row align-items-center g-2">
                    <div class="col-auto d-flex align-items-center gap-1">
                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="resetStepper">
                            Reset
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="stepBackward" :disabled="currentStepIndex < 0">
                            Previous
                        </button>
                        <button type="button" class="btn btn-sm btn-primary" @click="togglePlay">
                            {{ isPlaying ? 'Pause' : 'Play' }}
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" @click="stepForward" :disabled="currentStepIndex >= trace.length - 1">
                            Next
                        </button>
                    </div>

                    <div class="col">
                        <div class="d-flex align-items-center gap-2">
                            <span class="small text-muted text-nowrap">
                                Step {{ currentStepIndex + 1 }} / {{ trace.length }}
                            </span>
                            <div class="progress flex-grow-1" style="height: 6px; cursor: pointer;"
                                 @click="goToStep(Math.floor(($event.offsetX / $event.currentTarget.offsetWidth) * trace.length))">
                                <div class="progress-bar bg-primary" role="progressbar"
                                     :style="{ width: ((currentStepIndex + 1) / trace.length * 100) + '%' }"></div>
                            </div>
                        </div>
                    </div>

                    <div class="col-auto d-flex align-items-center gap-2">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn" :class="playbackSpeed === 1500 ? 'btn-secondary text-white' : 'btn-outline-secondary'" @click="changeSpeed(1500)">0.5x</button>
                            <button type="button" class="btn" :class="playbackSpeed === 800 ? 'btn-secondary text-white' : 'btn-outline-secondary'" @click="changeSpeed(800)">1x</button>
                            <button type="button" class="btn" :class="playbackSpeed === 300 ? 'btn-secondary text-white' : 'btn-outline-secondary'" @click="changeSpeed(300)">2x</button>
                        </div>

                        <!-- Zoom controls for 2D trees -->
                        <div class="btn-group btn-group-sm ms-2" v-if="activeTab === 'expression' || activeTab === 'diagram'">
                            <button type="button" class="btn btn-outline-secondary" @click="zoomOut" title="Zoom Out">-</button>
                            <button type="button" class="btn btn-outline-secondary" @click="resetZoom" title="Reset Zoom">{{ Math.round(zoomLevel * 100) }}%</button>
                            <button type="button" class="btn btn-outline-secondary" @click="zoomIn" title="Zoom In">+</button>
                        </div>

                        <div class="btn-group btn-group-sm ms-2" v-if="activeTab === 'expression' || activeTab === 'diagram' || activeTab === 'tree'">
                            <button type="button" class="btn btn-outline-secondary" @click="expandAll">Expand All</button>
                            <button type="button" class="btn btn-outline-secondary" @click="collapseAll">Collapse All</button>
                        </div>
                    </div>
                </div>

                <div class="alert alert-light border py-1 px-2 mb-0 mt-2 small" v-if="currentStep">
                    <span class="badge" :class="currentStep.type === 'call' ? 'bg-primary' : 'bg-success'">
                        {{ currentStep.type === 'call' ? 'CALL' : 'RETURN' }}
                    </span>
                    <span class="ms-2 font-monospace">{{ currentStep.message }}</span>
                </div>
            </div>

            <!-- Tab Content -->
            <div class="card-body p-3">
                <div class="row g-3">
                    <div :class="(selectedNode && (activeTab === 'expression' || activeTab === 'diagram' || activeTab === 'tree')) ? 'col-lg-8' : 'col-12'">

                        <!-- TAB 1: CALL TREE (Default) -->
                        <div v-show="activeTab === 'diagram'">
                            <div class="alert alert-light border py-1 px-3 mb-2 small text-muted">
                                <strong>Call Tree:</strong> Top-down function calls with explicit role badges distinguishing <strong>Inner Calls</strong> (intermediate inputs) from <strong>Outer Combiners</strong>.
                            </div>
                            <div class="tree-diagram-viewport" ref="diagramViewport">
                                <div class="tree-diagram-content" :style="zoomStyle">
                                    <ul v-if="treeData && treeData.root" class="p-0 m-0">
                                        <calc-tree-diagram-node
                                            :node="treeData.root"
                                            :selected-node-id="selectedNode ? selectedNode.id : null"
                                            :active-step-node-id="activeStepNodeId"
                                            :active-step-type="activeStepType"
                                            :collapsed-nodes="collapsedNodes"
                                            @select-node="selectNode"
                                            @toggle-collapse="toggleCollapse">
                                        </calc-tree-diagram-node>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- TAB 2: EXPRESSION AST -->
                        <div v-show="activeTab === 'expression'">
                            <div class="alert alert-light border py-1 px-3 mb-2 small text-muted">
                                <strong>Expression AST:</strong> Functional programming reduction tree. Outer combiner functions wrap inner recursive expressions and arguments.
                            </div>
                            <div class="tree-diagram-viewport" ref="expressionViewport">
                                <div class="tree-diagram-content" :style="zoomStyle">
                                    <ul v-if="treeData && treeData.expressionAst" class="p-0 m-0">
                                        <calc-expression-ast-node
                                            :node="treeData.expressionAst"
                                            :selected-node-id="selectedNode ? (selectedNode.nodeId || selectedNode.id) : null"
                                            :active-step-node-id="activeStepNodeId"
                                            :active-step-type="activeStepType"
                                            :collapsed-nodes="collapsedNodes"
                                            @select-node="selectNode"
                                            @toggle-collapse="toggleCollapse">
                                        </calc-expression-ast-node>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- TAB 3: NESTED LIST VIEW -->
                        <div v-show="activeTab === 'tree'">
                            <div class="p-2 border rounded bg-light" style="overflow-x: auto;">
                                <calc-tree-node-item
                                    v-if="treeData && treeData.root"
                                    :node="treeData.root"
                                    :selected-node-id="selectedNode ? selectedNode.id : null"
                                    :active-step-node-id="activeStepNodeId"
                                    :active-step-type="activeStepType"
                                    :collapsed-nodes="collapsedNodes"
                                    @select-node="selectNode"
                                    @toggle-collapse="toggleCollapse">
                                </calc-tree-node-item>
                            </div>
                        </div>

                        <!-- TAB 4: TRACE -->
                        <div v-show="activeTab === 'trace'">
                            <div class="table-responsive">
                                <table class="table table-sm table-striped table-hover align-middle font-monospace small mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th style="width: 50px;">#</th>
                                            <th style="width: 80px;">Action</th>
                                            <th>Role</th>
                                            <th>Call</th>
                                            <th>Arguments</th>
                                            <th>Result</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(entry, idx) in trace" :key="idx"
                                            :class="{ 'table-primary fw-bold': idx === currentStepIndex }"
                                            style="cursor: pointer;"
                                            @click="goToStep(idx)">
                                            <td>{{ idx + 1 }}</td>
                                            <td>
                                                <span class="badge" :class="entry.type === 'call' ? 'bg-primary' : 'bg-success'">
                                                    {{ entry.type.toUpperCase() }}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge" :class="entry.node.role === 'Base Case' ? 'bg-success' : (entry.node.role === 'Inner Call' ? 'bg-info text-dark' : 'bg-secondary')">
                                                    {{ entry.node.role || 'Call' }}
                                                </span>
                                            </td>
                                            <td>{{ entry.callSig }}</td>
                                            <td>[{{ entry.node.args.join(', ') }}]</td>
                                            <td>
                                                <span v-if="entry.type === 'return'" class="badge bg-success">
                                                    = {{ entry.result }}
                                                </span>
                                                <span v-else class="text-muted">-</span>
                                            </td>
                                            <td class="text-muted">{{ entry.message }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Shared Node Details Sidebar -->
                    <div class="col-lg-4" v-if="selectedNode && (activeTab === 'expression' || activeTab === 'diagram' || activeTab === 'tree')">
                        <div class="card border sticky-top" style="top: 1rem;">
                            <div class="card-header bg-light d-flex align-items-center justify-content-between py-2">
                                <span class="fw-bold small">Node Details</span>
                                <button type="button" class="btn-close btn-sm" @click="selectedNode = null"></button>
                            </div>
                            <div class="card-body small">
                                <div class="mb-2">
                                    <div class="text-muted">Node / Expression:</div>
                                    <div class="fw-bold font-monospace fs-6">
                                        {{ selectedNode.operator || selectedNode.name || selectedNode.label }}({{ selectedNode.args ? selectedNode.args.join(', ') : '' }})
                                    </div>
                                </div>

                                <div class="mb-2" v-if="selectedNode.role">
                                    <div class="text-muted">Functional Role:</div>
                                    <div>
                                        <span class="badge" :class="selectedNode.role === 'Base Case' ? 'bg-success' : selectedNode.role === 'Inner Call' ? 'bg-info text-dark' : 'bg-secondary'">
                                            {{ selectedNode.role }}
                                        </span>
                                    </div>
                                    <div class="text-muted small mt-1" v-if="selectedNode.roleDescription">
                                        {{ selectedNode.roleDescription }}
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <div class="text-muted">Evaluated Value:</div>
                                    <div>
                                        <span class="badge bg-success font-monospace fs-6" v-if="selectedNode.result !== undefined">
                                            = {{ selectedNode.result }}
                                        </span>
                                        <span class="text-muted fst-italic" v-else>Evaluating...</span>
                                    </div>
                                </div>

                                <div class="mb-2" v-if="selectedNode.recIndex !== undefined">
                                    <div class="text-muted">Recursion Parameter:</div>
                                    <div class="font-monospace">
                                        {{ String.fromCharCode(97 + selectedNode.recIndex) }} = {{ selectedNode.recVal }}
                                        <span v-if="selectedNode.recVal > 0" class="text-muted">
                                            (predecessor: {{ selectedNode.recVal - 1 }})
                                        </span>
                                    </div>
                                </div>

                                <div class="mb-2" v-if="selectedNode.equation || selectedNode.stepEquation">
                                    <div class="text-muted">Reduction Equation:</div>
                                    <div class="p-2 bg-light rounded font-monospace small border">
                                        {{ selectedNode.equation || selectedNode.stepEquation }}
                                    </div>
                                </div>

                                <div class="mb-0">
                                    <div class="text-muted">Child Branches:</div>
                                    <div>{{ selectedNode.children ? selectedNode.children.length : 0 }} branch(es)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
};
