import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';

/**
 * 检查 Vuex store 结构问题
 */
const vuexStoreStructureRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Vuex store 结构问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      directStateChange: 'Vuex 中不应直接修改 state，应使用 mutation',
      missingNamespace: '大型 Vuex store 应使用命名空间模块',
      missingTypes: 'Vuex mutation/action 类型应使用常量定义',
      unnecessaryActions: 'Vuex action 只包含一个 commit 调用，可以直接使用 mutation',
    },
  },

  create(context) {
    return {
      // 检查直接修改 state 的情况
      AssignmentExpression(node: any) {
        // 检查左侧是否是 state 属性访问
        if (
          node.left.type === 'MemberExpression' &&
          node.left.object &&
          (
            (node.left.object.type === 'Identifier' && node.left.object.name === 'state') ||
            (node.left.object.type === 'MemberExpression' && 
             node.left.object.property && 
             node.left.object.property.name === 'state')
          )
        ) {
          // 检查是否在 mutation 函数内
          let inMutation = false;
          let parent = node.parent;
          
          while (parent) {
            if (
              parent.type === 'Property' &&
              parent.key &&
              parent.key.type === 'Identifier' &&
              parent.parent &&
              parent.parent.type === 'ObjectExpression' &&
              parent.parent.parent &&
              parent.parent.parent.type === 'Property' &&
              parent.parent.parent.key &&
              parent.parent.parent.key.type === 'Identifier' &&
              parent.parent.parent.key.name === 'mutations'
            ) {
              inMutation = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (!inMutation) {
            context.report({
              node,
              messageId: 'directStateChange',
              fix(fixer) {
                // 无法自动修复，因为需要创建 mutation
                return null;
              },
            });
          }
        }
      },
      
      // 检查 Vuex store 定义
      ObjectExpression(node: any) {
        // 检查是否是 Vuex store 定义
        if (
          node.parent &&
          node.parent.type === 'CallExpression' &&
          node.parent.callee &&
          node.parent.callee.type === 'Identifier' &&
          node.parent.callee.name === 'createStore'
        ) {
          // 检查 store 大小
          const stateProperty = node.properties.find(
            (prop: any) => prop.key && prop.key.type === 'Identifier' && prop.key.name === 'state'
          );
          
          const modulesProperty = node.properties.find(
            (prop: any) => prop.key && prop.key.type === 'Identifier' && prop.key.name === 'modules'
          );
          
          // 如果 state 较大但没有使用模块
          if (
            stateProperty &&
            stateProperty.value &&
            stateProperty.value.type === 'ObjectExpression' &&
            stateProperty.value.properties &&
            stateProperty.value.properties.length > 10 &&
            !modulesProperty
          ) {
            context.report({
              node: stateProperty,
              messageId: 'missingNamespace',
            });
          }
          
          // 检查 mutation 类型是否使用常量
          const mutationsProperty = node.properties.find(
            (prop: any) => prop.key && prop.key.type === 'Identifier' && prop.key.name === 'mutations'
          );
          
          if (
            mutationsProperty &&
            mutationsProperty.value &&
            mutationsProperty.value.type === 'ObjectExpression'
          ) {
            for (const mutation of mutationsProperty.value.properties) {
              if (
                mutation.key &&
                mutation.key.type === 'Identifier' &&
                /^[a-z]/.test(mutation.key.name) // 检查是否以小写字母开头（可能是字符串字面量而非常量）
              ) {
                context.report({
                  node: mutation.key,
                  messageId: 'missingTypes',
                });
              }
            }
          }
          
          // 检查不必要的 actions
          const actionsProperty = node.properties.find(
            (prop: any) => prop.key && prop.key.type === 'Identifier' && prop.key.name === 'actions'
          );
          
          if (
            actionsProperty &&
            actionsProperty.value &&
            actionsProperty.value.type === 'ObjectExpression'
          ) {
            for (const action of actionsProperty.value.properties) {
              if (
                action.value &&
                (action.value.type === 'FunctionExpression' || action.value.type === 'ArrowFunctionExpression') &&
                action.value.body
              ) {
                // 检查函数体是否只有一个 commit 语句
                let bodyStatements: any[] = [];
                
                if (action.value.body.type === 'BlockStatement') {
                  bodyStatements = action.value.body.body;
                } else if (action.value.body.type === 'CallExpression') {
                  // 箭头函数可能直接返回表达式
                  bodyStatements = [{ type: 'ExpressionStatement', expression: action.value.body }];
                }
                
                if (
                  bodyStatements.length === 1 &&
                  bodyStatements[0].type === 'ExpressionStatement' &&
                  bodyStatements[0].expression &&
                  bodyStatements[0].expression.type === 'CallExpression' &&
                  bodyStatements[0].expression.callee &&
                  bodyStatements[0].expression.callee.type === 'MemberExpression' &&
                  bodyStatements[0].expression.callee.property &&
                  bodyStatements[0].expression.callee.property.name === 'commit'
                ) {
                  context.report({
                    node: action,
                    messageId: 'unnecessaryActions',
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

export default vuexStoreStructureRule;
