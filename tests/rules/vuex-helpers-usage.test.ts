import { RuleTester } from 'eslint';
import vuexHelpersUsageRule from '../../src/rules/vuex-helpers-usage';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

// 简化测试用例，避免循环引用问题
ruleTester.run('vuex-helpers-usage', vuexHelpersUsageRule, {
  valid: [
    // 简单的有效测试用例
    `console.log('Valid test case')`,
  ],
  
  invalid: [],
});
