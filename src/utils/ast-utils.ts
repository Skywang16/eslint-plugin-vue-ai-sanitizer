// 移除 eslint-scope 导入，使用 any 类型代替
import { VueComponentNode, VueEffectNode, VueRefNode, VueSetupFunctionNode } from '../types';

/**
 * 检查节点是否是 Vue 组件
 */
export function isVueComponent(node: any): node is VueComponentNode {
  return (
    node &&
    node.type === 'ExportDefaultDeclaration' &&
    node.declaration &&
    node.declaration.type === 'ObjectExpression'
  );
}

/**
 * 检查节点是否是 setup 函数
 */
export function isSetupFunction(node: any): node is VueSetupFunctionNode {
  return (
    node &&
    node.type === 'Property' &&
    node.key &&
    node.key.type === 'Identifier' &&
    node.key.name === 'setup' &&
    node.value &&
    (node.value.type === 'FunctionExpression' || node.value.type === 'ArrowFunctionExpression')
  );
}

/**
 * 检查节点是否是 Composition API 的 setup 函数
 */
export function isCompositionApiSetup(node: any): boolean {
  return (
    node &&
    node.type === 'ExportDefaultDeclaration' &&
    node.declaration &&
    node.declaration.type === 'CallExpression' &&
    node.declaration.callee &&
    node.declaration.callee.name === 'defineComponent' &&
    node.declaration.arguments &&
    node.declaration.arguments.length > 0 &&
    node.declaration.arguments[0].type === 'ObjectExpression'
  );
}

/**
 * 检查节点是否是 <script setup> 的内容
 */
export function isScriptSetup(node: any): boolean {
  // 这里简化处理，实际上需要检查 <script setup> 标签
  return node && node.type === 'Program';
}

/**
 * 检查节点是否是 useEffect 调用
 */
export function isEffectCall(node: any): node is VueEffectNode {
  if (
    node &&
    node.type === 'CallExpression' &&
    node.callee
  ) {
    // 检查 watchEffect
    if (
      node.callee.type === 'Identifier' &&
      node.callee.name === 'watchEffect'
    ) {
      return true;
    }

    // 检查 watch
    if (
      node.callee.type === 'Identifier' &&
      node.callee.name === 'watch'
    ) {
      return true;
    }

    // 检查 onMounted, onUpdated 等生命周期钩子
    if (
      node.callee.type === 'Identifier' &&
      [
        'onMounted',
        'onUpdated',
        'onUnmounted',
        'onBeforeMount',
        'onBeforeUpdate',
        'onBeforeUnmount',
        'onActivated',
        'onDeactivated',
        'onErrorCaptured'
      ].includes(node.callee.name)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * 检查节点是否是 ref/reactive 调用
 */
export function isReactiveCall(node: any): node is VueRefNode {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee &&
    node.callee.type === 'Identifier' &&
    ['ref', 'reactive', 'computed', 'shallowRef', 'shallowReactive'].includes(node.callee.name)
  );
}

/**
 * 获取依赖数组
 */
export function getDependencyArray(node: VueEffectNode): any[] | null {
  if (node.callee.name === 'watch' && node.arguments.length > 1) {
    // watch 的第二个参数是回调，第三个参数可能是依赖数组或选项对象
    if (node.arguments.length > 2 && node.arguments[2].type === 'ObjectExpression') {
      return null; // 返回 null 表示没有明确的依赖数组
    }
  }

  // watchEffect 的第二个参数可能是选项对象
  if (node.callee.name === 'watchEffect' && node.arguments.length > 1) {
    if (node.arguments[1] && node.arguments[1].type === 'ObjectExpression') {
      return null;
    }
  }

  return null; // 其他情况没有明确的依赖数组
}

/**
 * 获取函数体内使用的变量
 */
export function getUsedVariables(functionBody: any): Set<string> {
  const usedVars = new Set<string>();

  function traverse(node: any) {
    if (!node) return;

    // 检查标识符
    if (node.type === 'Identifier') {
      usedVars.add(node.name);
    }

    // 递归遍历所有属性
    for (const key in node) {
      if (typeof node[key] === 'object' && node[key] !== null) {
        if (Array.isArray(node[key])) {
          node[key].forEach((item: any) => {
            if (item && typeof item === 'object') {
              traverse(item);
            }
          });
        } else {
          traverse(node[key]);
        }
      }
    }
  }

  traverse(functionBody);
  return usedVars;
}

/**
 * 检查条件渲染中的常见问题
 */
export function checkConditionalRendering(node: any): { hasIssue: boolean; message?: string } {
  // 这里简化处理，实际上需要更复杂的逻辑
  if (
    node.type === 'ConditionalExpression' ||
    node.type === 'LogicalExpression'
  ) {
    // 检查是否在条件渲染中使用了不安全的表达式
    // 例如：可能为 undefined 的属性访问
    if (
      node.test &&
      node.test.type === 'MemberExpression' &&
      !node.test.optional // 没有使用可选链
    ) {
      return {
        hasIssue: true,
        message: '条件渲染中可能存在空值访问，建议使用可选链操作符 (?.) 或添加空值检查'
      };
    }
  }

  return { hasIssue: false };
}

/**
 * 检查 Props 验证
 */
export function checkPropValidation(node: any): { hasIssue: boolean; message?: string } {
  // 检查单个 prop 定义
  if (node.type === 'Property') {
    // 检查简单类型的 prop，如 name: String
    if (node.value && node.value.type === 'Identifier') {
      return {
        hasIssue: true,
        message: 'Props 定义应使用对象语法指定类型'
      };
    }

    // 检查空对象类型的 prop，如 name: {}
    if (
      node.value &&
      node.value.type === 'ObjectExpression' &&
      (!node.value.properties || node.value.properties.length === 0)
    ) {
      return {
        hasIssue: true,
        message: 'Props 定义缺少类型验证，建议添加 type 属性'
      };
    }

    // 检查对象类型的 prop 是否缺少 type 属性
    if (
      node.value &&
      node.value.type === 'ObjectExpression' &&
      node.value.properties &&
      node.value.properties.length > 0 &&
      !node.value.properties.some(
        (p: any) => p.key && p.key.name === 'type'
      )
    ) {
      return {
        hasIssue: true,
        message: 'Props 定义缺少类型验证，建议添加 type 属性'
      };
    }
  }

  // 检查 props 对象
  if (
    node.type === 'Property' &&
    node.key &&
    node.key.type === 'Identifier' &&
    node.key.name === 'props'
  ) {
    if (
      node.value.type === 'ObjectExpression' &&
      node.value.properties
    ) {
      for (const prop of node.value.properties) {
        if (
          prop.value.type === 'ObjectExpression' &&
          !prop.value.properties.some(
            (p: any) => p.key && p.key.name === 'type'
          )
        ) {
          return {
            hasIssue: true,
            message: 'Props 定义缺少类型验证，建议添加 type 属性'
          };
        }
      }
    }
  }

  return { hasIssue: false };
}
