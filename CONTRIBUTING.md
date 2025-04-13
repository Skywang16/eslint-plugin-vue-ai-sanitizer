# 贡献指南

感谢您对 eslint-plugin-vue-ai-sanitizer 的贡献兴趣！本文档将指导您如何为项目做出贡献。

## 行为准则

本项目采用 [Contributor Covenant](./CODE_OF_CONDUCT.md) 行为准则。请确保您的所有交互都遵循这些准则。

## 如何贡献

### 报告 Bug

如果您发现了 bug，请通过 GitHub Issues 报告，并包含以下信息：

1. 问题的简短描述
2. 重现步骤
3. 预期行为
4. 实际行为
5. 环境信息（ESLint 版本、Node.js 版本等）
6. 如果可能，提供一个最小复现示例

### 功能请求

如果您希望添加新功能或改进现有功能，请先通过 GitHub Issues 讨论。这样可以确保您的工作不会与其他人的工作重叠，并且符合项目的目标和方向。

### 提交 Pull Request

1. Fork 项目仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

### 开发流程

1. 安装依赖：
   ```bash
   npm install
   ```

2. 构建项目：
   ```bash
   npm run build
   ```

3. 运行测试：
   ```bash
   npm test
   ```

4. 运行 lint：
   ```bash
   npm run lint
   ```

## 代码规范

- 所有代码必须通过 TypeScript 类型检查
- 所有新功能必须有相应的测试
- 所有测试必须通过
- 代码应遵循项目现有的代码风格

## 添加新规则

如果您想添加新规则，请遵循以下步骤：

1. 在 `src/rules` 目录下创建新规则文件
2. 在 `src/index.ts` 中注册新规则
3. 在 `tests/rules` 目录下为新规则创建测试文件
4. 在 README.md 中添加新规则的文档

新规则应该：

- 解决 AI 生成的 Vue 代码中的常见问题
- 提供有用的错误消息
- 尽可能提供自动修复功能
- 有充分的测试覆盖率

## 提交消息规范

请使用清晰、描述性的提交消息，遵循以下格式：

```
<类型>: <描述>

[可选的详细描述]

[可选的关闭 issue]
```

类型可以是：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更改
- `style`: 不影响代码含义的更改（空格、格式化等）
- `refactor`: 既不修复 bug 也不添加功能的代码更改
- `perf`: 提高性能的代码更改
- `test`: 添加或修正测试
- `chore`: 对构建过程或辅助工具的更改

例如：

```
feat: 添加检查 Vue Router 导航守卫的规则

添加了一个新规则，用于检查路由跳转前是否进行了权限检查。

Closes #123
```

## 许可证

通过贡献您的代码，您同意您的贡献将根据项目的 [MIT 许可证](./LICENSE) 进行许可。
