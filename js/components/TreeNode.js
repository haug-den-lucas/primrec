export default {
    name: 'TreeNode',
    props: {
        node: { type: Object, required: true },
        funcName: { type: String, required: true },
        paramCount: { type: Number, required: true },
        recDefIndex: { type: Number, default: -1 }
    },
    emits: ['open-choice'],
    template: `
        <span class="d-inline-flex align-items-center">
            <template v-if="node.name === 'placeholder'">
                <button type="button" class="btn btn-sm btn-outline-primary placeholder-btn py-0 px-2 fw-bold ms-1 me-1" @click="$emit('open-choice', node)">+</button>
            </template>
            <template v-else-if="node.name === 'const'">
                <span class="badge bg-secondary ms-1 me-1 fs-6">{{ node.inner }}</span>
            </template>
            <template v-else-if="node.name === 'param'">
                <span class="badge bg-info text-dark ms-1 me-1 fs-6">
                    <template v-if="node.inner === recDefIndex">0</template>
                    <template v-else>{{ String.fromCharCode(97 + node.inner) }}</template>
                </span>
            </template>
            <template v-else-if="node.name === funcName && !node.inner">
                <span class="fw-bold ms-1 me-1">{{ funcName }}(<template v-for="i in paramCount" :key="i">{{ String.fromCharCode(96 + i) }}<template v-if="i < paramCount">, </template></template>)</span>
            </template>
            <template v-else>
                <span class="fw-bold ms-1">{{ node.name }}(</span>
                <template v-if="Array.isArray(node.inner)">
                    <template v-for="(child, idx) in node.inner" :key="idx">
                        <tree-node :node="child" :func-name="funcName" :param-count="paramCount" :rec-def-index="recDefIndex" @open-choice="$emit('open-choice', $event)"></tree-node>
                        <span v-if="idx < node.inner.length - 1" class="me-1">,</span>
                    </template>
                </template>
                <span class="fw-bold me-1">)</span>
            </template>
        </span>
    `
};
