import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';
import { checkConditionalRendering } from '../utils/ast-utils';

/**
 * 检查 Vue 的条件渲染问题
 */
const vueConditionalRenderingRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Vue 的条件渲染问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      unsafeConditional: '{{ message }}',
      missingKey: '在列表渲染中缺少唯一的 key 属性',
      complexCondition: '条件表达式过于复杂，建议提取为计算属性',
    },
  },

  create(context) {
    return {
      // 检查条件表达式
      ConditionalExpression(node) {
        const result = checkConditionalRendering(node);
        if (result.hasIssue) {
          context.report({
            node,
            messageId: 'unsafeConditional',
            data: {
              message: result.message || '条件渲染中可能存在问题',
            },
            fix(fixer) {
              // 如果是成员表达式，添加可选链
              if (
                node.test.type === 'MemberExpression' &&
                !node.test.optional
              ) {
                const sourceCode = context.getSourceCode();
                const objectText = sourceCode.getText(node.test.object);
                const propertyText = node.test.computed
                  ? sourceCode.getText(node.test.property)
                  : (node.test.property as any).name;

                const newTest = node.test.computed
                  ? `${objectText}?.[${propertyText}]`
                  : `${objectText}?.${propertyText}`;

                return fixer.replaceText(node.test, newTest);
              }
              return null;
            },
          });
        }

        // 检查条件表达式的复杂度
        let complexity = 0;
        function countComplexity(expr: any) {
          if (!expr) return;

          if (expr.type === 'LogicalExpression') {
            complexity++;
            countComplexity(expr.left);
            countComplexity(expr.right);
          } else if (expr.type === 'BinaryExpression') {
            complexity++;
            countComplexity(expr.left);
            countComplexity(expr.right);
          } else if (expr.type === 'ConditionalExpression') {
            complexity += 2;
            countComplexity(expr.test);
            countComplexity(expr.consequent);
            countComplexity(expr.alternate);
          }
        }

        countComplexity(node.test);

        if (complexity > 3) {
          context.report({
            node,
            messageId: 'complexCondition',
          });
        }
      },

      // 检查逻辑表达式 (&&, ||)
      LogicalExpression(node) {
        const result = checkConditionalRendering(node);
        if (result.hasIssue) {
          context.report({
            node,
            messageId: 'unsafeConditional',
            data: {
              message: result.message || '条件渲染中可能存在问题',
            },
            fix(fixer) {
              // 如果是成员表达式，添加可选链
              if (
                node.left.type === 'MemberExpression' &&
                !node.left.optional
              ) {
                const sourceCode = context.getSourceCode();
                const objectText = sourceCode.getText(node.left.object);
                const propertyText = node.left.computed
                  ? sourceCode.getText(node.left.property)
                  : (node.left.property as any).name;

                const newLeft = node.left.computed
                  ? `${objectText}?.[${propertyText}]`
                  : `${objectText}?.${propertyText}`;

                return fixer.replaceText(node.left, newLeft);
              }
              return null;
            },
          });
        }
      },

      // 检查 v-for 指令 (简化处理，实际上需要 Vue 模板解析器)
      JSXElement(node: any) {
        // 检查是否有 v-for 属性但没有 key 属性
        const hasVFor = node.openingElement.attributes.some(
          (attr: any) => attr.name && attr.name.name === 'v-for'
        );

        const hasKey = node.openingElement.attributes.some(
          (attr: any) => attr.name && attr.name.name === 'key'
        );

        if (hasVFor && !hasKey) {
          context.report({
            node,
            messageId: 'missingKey',
          });
        }
      },
    };
  },
};

export default vueConditionalRenderingRule;
