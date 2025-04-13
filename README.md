# eslint-plugin-vue-ai-sanitizer

[![npm version](https://img.shields.io/npm/v/eslint-plugin-vue-ai-sanitizer.svg)](https://www.npmjs.com/package/eslint-plugin-vue-ai-sanitizer)
[![license](https://img.shields.io/npm/l/eslint-plugin-vue-ai-sanitizer.svg)](https://github.com/yourusername/eslint-plugin-vue-ai-sanitizer/blob/main/LICENSE)

ESLint 插件，用于检测和修复 AI 生成的 Vue 代码中的常见问题。

## 特性

- 检测 Vue 的副作用函数中的依赖问题
- 检测 Vue 的响应式 API 使用问题
- 检测 Vue 的条件渲染问题
- 检测 Vue 的 Props 验证问题
- 检测 Vuex store 结构问题
- 检测 Vuex 辅助函数使用问题
- 检测 Pinia store 使用问题

## 安装

```bash
npm install --save-dev eslint-plugin-vue-ai-sanitizer
# 或
yarn add -D eslint-plugin-vue-ai-sanitizer
```

## 使用

在你的 `.eslintrc` 文件中添加插件：

```json
{
  "plugins": ["vue-ai-sanitizer"],
  "extends": ["plugin:vue-ai-sanitizer/recommended"]
}
```

或者，你可以单独配置每个规则：

```json
{
  "plugins": ["vue-ai-sanitizer"],
  "rules": {
    "vue-ai-sanitizer/effect-deps": "warn",
    "vue-ai-sanitizer/reactive-refs": "error",
    "vue-ai-sanitizer/conditional-rendering": "warn",
    "vue-ai-sanitizer/prop-validation": "warn",

    "vue-ai-sanitizer/vuex-store-structure": "warn",
    "vue-ai-sanitizer/vuex-helpers-usage": "warn",
    "vue-ai-sanitizer/pinia-store-usage": "warn"
  }
}
```

## 规则

## Vue 核心规则

### effect-deps

检查 Vue 的副作用函数（如 `watchEffect`、`watch` 和生命周期钩子）中的依赖问题。

#### 规则详情

- 检查 `watchEffect` 中使用的外部变量，建议转换为 `watch` 以明确依赖
- 检查 `watch` 的依赖数组是否完整
- 检查 `watch` 的依赖数组中是否有不必要的依赖
- 检查生命周期钩子中使用的外部变量

#### 示例

```js
// ❌ 错误：watchEffect 使用了外部变量但没有明确依赖
const count = ref(0);
watchEffect(() => {
  console.log(count.value);
});

// ✅ 正确：使用 watch 明确依赖
const count = ref(0);
watch([count], () => {
  console.log(count.value);
});
```

### reactive-refs

检查 Vue 的响应式 API（如 `ref`、`reactive`）使用问题。

#### 规则详情

- 检查 `ref`/`reactive` 调用是否缺少初始值
- 检查是否对复杂对象使用了 `ref` 而非 `reactive`
- 检查是否对原始类型使用了 `reactive` 而非 `ref`
- 检查 `reactive` 对象中是否嵌套了 `ref`

#### 示例

```js
// ❌ 错误：对复杂对象使用 ref
const user = ref({ name: 'John', age: 30 });

// ✅ 正确：对复杂对象使用 reactive
const user = reactive({ name: 'John', age: 30 });

// ❌ 错误：对原始类型使用 reactive
const count = reactive(0);

// ✅ 正确：对原始类型使用 ref
const count = ref(0);

// ❌ 错误：reactive 对象中嵌套 ref
const state = reactive({
  count: ref(0),
  name: 'John'
});

// ✅ 正确：reactive 对象中直接使用值
const state = reactive({
  count: 0,
  name: 'John'
});
```

### conditional-rendering

检查 Vue 的条件渲染问题。

#### 规则详情

- 检查条件渲染中是否存在不安全的属性访问
- 检查条件表达式是否过于复杂
- 检查列表渲染是否缺少唯一的 key 属性

#### 示例

```js
// ❌ 错误：不安全的属性访问
{user.address.city ? <span>{user.address.city}</span> : <span>No city</span>}

// ✅ 正确：使用可选链
{user.address?.city ? <span>{user.address.city}</span> : <span>No city</span>}

// ❌ 错误：条件表达式过于复杂
{user.isAdmin && user.age > 18 && user.permissions.canEdit && user.name.length > 0 ? (
  <span>Admin can edit</span>
) : (
  <span>Not allowed</span>
)}

// ✅ 正确：提取为计算属性
const canEdit = computed(() =>
  user.isAdmin && user.age > 18 && user.permissions.canEdit && user.name.length > 0
);

// 然后在模板中使用
{canEdit.value ? <span>Admin can edit</span> : <span>Not allowed</span>}
```

### prop-validation

检查 Vue 的 Props 验证问题。

#### 规则详情

- 检查 Props 是否有类型验证
- 检查 Props 是否指定了是否必需或默认值
- 检查复杂类型的 Props 是否有自定义验证器

#### 示例

```js
// ❌ 错误：缺少类型验证
props: {
  name: {}
}

// ✅ 正确：有类型验证
props: {
  name: {
    type: String,
    required: true
  }
}

// ❌ 错误：复杂类型缺少验证器
props: {
  user: {
    type: Object,
    required: true
  }
}

// ✅ 正确：复杂类型有验证器
props: {
  user: {
    type: Object,
    required: true,
    validator: (value) => {
      return value && typeof value.name === 'string';
    }
  }
}
```

## Vue 全家桶规则

### vuex-store-structure

检查 Vuex store 结构问题。

#### 规则详情

- 检查是否直接修改 state（应使用 mutation）
- 检查大型 store 是否使用命名空间模块
- 检查 mutation/action 类型是否使用常量定义
- 检查不必要的 actions（只包含一个 commit 调用）

#### 示例

```js
// ❌ 错误：直接修改 state
state.count++;

// ✅ 正确：使用 mutation
commit('INCREMENT');

// ❌ 错误：大型 store 没有使用模块
const store = createStore({
  state: {
    users: [],
    products: [],
    orders: [],
    // ... 更多状态
  }
});

// ✅ 正确：使用模块化结构
const store = createStore({
  modules: {
    users: usersModule,
    products: productsModule,
    orders: ordersModule
  }
});
```

### vuex-helpers-usage

检查 Vuex 辅助函数使用问题。

#### 规则详情

- 检查是否混合使用了不同风格的 Vuex 映射函数
- 检查是否使用了冗余的 Vuex 映射函数
- 检查使用命名空间模块时是否提供了命名空间参数
- 检查单个属性映射是否使用了不必要的数组语法

#### 示例

```js
// ❌ 错误：混合使用不同风格
const store = useStore(); // Composition API
computed: {
  ...mapState(['count']) // Options API
}

// ✅ 正确：统一使用一种风格
setup() {
  const store = useStore();
  return {
    count: computed(() => store.state.count)
  }
}

// ❌ 错误：缺少命名空间
mapState({
  count: state => state.count
})

// ✅ 正确：提供命名空间
mapState('user', {
  count: state => state.count
})
```

### pinia-store-usage

检查 Pinia store 使用问题。

#### 规则详情

- 检查是否直接修改 state（应使用 action）
- 检查 store 是否定义了状态类型
- 检查是否存在不必要的 getters
- 检查是否混合使用了不同风格的 store 访问方式

#### 示例

```js
// ❌ 错误：直接修改 state
const store = useCounterStore();
store.state.count++;

// ✅ 正确：使用 action
const store = useCounterStore();
store.increment();

// ❌ 错误：缺少类型定义
defineStore('counter', {
  state: () => ({
    count: 0
  })
});

// ✅ 正确：添加类型定义
defineStore('counter', {
  state: () => ({
    count: 0
  }) as CounterState
});

// ❌ 错误：不必要的 getter
getters: {
  count: (state) => state.count
}

// ✅ 正确：直接访问 state
// 可以直接使用 store.count
```

## 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解如何贡献代码。

## 变更日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解所有版本变更。

## 行为准则

本项目采用 [Contributor Covenant](./CODE_OF_CONDUCT.md) 行为准则。

## 许可证

[MIT](./LICENSE)
