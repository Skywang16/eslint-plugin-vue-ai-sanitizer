import { Rule } from 'eslint';
import { VueAiSanitizerRuleModule } from '../types';

/**
 * 检查 Vuex 辅助函数使用问题
 */
const vuexHelpersUsageRule: VueAiSanitizerRuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: '检查 Vuex 辅助函数使用问题',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // 没有选项
    messages: {
      inconsistentMappers: '同一组件中混合使用了不同风格的 Vuex 映射函数',
      redundantMappers: '使用了冗余的 Vuex 映射函数，可以合并',
      missingNamespace: '在使用命名空间模块时，应提供命名空间参数',
      unnecessaryArray: '单个属性映射不需要使用数组语法',
    },
  },

  create(context) {
    // 跟踪当前组件中使用的 Vuex 辅助函数
    const mappers = new Set<string>();
    
    return {
      // 检查 Vuex 辅助函数调用
      CallExpression(node: any) {
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          [
            'mapState', 'mapGetters', 'mapMutations', 'mapActions',
            'createNamespacedHelpers'
          ].includes(node.callee.name)
        ) {
          // 记录使用的辅助函数
          mappers.add(node.callee.name);
          
          // 检查是否提供了命名空间
          if (
            ['mapState', 'mapGetters', 'mapMutations', 'mapActions'].includes(node.callee.name) &&
            node.arguments.length > 0
          ) {
            // 检查第一个参数是否是对象而非命名空间字符串
            if (
              node.arguments[0].type === 'ObjectExpression' &&
              context.getScope().through.some((ref: any) => 
                ref.identifier.name === 'namespace' || 
                ref.identifier.name.includes('Module')
              )
            ) {
              context.report({
                node,
                messageId: 'missingNamespace',
                fix(fixer) {
                  // 无法自动修复，因为需要知道具体的命名空间
                  return null;
                },
              });
            }
          }
          
          // 检查不必要的数组语法
          if (
            ['mapState', 'mapGetters', 'mapMutations', 'mapActions'].includes(node.callee.name) &&
            node.arguments.length > 0 &&
            node.arguments[node.arguments.length - 1].type === 'ArrayExpression' &&
            node.arguments[node.arguments.length - 1].elements.length === 1
          ) {
            context.report({
              node: node.arguments[node.arguments.length - 1],
              messageId: 'unnecessaryArray',
              fix(fixer) {
                const sourceCode = context.getSourceCode();
                const element = node.arguments[node.arguments.length - 1].elements[0];
                return fixer.replaceText(
                  node.arguments[node.arguments.length - 1],
                  sourceCode.getText(element)
                );
              },
            });
          }
        }
      },
      
      // 检查 Vuex 辅助函数的使用模式
      'Program:exit'() {
        // 检查是否混合使用了不同风格的辅助函数
        const objectStyleMappers = ['mapState', 'mapGetters', 'mapMutations', 'mapActions'].filter(
          mapper => mappers.has(mapper)
        );
        
        const compositionStyleMappers = ['useStore'].filter(
          mapper => mappers.has(mapper)
        );
        
        if (objectStyleMappers.length > 0 && compositionStyleMappers.length > 0) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'inconsistentMappers',
          });
        }
        
        // 检查是否有冗余的映射函数调用
        if (
          (mappers.has('mapState') && mappers.has('mapGetters')) ||
          (mappers.has('mapMutations') && mappers.has('mapActions'))
        ) {
          // 查找所有映射函数调用
          const mapStateCalls: any[] = [];
          const mapGettersCalls: any[] = [];
          const mapMutationsCalls: any[] = [];
          const mapActionsCalls: any[] = [];
          
          const sourceCode = context.getSourceCode();
          const allNodes = sourceCode.ast.body;
          
          function findMapperCalls(node: any) {
            if (
              node.type === 'CallExpression' &&
              node.callee &&
              node.callee.type === 'Identifier'
            ) {
              if (node.callee.name === 'mapState') {
                mapStateCalls.push(node);
              } else if (node.callee.name === 'mapGetters') {
                mapGettersCalls.push(node);
              } else if (node.callee.name === 'mapMutations') {
                mapMutationsCalls.push(node);
              } else if (node.callee.name === 'mapActions') {
                mapActionsCalls.push(node);
              }
            }
            
            for (const key in node) {
              if (typeof node[key] === 'object' && node[key] !== null) {
                if (Array.isArray(node[key])) {
                  node[key].forEach((item: any) => {
                    if (item && typeof item === 'object') {
                      findMapperCalls(item);
                    }
                  });
                } else {
                  findMapperCalls(node[key]);
                }
              }
            }
          }
          
          allNodes.forEach(findMapperCalls);
          
          // 检查是否可以合并相邻的映射函数调用
          if (
            mapStateCalls.length > 0 && 
            mapGettersCalls.length > 0 &&
            mapStateCalls.some(stateCall => 
              mapGettersCalls.some(getterCall => 
                Math.abs(
                  sourceCode.getFirstToken(stateCall)!.loc.start.line - 
                  sourceCode.getFirstToken(getterCall)!.loc.start.line
                ) <= 2
              )
            )
          ) {
            context.report({
              loc: { 
                line: sourceCode.getFirstToken(mapStateCalls[0])!.loc.start.line, 
                column: sourceCode.getFirstToken(mapStateCalls[0])!.loc.start.column 
              },
              messageId: 'redundantMappers',
            });
          }
          
          if (
            mapMutationsCalls.length > 0 && 
            mapActionsCalls.length > 0 &&
            mapMutationsCalls.some(mutationCall => 
              mapActionsCalls.some(actionCall => 
                Math.abs(
                  sourceCode.getFirstToken(mutationCall)!.loc.start.line - 
                  sourceCode.getFirstToken(actionCall)!.loc.start.line
                ) <= 2
              )
            )
          ) {
            context.report({
              loc: { 
                line: sourceCode.getFirstToken(mapMutationsCalls[0])!.loc.start.line, 
                column: sourceCode.getFirstToken(mapMutationsCalls[0])!.loc.start.column 
              },
              messageId: 'redundantMappers',
            });
          }
        }
      },
    };
  },
};

export default vuexHelpersUsageRule;
