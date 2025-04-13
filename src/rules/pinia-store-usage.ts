import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';

/**
 * 检查 Pinia store 使用问题
 */
const piniaStoreUsageRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Pinia store 使用问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      directStateChange: 'Pinia 中不应直接修改 state，应使用 action',
      missingTypeDefinition: 'Pinia store 应定义状态类型',
      unnecessaryGetters: 'Pinia getter 只返回 state 属性，可以直接访问',
      inconsistentStoreUsage: '同一组件中混合使用了不同风格的 store 访问方式',
      missingStoreSetup: 'Pinia store 应在 setup 中使用 defineStore',
    },
  },

  create(context) {
    // 跟踪当前组件中使用的 store 访问方式
    const storeAccessMethods = new Set<string>();
    
    return {
      // 检查 Pinia store 定义
      CallExpression(node: any) {
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'defineStore'
        ) {
          // 检查是否定义了类型
          if (
            node.arguments.length >= 2 &&
            node.arguments[1].type === 'ObjectExpression'
          ) {
            const stateProperty = node.arguments[1].properties.find(
              (prop: any) => prop.key && prop.key.name === 'state'
            );
            
            if (
              stateProperty &&
              stateProperty.value &&
              (stateProperty.value.type === 'FunctionExpression' || stateProperty.value.type === 'ArrowFunctionExpression') &&
              !stateProperty.value.returnType
            ) {
              context.report({
                node: stateProperty,
                messageId: 'missingTypeDefinition',
              });
            }
          }
          
          // 检查是否在 setup 中使用
          let inSetup = false;
          let parent = node.parent;
          
          while (parent) {
            if (
              (parent.type === 'VariableDeclarator' &&
               parent.parent &&
               parent.parent.parent &&
               parent.parent.parent.parent &&
               parent.parent.parent.parent.type === 'ExportDefaultDeclaration') ||
              (parent.type === 'ExportDefaultDeclaration')
            ) {
              inSetup = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (!inSetup) {
            context.report({
              node,
              messageId: 'missingStoreSetup',
            });
          }
          
          // 检查不必要的 getters
          if (
            node.arguments.length >= 2 &&
            node.arguments[1].type === 'ObjectExpression'
          ) {
            const gettersProperty = node.arguments[1].properties.find(
              (prop: any) => prop.key && prop.key.name === 'getters'
            );
            
            if (
              gettersProperty &&
              gettersProperty.value &&
              gettersProperty.value.type === 'ObjectExpression'
            ) {
              for (const getter of gettersProperty.value.properties) {
                if (
                  getter.value &&
                  (getter.value.type === 'FunctionExpression' || getter.value.type === 'ArrowFunctionExpression') &&
                  getter.value.body
                ) {
                  // 检查函数体是否只是返回 state 属性
                  let returnStatement: any = null;
                  
                  if (getter.value.body.type === 'BlockStatement' && getter.value.body.body.length === 1) {
                    returnStatement = getter.value.body.body[0];
                  } else if (getter.value.body.type !== 'BlockStatement') {
                    // 箭头函数可能直接返回表达式
                    returnStatement = { type: 'ReturnStatement', argument: getter.value.body };
                  }
                  
                  if (
                    returnStatement &&
                    returnStatement.type === 'ReturnStatement' &&
                    returnStatement.argument &&
                    returnStatement.argument.type === 'MemberExpression' &&
                    returnStatement.argument.object &&
                    (
                      (returnStatement.argument.object.type === 'ThisExpression') ||
                      (returnStatement.argument.object.type === 'Identifier' && returnStatement.argument.object.name === 'state')
                    )
                  ) {
                    context.report({
                      node: getter,
                      messageId: 'unnecessaryGetters',
                    });
                  }
                }
              }
            }
          }
        }
        
        // 检查 store 访问方式
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          node.callee.name.startsWith('use') &&
          node.callee.name.endsWith('Store')
        ) {
          storeAccessMethods.add('composition');
        }
      },
      
      // 检查直接修改 state 的情况
      AssignmentExpression(node: any) {
        // 检查左侧是否是 store 的 state 属性访问
        if (
          node.left.type === 'MemberExpression' &&
          node.left.object &&
          node.left.object.type === 'MemberExpression' &&
          node.left.object.property &&
          node.left.object.property.name === 'state'
        ) {
          // 检查是否在 action 函数内
          let inAction = false;
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
              parent.parent.parent.key.name === 'actions'
            ) {
              inAction = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (!inAction) {
            context.report({
              node,
              messageId: 'directStateChange',
              fix(fixer) {
                // 无法自动修复，因为需要创建 action
                return null;
              },
            });
          }
        }
      },
      
      // 检查 store 的使用模式
      MemberExpression(node: any) {
        // 检查是否使用了 $store 访问方式
        if (
          node.object &&
          node.object.type === 'ThisExpression' &&
          node.property &&
          node.property.name === '$store'
        ) {
          storeAccessMethods.add('options');
        }
        
        // 检查是否使用了 mapState 等辅助函数生成的计算属性
        if (
          node.object &&
          node.object.type === 'Identifier' &&
          context.getScope().through.some((ref: any) => 
            ref.identifier.name === node.object.name &&
            ref.resolved &&
            ref.resolved.defs &&
            ref.resolved.defs.some((def: any) => 
              def.node &&
              def.node.init &&
              def.node.init.type === 'CallExpression' &&
              def.node.init.callee &&
              def.node.init.callee.name &&
              ['mapState', 'mapGetters', 'mapActions'].includes(def.node.init.callee.name)
            )
          )
        ) {
          storeAccessMethods.add('helpers');
        }
      },
      
      // 检查 store 访问方式的一致性
      'Program:exit'() {
        if (storeAccessMethods.size > 1) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'inconsistentStoreUsage',
          });
        }
      },
    };
  },
};

export default piniaStoreUsageRule;
