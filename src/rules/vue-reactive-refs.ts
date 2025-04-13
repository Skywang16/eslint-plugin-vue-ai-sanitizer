import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';
import { isReactiveCall } from '../utils/ast-utils';

/**
 * 检查 Vue 的 ref/reactive 使用问题
 */
const vueReactiveRefsRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Vue 的响应式 API 使用问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      unnecessaryRef: '简单类型使用 ref 而非直接赋值',
      unnecessaryReactive: '对象类型使用 reactive 而非 ref',
      missingValue: 'ref/reactive 调用缺少初始值',
      primitiveInReactive: '在 reactive 中使用了原始类型，应该使用 ref',
      refInReactive: '在 reactive 对象中嵌套了 ref，可能导致自动解包问题',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (isReactiveCall(node)) {
          // 检查是否是 ref 调用
          if (
            node.callee.type === 'Identifier' &&
            node.callee.name === 'ref'
          ) {
            // 检查是否缺少初始值
            if (node.arguments.length === 0) {
              context.report({
                node,
                messageId: 'missingValue',
                fix(fixer) {
                  return fixer.replaceText(node, 'ref(undefined)');
                },
              });
            }
            // 检查是否对复杂对象使用了 ref
            else if (
              node.arguments.length > 0 &&
              node.arguments[0].type === 'ObjectExpression' &&
              node.arguments[0].properties.length > 0
            ) {
              context.report({
                node,
                messageId: 'unnecessaryRef',
                fix(fixer) {
                  const sourceCode = context.getSourceCode();
                  const argText = sourceCode.getText(node.arguments[0]);
                  return fixer.replaceText(node, `reactive(${argText})`);
                },
              });
            }
          }

          // 检查是否是 reactive 调用
          if (
            node.callee.type === 'Identifier' &&
            node.callee.name === 'reactive'
          ) {
            // 检查是否缺少初始值
            if (node.arguments.length === 0) {
              context.report({
                node,
                messageId: 'missingValue',
                fix(fixer) {
                  return fixer.replaceText(node, 'reactive({})');
                },
              });
            }
            // 检查是否对原始类型使用了 reactive
            else if (
              node.arguments.length > 0 &&
              (node.arguments[0].type === 'Literal' ||
               (node.arguments[0].type === 'Identifier' &&
                ['String', 'Number', 'Boolean'].includes(node.arguments[0].name)))
            ) {
              context.report({
                node,
                messageId: 'primitiveInReactive',
                fix(fixer) {
                  const sourceCode = context.getSourceCode();
                  const argText = sourceCode.getText(node.arguments[0]);
                  return fixer.replaceText(node, `ref(${argText})`);
                },
              });
            }

            // 检查 reactive 对象中是否嵌套了 ref
            else if (
              node.arguments.length > 0 &&
              node.arguments[0].type === 'ObjectExpression'
            ) {
              for (const prop of node.arguments[0].properties) {
                // 使用类型断言确保 prop 是 Property 类型
                const propAsProperty = prop as any;
                if (
                  propAsProperty.value &&
                  propAsProperty.value.type === 'CallExpression' &&
                  propAsProperty.value.callee &&
                  propAsProperty.value.callee.type === 'Identifier' &&
                  propAsProperty.value.callee.name === 'ref'
                ) {
                  context.report({
                    node: propAsProperty.value,
                    messageId: 'refInReactive',
                    fix(fixer) {
                      const sourceCode = context.getSourceCode();
                      if (propAsProperty.value.arguments.length > 0) {
                        const argText = sourceCode.getText(propAsProperty.value.arguments[0]);
                        return fixer.replaceText(propAsProperty.value, argText);
                      }
                      return null;
                    },
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

export default vueReactiveRefsRule;
