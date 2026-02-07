# 灵触·随行 (TactileNav) — 项目上下文

## 项目简介
为视障人士设计的触觉导航辅助系统。通过 31×21 可刷新触觉点阵将环境信息转化为触觉图案，安装在盲杖握持区，使用者通过触摸即可感知周围障碍物分布。

## 架构概览
```
感知层(摄像头/传感器) → 算法层 → 集成层 → 硬件层(BLE) → 触觉点阵
                                    ↕
                              前端 UI (Vue)
```

## 三个协作部分

### Part 1: 算法层 (`src/core/AlgorithmLayer.js`)
**负责人**: 算法组
**职责**: 环境感知 → 深度估计 → 栅格映射 → 触觉编码
**需要实现**:
- `produce_grid_map()`: 地图模式，摄像头→深度估计→31×21 grid
- `produce_grid_zoom()`: 放大模式，局部细节→侧视图映射
- 非均匀距离编码、三级 Level 编码、防抖设计
- 参考: 初赛文档.md §2.3.1, §2.3.2

### Part 2: 集成与硬件通信层 (`src/core/Integration.js` + `HardwareLayer.js`)
**负责人**: 硬件/通信组
**职责**: BLE 通信、系统调度、模式管理
**需要实现**:
- `HardwareLayer`: BLE GATT 服务、数据分包传输、自动重连、按钮事件接收
- `Integration`: 已有框架，需接入实际 BLE 连接状态
- 参考: 初赛文档.md §2.1.3, §2.1.5

### Part 3: 前端界面 (`src/App.vue` + `src/components/`)
**负责人**: UI 组
**职责**: 移动端 APP 界面
**需要实现**:
- 无障碍适配 (TalkBack/VoiceOver)
- 配置页（刷新频率、阈值、语音开关）
- 响应式移动端布局
- 参考: 初赛文档.md §2.2.3

## 核心数据协议
```json
{
  "grid": [651个元素],   // 31行×21列，按行展开，值 0/1/2
  "seq": 123,            // 帧编号
  "mode": 0              // 0=地图模式, 1=放大模式
}
```

## 点阵坐标
- 31行(前后) × 21列(左右)，共 651 触点
- 自身点: (r=20, c=10)，即 grid[430]
- 前方20行(r=0..19): 远场→中场→近场
- 后方10行(r=21..30): 靠内→靠外
- 左右各10列

## Level 编码
- 0 = 常平（安全）
- 1 = 中等凸起（注意）
- 2 = 完全凸起（危险，需避让）

## 开发命令
```bash
npm install    # 安装依赖
npm run dev    # 启动开发服务器 (Vite)
npm run build  # 构建生产版本
```

## 技术栈
- Vue 3 + Vite
- 纯 JS（无 TypeScript）
- BLE 5.0（硬件通信，待接入）
- 深度学习模型（Depth Anything / MiDaS，待接入）

## 文件结构
```
├── claude.md                    # 本文件：项目上下文
├── 初赛文档.md                   # 完整技术文档
├── index.html                   # 入口 HTML + 全局 CSS
├── package.json                 # 项目配置
├── vite.config.js               # Vite 构建配置
└── src/
    ├── main.js                  # 应用入口：初始化三层 + Vue
    ├── App.vue                  # 根组件：标签页导航
    ├── core/
    │   ├── constants.js         # 全局常量（31×21 点阵规格）
    │   ├── AlgorithmLayer.js    # Part 1: 算法层（待实现）
    │   ├── HardwareLayer.js     # Part 2: 硬件通信层（待实现）
    │   └── Integration.js       # Part 2: 集成层（框架已就绪）
    └── components/
        ├── StatusPage.vue       # Part 3: 状态页
        ├── DebugPage.vue        # Part 3: 调试页
        ├── DemoPage.vue         # Part 3: 演示页
        └── GridPreview.vue      # Part 3: 点阵可视化组件
```
