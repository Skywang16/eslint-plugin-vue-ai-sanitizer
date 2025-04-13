import { RuleTester } from 'eslint';
import vueReactiveRefsRule from '../../src/rules/vue-reactive-refs';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('vue-reactive-refs', vueReactiveRefsRule, {
  valid: [
    // 正确使用 ref
    `
    import { ref } from 'vue';
    
    export default {
      setup() {
        const count = ref(0);
        return { count };
      }
    }
    `,
    
    // 正确使用 reactive
    `
    import { reactive } from 'vue';
    
    export default {
      setup() {
        const state = reactive({
          count: 0,
          name: 'John'
        });
        return { state };
      }
    }
    `,
    
    // 正确使用 computed
    `
    import { ref, computed } from 'vue';
    
    export default {
      setup() {
        const count = ref(0);
        const doubled = computed(() => count.value * 2);
        return { count, doubled };
      }
    }
    `,
  ],
  
  invalid: [
    // ref 缺少初始值
    {
      code: `
      import { ref } from 'vue';
      
      export default {
        setup() {
          const count = ref();
          return { count };
        }
      }
      `,
      errors: [
        {
          messageId: 'missingValue',
        },
      ],
      output: `
      import { ref } from 'vue';
      
      export default {
        setup() {
          const count = ref(undefined);
          return { count };
        }
      }
      `,
    },
    
    // 对复杂对象使用 ref
    {
      code: `
      import { ref } from 'vue';
      
      export default {
        setup() {
          const user = ref({ name: 'John', age: 30 });
          return { user };
        }
      }
      `,
      errors: [
        {
          messageId: 'unnecessaryRef',
        },
      ],
      output: `
      import { ref } from 'vue';
      
      export default {
        setup() {
          const user = reactive({ name: 'John', age: 30 });
          return { user };
        }
      }
      `,
    },
    
    // reactive 缺少初始值
    {
      code: `
      import { reactive } from 'vue';
      
      export default {
        setup() {
          const state = reactive();
          return { state };
        }
      }
      `,
      errors: [
        {
          messageId: 'missingValue',
        },
      ],
      output: `
      import { reactive } from 'vue';
      
      export default {
        setup() {
          const state = reactive({});
          return { state };
        }
      }
      `,
    },
    
    // 对原始类型使用 reactive
    {
      code: `
      import { reactive } from 'vue';
      
      export default {
        setup() {
          const count = reactive(0);
          return { count };
        }
      }
      `,
      errors: [
        {
          messageId: 'primitiveInReactive',
        },
      ],
      output: `
      import { reactive } from 'vue';
      
      export default {
        setup() {
          const count = ref(0);
          return { count };
        }
      }
      `,
    },
    
    // reactive 对象中嵌套 ref
    {
      code: `
      import { reactive, ref } from 'vue';
      
      export default {
        setup() {
          const state = reactive({
            count: ref(0),
            name: 'John'
          });
          return { state };
        }
      }
      `,
      errors: [
        {
          messageId: 'refInReactive',
        },
      ],
      output: `
      import { reactive, ref } from 'vue';
      
      export default {
        setup() {
          const state = reactive({
            count: 0,
            name: 'John'
          });
          return { state };
        }
      }
      `,
    },
  ],
});
