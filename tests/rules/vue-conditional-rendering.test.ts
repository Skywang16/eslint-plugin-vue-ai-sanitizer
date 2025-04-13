import { RuleTester } from 'eslint';
import vueConditionalRenderingRule from '../../src/rules/vue-conditional-rendering';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run('vue-conditional-rendering', vueConditionalRenderingRule, {
  valid: [
    // 安全的条件表达式
    `
    export default {
      setup() {
        const user = { name: 'John' };
        return () => (
          <div>
            {user?.name ? <span>{user.name}</span> : <span>No name</span>}
          </div>
        );
      }
    }
    `,
    
    // 简单的条件表达式
    `
    export default {
      setup() {
        const isVisible = true;
        return () => (
          <div>
            {isVisible && <span>Visible content</span>}
          </div>
        );
      }
    }
    `,
    
    // 正确使用 key 的列表渲染
    `
    export default {
      setup() {
        const items = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
        return () => (
          <div>
            {items.map(item => (
              <div key={item.id}>{item.name}</div>
            ))}
          </div>
        );
      }
    }
    `,
  ],
  
  invalid: [
    // 不安全的属性访问
    {
      code: `
      export default {
        setup() {
          const user = { address: { city: 'New York' } };
          return () => (
            <div>
              {user.address.city ? <span>{user.address.city}</span> : <span>No city</span>}
            </div>
          );
        }
      }
      `,
      errors: [
        {
          messageId: 'unsafeConditional',
        },
      ],
      output: `
      export default {
        setup() {
          const user = { address: { city: 'New York' } };
          return () => (
            <div>
              {user.address?.city ? <span>{user.address.city}</span> : <span>No city</span>}
            </div>
          );
        }
      }
      `,
    },
    
    // 复杂的条件表达式
    {
      code: `
      export default {
        setup() {
          const user = { name: 'John', age: 30, isAdmin: true, permissions: { canEdit: true } };
          return () => (
            <div>
              {user.isAdmin && user.age > 18 && user.permissions.canEdit && user.name.length > 0 ? (
                <span>Admin can edit</span>
              ) : (
                <span>Not allowed</span>
              )}
            </div>
          );
        }
      }
      `,
      errors: [
        {
          messageId: 'complexCondition',
        },
      ],
    },
    
    // 缺少 key 的列表渲染
    {
      code: `
      export default {
        setup() {
          const items = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
          return () => (
            <div>
              {items.map(item => (
                <div v-for={item}>{item.name}</div>
              ))}
            </div>
          );
        }
      }
      `,
      errors: [
        {
          messageId: 'missingKey',
        },
      ],
    },
  ],
});
