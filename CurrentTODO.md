# Current TODO — Week 1: Foundation + LunchUp Entry Point

## 状态说明
- [ ] 未开始
- [x] 完成

---

## 优先级顺序

### 1. 修复 Meetings 持久化（前置必做）
- [x] 新建 `models/Meeting.js`（字段：participants[], dateTime, location, topic, status, createdAt）
- [x] 改 `routes/meetings.js` — 把内存 Map 换成 Mongoose CRUD，保留 demo mode fallback

### 2. 新建 ProjectSession 数据模型
- [x] 新建 `models/ProjectSession.js`（字段：sessionId, title, description, participants[{userId, role}], status, createdFromMeeting, createdAt）

### 3. 新建 ACP 后端路由
- [x] 新建 `routes/projects.js`（端点：POST /api/projects, GET /api/projects, GET /api/projects/:id, PUT /api/projects/:id/status）
- [x] 改 `server.js` — 注册新路由（第 110 行附近）

### 4. 前端：新建 Sessions 页面
- [x] 新建 `client/src/components/Sessions.js`（列表页 + 创建表单 + 状态 badge）

### 5. 前端：Meetings 页面加"Start Project"入口
- [x] 改 `client/src/components/Meetings.js` — 在确认的 meeting 卡片上加 "Start a Project Together →" 按钮

### 6. 前端：路由 + 导航栏
- [x] 改 `client/src/App.js` — 加路由 `/projects`
- [x] 改 `client/src/components/Navbar.js` — 加 "Projects" 导航链接

### 7. 前端：Matches 页面次级入口（可选）
- [ ] 改 `client/src/components/Matches.js` — 用户卡片上加 "Start Project" 次级 CTA

---

# Current TODO — Week 2: Harness + Guided Collaboration

## 目标
把 ACP 从"记录工具"升级成"结构化协作引擎"：用 AI 帮两个刚认识的人立刻拆解出项目计划、分好角色、明确下一步。

## 状态说明
- [ ] 未开始
- [x] 完成

---

## 优先级顺序

### 1. AI 接入基础（前置，其他任务依赖它）
- [x] 在 `.env.example` 加 `ANTHROPIC_API_KEY` 字段（不填真实值，只加占位）
- [x] 安装 Anthropic SDK：`npm install @anthropic-ai/sdk`
- [x] 新建 `utils/aiClient.js` — 封装 Claude API 调用，统一处理 key 缺失时的 fallback（返回模拟数据，保持 demo mode 可用）

### 2. Harness 后端路由（核心）
- [x] 新建 `routes/harness.js`，包含 `POST /api/harness/generate`
- [x] 改 `server.js` — 注册 `/api/harness` 路由
- [x] AI prompt 已接入参与者技能，输出结构化 JSON

### 3. 数据模型扩展
- [x] 改 `models/ProjectSession.js` — 加字段：
  - `aiPlan: { projectIdea: String, taskBreakdown: [String], roles: [String], nextSteps: [String] }`
  - `harnessStatus: { type: String, enum: ['pending', 'generated', 'confirmed'], default: 'pending' }`

### 4. 前端：Guided Project Start 向导（核心 UI）
- [x] 新建 `client/src/components/HarnessFlow.js` — 三步向导：
  - **Step 1**：输入框 "What do you want to build together?"（可选填背景/技能）
  - **Step 2**：展示 AI 生成的 MVP 计划、角色分配、任务列表、下一步（loading 状态 + 结果卡片）
  - **Step 3**：确认 → 创建 ProjectSession，跳转到 Sessions 页
- [x] 向导需支持 demo fallback（AI key 没有时展示模拟结果，不报错）

### 5. 前端：Meetings 页接入向导
- [x] 改 `client/src/components/Meetings.js` — "Start a Project Together" 按钮点击后打开 HarnessFlow 向导（而不是直接跳页）
- [x] 把 meeting 的 participants 信息自动传入 HarnessFlow（预填参与者）

### 6. 前端：Sessions 页展示 AI 计划
- [x] 改 `client/src/components/Sessions.js` — Session 详情展示 AI 生成内容：
  - 项目建议描述
  - 任务列表（可勾选）
  - 角色分配 badge
  - 下一步行动清单
- [x] 加 "Regenerate Plan" 按钮（重新调用 AI）

### 7. 前端：会后提示入口（LunchUp 集成）
- [x] 改 `client/src/components/Meetings.js` — 状态为 `confirmed` 的 meeting 卡片底部加提示语：
  - "Ready to build something together? Start a guided project →"
  - 点击进入 HarnessFlow 向导

### 8. 端到端测试（每个任务完成后做）
- [ ] 无 AI key（demo mode）：完整跑通向导，确认 fallback 数据展示正常
- [ ] 有 AI key：输入两人背景，确认 AI 返回结构化计划，Sessions 页显示正确

---

## 后续优化方向（Week 3+ 再做）

### A. 扩展 match.js 评分维度（算法层）
- [ ] 在 `routes/match.js` 现有四维评分基础上加"项目互补度"维度
- [ ] 逻辑：技能互补（一个工程师 + 一个设计师）加分，技能重叠扣分
- [ ] 目标：匹配人时不只看"合不合得来"，还看"能不能一起做项目"

### B. Embedding 语义技能匹配（AI 层）
- [ ] 把用户技能描述转成向量（embedding），用语义相似度判断技能互补性
- [ ] 比关键词匹配更智能：能理解"机器学习"和"AI Engineer"是相关的
- [ ] 依赖：需要 embedding API，复杂度较高，MVP 后再评估
