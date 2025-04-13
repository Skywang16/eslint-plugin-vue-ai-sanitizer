import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';
import {
  isEffectCall,
  getUsedVariables,
  isVueComponent,
  isSetupFunction,
  isCompositionApiSetup,
  isScriptSetup
} from '../utils/ast-utils';

/**
 * 检查 Vue 的 watchEffect, watch 和生命周期钩子中的依赖问题
 */
const vueEffectDepsRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Vue 的副作用函数中的依赖问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      missingDeps: '副作用函数中使用了外部变量 {{ deps }}，但没有正确处理依赖关系',
      unnecessaryDeps: '副作用函数的依赖数组中包含不必要的依赖 {{ deps }}',
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (isEffectCall(node)) {
          // 检查是否是 watchEffect 或生命周期钩子
          if (
            node.callee.type === 'Identifier' &&
            (node.callee.name === 'watchEffect' ||
             ['onMounted', 'onUpdated', 'onUnmounted'].includes(node.callee.name))
          ) {
            if (node.arguments.length > 0) {
              const callback = node.arguments[0];

              // 检查回调函数是否是箭头函数或普通函数
              if (
                (callback.type === 'ArrowFunctionExpression' ||
                 callback.type === 'FunctionExpression') &&
                callback.body
              ) {
                // 获取函数体内使用的变量
                const usedVars = getUsedVariables(callback.body);

                // 过滤掉函数参数和全局变量
                const params = new Set(
                  callback.params?.map((param: any) =>
                    param.type === 'Identifier' ? param.name : null
                  ).filter(Boolean) || []
                );

                // 全局变量和内置函数
                const globals = new Set([
                  'console', 'setTimeout', 'clearTimeout', 'setInterval',
                  'clearInterval', 'document', 'window', 'this', 'undefined',
                  'null', 'true', 'false'
                ]);

                // 过滤出可能的依赖
                const possibleDeps = Array.from(usedVars).filter(
                  varName => !params.has(varName) && !globals.has(varName)
                );

                if (possibleDeps.length > 0) {
                  context.report({
                    node,
                    messageId: 'missingDeps',
                    data: {
                      deps: possibleDeps.join(', '),
                    },
                    fix(fixer) {
                      // 对于 watchEffect，建议转换为 watch
                      if (node.callee.name === 'watchEffect') {
                        const sourceCode = context.getSourceCode();
                        const callbackText = sourceCode.getText(callback);

                        return fixer.replaceText(
                          node,
                          `watch([${possibleDeps.join(', ')}], () => ${callbackText})`
                        );
                      }

                      // 对于生命周期钩子，无法自动修复
                      return null;
                    },
                  });
                }
              }
            }
          }

          // 检查 watch 的依赖
          if (node.callee.type === 'Identifier' && node.callee.name === 'watch') {
            if (node.arguments.length >= 2) {
              const source = node.arguments[0];
              const callback = node.arguments[1];

              // 检查 source 是否是数组
              if (source.type === 'ArrayExpression') {
                const deps = source.elements.map((el: any) =>
                  el.type === 'Identifier' ? el.name : null
                ).filter(Boolean);

                // 检查回调函数
                if (
                  (callback.type === 'ArrowFunctionExpression' ||
                   callback.type === 'FunctionExpression') &&
                  callback.body
                ) {
                  // 获取函数体内使用的变量
                  const usedVars = getUsedVariables(callback.body);

                  // 过滤掉函数参数和全局变量
                  const params = new Set(
                    callback.params?.map((param: any) =>
                      param.type === 'Identifier' ? param.name : null
                    ).filter(Boolean) || []
                  );

                  // 全局变量和内置函数
                  const globals = new Set([
                    'console', 'setTimeout', 'clearTimeout', 'setInterval',
                    'clearInterval', 'document', 'window', 'this', 'undefined',
                    'null', 'true', 'false'
                  ]);

                  // 过滤出可能的依赖
                  const possibleDeps = Array.from(usedVars).filter(
                    varName => !params.has(varName) && !globals.has(varName) && !deps.includes(varName)
                  );

                  if (possibleDeps.length > 0) {
                    context.report({
                      node,
                      messageId: 'missingDeps',
                      data: {
                        deps: possibleDeps.join(', '),
                      },
                      fix(fixer) {
                        // 将缺失的依赖添加到依赖数组中
                        const sourceCode = context.getSourceCode();
                        const sourceText = sourceCode.getText(source);

                        // 移除数组的方括号
                        const depsText = sourceText.slice(1, -1).trim();
                        const newDepsText = depsText.length > 0
                          ? `${depsText}, ${possibleDeps.join(', ')}`
                          : possibleDeps.join(', ');

                        return fixer.replaceText(
                          source,
                          `[${newDepsText}]`
                        );
                      },
                    });
                  }

                  // 检查不必要的依赖
                  const unnecessaryDeps = deps.filter((dep: string) => !Array.from(usedVars).includes(dep));

                  if (unnecessaryDeps.length > 0) {
                    context.report({
                      node,
                      messageId: 'unnecessaryDeps',
                      data: {
                        deps: unnecessaryDeps.join(', '),
                      },
                      fix(fixer) {
                        // 从依赖数组中移除不必要的依赖
                        const necessaryDeps = deps.filter((dep: string) => !unnecessaryDeps.includes(dep));

                        return fixer.replaceText(
                          source,
                          `[${necessaryDeps.join(', ')}]`
                        );
                      },
                    });
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

export default vueEffectDepsRule;
