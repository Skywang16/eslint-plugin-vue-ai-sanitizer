import vueEffectDepsRule from './rules/vue-effect-deps';
import vueReactiveRefsRule from './rules/vue-reactive-refs';
import vueConditionalRenderingRule from './rules/vue-conditional-rendering';
import vuePropValidationRule from './rules/vue-prop-validation';

// Vue 全家桶相关规则
import vuexStoreStructureRule from './rules/vuex-store-structure';
import vuexHelpersUsageRule from './rules/vuex-helpers-usage';
import piniaStoreUsageRule from './rules/pinia-store-usage';

export = {
  rules: {
    // Vue 核心规则
    'effect-deps': vueEffectDepsRule,
    'reactive-refs': vueReactiveRefsRule,
    'conditional-rendering': vueConditionalRenderingRule,
    'prop-validation': vuePropValidationRule,

    // Vuex 相关规则
    'vuex-store-structure': vuexStoreStructureRule,
    'vuex-helpers-usage': vuexHelpersUsageRule,

    // Pinia 相关规则
    'pinia-store-usage': piniaStoreUsageRule,
  },
  configs: {
    recommended: {
      plugins: ['vue-ai-sanitizer'],
      rules: {
        // Vue 核心规则
        'vue-ai-sanitizer/effect-deps': 'warn',
        'vue-ai-sanitizer/reactive-refs': 'warn',
        'vue-ai-sanitizer/conditional-rendering': 'warn',
        'vue-ai-sanitizer/prop-validation': 'warn',

        // Vuex 相关规则
        'vue-ai-sanitizer/vuex-store-structure': 'warn',
        'vue-ai-sanitizer/vuex-helpers-usage': 'warn',

        // Pinia 相关规则
        'vue-ai-sanitizer/pinia-store-usage': 'warn',
      },
    },
    all: {
      plugins: ['vue-ai-sanitizer'],
      rules: {
        // Vue 核心规则
        'vue-ai-sanitizer/effect-deps': 'error',
        'vue-ai-sanitizer/reactive-refs': 'error',
        'vue-ai-sanitizer/conditional-rendering': 'error',
        'vue-ai-sanitizer/prop-validation': 'error',

        // Vuex 相关规则
        'vue-ai-sanitizer/vuex-store-structure': 'error',
        'vue-ai-sanitizer/vuex-helpers-usage': 'error',

        // Pinia 相关规则
        'vue-ai-sanitizer/pinia-store-usage': 'error',
      },
    },
  },
};
