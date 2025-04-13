# 变更日志

所有对项目的显著更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.2.0] - 2024-04-13

### 新增
- 添加了 Pinia 相关规则
- 添加了 Vuex 相关规则

### 修复
- 修复了测试中的循环引用问题

### 变更
- 更新了文档，添加了更多示例
- 优化了项目结构和配置

## [0.1.0] - 2023-04-13

### 新增
- 初始版本发布
- 添加了 Vue 核心规则：
  - effect-deps: 检查 Vue 的副作用函数中的依赖问题
  - reactive-refs: 检查 Vue 的响应式 API 使用问题
  - conditional-rendering: 检查 Vue 的条件渲染问题
  - prop-validation: 检查 Vue 的 Props 验证问题
