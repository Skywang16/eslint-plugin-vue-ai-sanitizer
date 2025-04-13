import { RuleTester } from 'eslint';
import vuePropValidationRule from '../../src/rules/vue-prop-validation';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

ruleTester.run('vue-prop-validation', vuePropValidationRule, {
  valid: [
    // 正确的 props 验证
    `
    export default {
      props: {
        name: {
          type: String,
          required: true
        },
        age: {
          type: Number,
          default: 0
        },
        items: {
          type: Array,
          default: () => [],
          validator: (value) => Array.isArray(value)
        }
      }
    }
    `,
    
    // 使用数组类型的 props 验证
    `
    export default {
      props: {
        status: {
          type: String,
          validator: (value) => ['active', 'inactive'].includes(value),
          default: 'active'
        }
      }
    }
    `,
  ],
  
  invalid: [
    // 缺少类型验证
    {
      code: `
      export default {
        props: {
          name: {}
        }
      }
      `,
      errors: [
        {
          messageId: 'missingType',
        },
      ],
    },
    
    // 简单类型没有对象形式
    {
      code: `
      export default {
        props: {
          name: String
        }
      }
      `,
      errors: [
        {
          messageId: 'missingType',
        },
      ],
      output: `
      export default {
        props: {
          name: { type: String }
        }
      }
      `,
    },
    
    // 缺少 required 或 default
    {
      code: `
      export default {
        props: {
          name: {
            type: String
          }
        }
      }
      `,
      errors: [
        {
          messageId: 'missingRequired',
          data: {
            name: 'name',
          },
        },
      ],
    },
    
    // 复杂类型缺少验证器
    {
      code: `
      export default {
        props: {
          user: {
            type: Object,
            required: true
          }
        }
      }
      `,
      errors: [
        {
          messageId: 'missingValidator',
          data: {
            name: 'user',
          },
        },
      ],
    },
  ],
});
