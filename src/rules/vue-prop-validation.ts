import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';
import { checkPropValidation, isVueComponent } from '../utils/ast-utils';

/**
 * 检查 Vue 的 Props 验证问题
 */
const vuePropValidationRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Vue 的 Props 验证问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      missingType: '{{ message }}',
      missingDefault: 'Props "{{ name }}" 缺少默认值，可能导致未定义错误',
      missingRequired: 'Props "{{ name }}" 没有指定是否必需',
      missingValidator: '复杂的 Props "{{ name }}" 应该添加自定义验证器',
    },
  },

  create(context) {
    return {
      // 检查 Vue 组件的 props 定义
      ExportDefaultDeclaration(node) {
        if (isVueComponent(node)) {
          const component = node.declaration;

          // 查找 props 属性
          const propsProperty = (component as any).properties?.find(
            (prop: any) => prop.key && prop.key.name === 'props'
          );

          if (propsProperty && propsProperty.value.type === 'ObjectExpression') {
            const props = propsProperty.value.properties;

            for (const prop of props) {
              if (prop.key && (prop.key.name || prop.key.value)) {
                const propName = prop.key.name || prop.key.value;

                // 检查 prop 是否有类型验证
                const result = checkPropValidation(prop);
                if (result.hasIssue) {
                  context.report({
                    node: prop,
                    messageId: 'missingType',
                    data: {
                      message: result.message || 'Props 定义缺少类型验证',
                    },
                    fix(fixer) {
                      // 如果 prop 是简单类型 (String, Number 等)
                      if (prop.value.type === 'Identifier') {
                        return fixer.replaceText(
                          prop.value,
                          `{ type: ${prop.value.name} }`
                        );
                      }
                      return null;
                    },
                  });
                }

                // 如果 prop 是对象类型，检查是否有 default 和 required
                if (prop.value.type === 'ObjectExpression') {
                  const hasType = prop.value.properties.some(
                    (p: any) => p.key && p.key.name === 'type'
                  );

                  const hasDefault = prop.value.properties.some(
                    (p: any) => p.key && p.key.name === 'default'
                  );

                  const hasRequired = prop.value.properties.some(
                    (p: any) => p.key && p.key.name === 'required'
                  );

                  // 检查类型是否是对象或数组
                  const typeProperty = prop.value.properties.find(
                    (p: any) => p.key && p.key.name === 'type'
                  );

                  const isComplexType = typeProperty &&
                    ((typeProperty.value.type === 'Identifier' &&
                      ['Object', 'Array'].includes(typeProperty.value.name)) ||
                     (typeProperty.value.type === 'ArrayExpression' &&
                      typeProperty.value.elements.some((el: any) =>
                        el.type === 'Identifier' && ['Object', 'Array'].includes(el.name)
                      ))
                    );

                  // 如果没有默认值且不是必需的，报告问题
                  if (hasType && !hasDefault && !hasRequired) {
                    context.report({
                      node: prop,
                      messageId: 'missingRequired',
                      data: {
                        name: propName,
                      },
                    });
                  }

                  // 如果是复杂类型但没有验证器，建议添加
                  if (isComplexType) {
                    const hasValidator = prop.value.properties.some(
                      (p: any) => p.key && p.key.name === 'validator'
                    );

                    if (!hasValidator) {
                      context.report({
                        node: prop,
                        messageId: 'missingValidator',
                        data: {
                          name: propName,
                        },
                      });
                    }
                  }
                }
              }
            }
          }
        }
      },
    };
  },
};

export default vuePropValidationRule;
