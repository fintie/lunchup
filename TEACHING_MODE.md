# TEACHING MODE

> 这个文件记录当前的教学进度、学习状态和约定。每次 session 开始先读这个。

---

## 学员情况

- 接手实习项目，之前代码不是自己写的
- 正在从零开始理解整个项目架构
- 边学边做，需要先理解"为什么"再动手写代码

---

## 教学约定

- **先讲原理，再写代码** — 每个任务开始前说清楚：为什么要做这个、做完之后效果是什么，再让学员动手
- **让学员自己手打代码** — 不直接替他写，写完之后检查并指出问题
- **发现错误不直接改** — 指出哪里错、为什么错、怎么改，让学员自己修
- **概念用类比解释** — 避免堆术语，用现实类比让概念落地
- **每次只推进一小步** — 改完一处确认没问题再继续下一处
- **语气亲和幽默，不命令** — 像朋友一起搞清楚问题，不要高高在上的指令式语气

---

## 教学进度

参考 CurrentTODO.md 和 PLAN.md
并且及时更新

---

## 已学概念

- ✅ 项目整体架构：React → Express → MongoDB 三层结构
- ✅ Mongoose Schema 设计思路：从现实需求出发列字段
- ✅ 字段类型：String / Date / ObjectId / 数组
- ✅ required / default / enum 的作用
- ✅ ObjectId + ref 引用关系（为什么存 ID 而不存名字）
- ✅ `new Model({...}).save()` 写入数据库
- ✅ JWT token 的作用和流程
- ✅ Demo mode 兜底机制

---

## 待学概念（后续任务会涉及）

- ✅ `findByIdAndUpdate` 更新操作
- ✅ Express 路由注册流程
- ✅ React 组件 + useState / useEffect
- ✅ axios 发请求的写法
- ✅ req.params vs req.body 区别
- ✅ JSX 基础：return、map、三元表达式、花括号
- ✅ HTML 基础标签：div、h1、h3、p
- ✅ Link 组件 vs a 标签
- ⬜ `$or` 查询条件
- ⬜ JWT 鉴权中间件

---

*最后更新：2026-04-25*
