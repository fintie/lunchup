# CLAUDE.md

这个文件是给 Claude Code 看的项目说明书。每次新 session 开始，请先读完这个文件再开工。

---

## 项目简介

**LunchUp** — 澳洲寻找合伙人的社交平台。用户可以通过匹配算法找到有共同背景、技能、话题的人，约在同城见面拓展人脉。

- **当前阶段**：MVP 开发中
- **目标用户**：澳洲各大城市的职场人
- **核心价值**：把网络匹配落地到线下见面

---

## 开工前必读

> 每次新 session 开始，请按顺序做这三件事：
> 1. 读 `PLAN.md` — 了解当前开发阶段和优先级
> 2. 读 `CurrentTODO.md` — 确认本周具体任务和完成状态
>
> **确认是否是教学模式** — 当用户说“教学模式”的时候 切换为教学模式
参考 `TEACHING_MODE.md` — 了解当前教学进度和学员状态，不要直接帮学员写代码，先讲原理，让他自己动手，写完再检查。详见 `TEACHING_MODE.md`。

---

## 项目文档地图

| 文件 | 用途 |
|------|------|
| `TEACHING_MODE.md` | 教学进度、学员状态、教学约定 |
| `PLAN.md` | 总体路线图、里程碑、当前阶段目标 |
| `CurrentTODO.md` | 本周具体任务清单和完成状态 |
| `decisions.md` | 历史决策记录（为什么选这个方案、否决了什么） |
| `DEPLOYMENT.md` | 部署步骤，含 MongoDB Atlas 和 Render 配置 |

---

## 常用命令

**后端**（在 `lunchup/` 目录下执行）：
```bash
npm run dev    # 开发模式启动，nodemon 自动重启，端口 3001
npm start      # 生产模式启动
npm run seed   # 往 MongoDB 写入澳洲演示用户数据
```

**前端**（在 `lunchup/client/` 目录下执行）：
```bash
npm start      # 启动 React 开发服务器，端口 3000
npm run build  # 打包生产版本
npm test       # 跑测试
```

---

## 架构说明

### 整体结构
三层架构：React 前端（3000）→ Express 后端（3001）→ MongoDB

### 后端（`server.js` + `routes/`）
- Express.js API，JWT 中间件保护路由
- 主要路由：
  - `routes/auth.js` — 登录、注册、忘记/重置密码
  - `routes/users.js` — 用户资料 CRUD
  - `routes/match.js` — 匹配算法（背景、技能、话题、位置四个维度加权打分）
  - `routes/meetings.js` — 约饭调度（⚠️ 目前无持久化，重启数据丢失）
  - `routes/news.js` / `routes/opportunities.js` — 读取本地 JSON 数据

- **Demo mode 兜底**：启动时 `server.js` 在内存里生成约 70 个澳洲假用户（存在 Map 里）。MongoDB 连不上时所有登录和匹配走这批数据。**App 没有数据库也能完整运行。**

### 前端（`client/src/`）
- React 18，HashRouter（URL 带 `#`，如 `#/matches`）
- JWT token 存在 localStorage
- Axios baseURL 自动切换：生产用 `/api`，开发用 `http://localhost:3001/api`
- 核心页面：
  - `Matches.js` — 发现和匹配用户
  - `Live.js` — Socket.io 实时匹配
  - `Meetings.js` — 约饭日程

### 数据模型
- `models/User.js` — 用户
- `models/Meeting.js` — 约饭（Week 1 新增，已接入 DB 持久化）
- ProjectSession model 待建（Week 1 任务 3）

---

## ⚠️ 已知技术债（开发时必须考虑）

| 问题 | 位置 | 优先级 |
|------|------|--------|
| ~~约饭数据无持久化~~ | ~~`routes/meetings.js`~~ | ✅ Week 1 已解决 |
| ~~没有 Meeting 数据模型~~ | ~~`models/` 目录缺失~~ | ✅ Week 1 已解决 |
| Demo mode 和生产代码耦合 | `server.js` 内存 Map | 中，后期重构 |
| 新闻/机会数据是静态 JSON | `data/*.json` | 低，MVP 后再议 |

> 遇到这些区域的代码，先确认改动是否影响 demo mode 兜底逻辑，再动手。

---

## 环境变量

复制 `.env.example` → `.env`，填写以下变量：

```
MONGODB_URI   # MongoDB 连接字符串（不填走 demo mode）
JWT_SECRET    # Token 签名密钥（必填，不要写进代码）
PORT          # 后端端口，默认 3001
CORS_ORIGIN   # 前端地址，用于跨域
```

⚠️ **任何情况下不要把真实密钥写进这个文件或提交到 git。**

---

## 部署

使用 Render 平台，配置在 `render.yaml`。
详细步骤见 `DEPLOYMENT.md`，包括 MongoDB Atlas 设置和环境变量配置。

---

## 工作约定（请严格遵守）

### 开工前
- 非trivial 的改动，**先给我方案再写代码**，我确认后再动手
- 每次 session 开始先问我今天要推进哪块，不要自己假设
- 要 `npm install` 新依赖之前，**先问我**

### 写代码时
- 改 `routes/match.js` 的评分权重前，**用大白话解释改动逻辑**
- 优先改现有文件，不要随意新建文件
- 涉及 demo mode 兜底逻辑的区域，改动前说明影响范围

### 任务追踪
- 做了重要决策（选方案、否决某个思路），提醒我记录到 `docs/decisions.md`
- 发现新的 bug 或技术债，告诉我要不要加进文档

### 汇报风格
- 直接说问题和方案，不用客套
- 不确定的地方直接说不确定，不要瞎猜然后把我带跑偏
- 任务完成后简短总结做了什么、还剩什么

---

## 决策历史（重要，避免重复讨论）

> 详细记录在 `docs/decisions.md`，这里只列关键结论：

- **Demo mode 保留**：MVP 阶段对外 demo 不需要数据库，先保留这个机制
- **HashRouter 而非 BrowserRouter**：部署在静态托管时避免 404 问题，先不改
- **新闻/机会用静态 JSON**：MVP 阶段够用，不值得现在接真实数据源

---

*最后更新：2026-04-25*