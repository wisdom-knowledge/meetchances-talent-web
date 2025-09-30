# 问卷收集组件使用说明

## 组件接口

```typescript
interface QuestionnaireCollectionProps {
  nodeData?: QuestionnaireNodeData  // 当前节点数据
  jobApplyId?: string | number     // 当前申请ID
}
```

## 使用示例

```tsx
import QuestionnaireCollection from '@/features/interview/components/questionnaire-collection'

// 在prepare页面中使用
<QuestionnaireCollection
  nodeData={{
    id: 1150,
    status: 0, // 0: 未填写, 20: 待审核, 40: 被拒绝
    node_name: "ResumeCheck",
    node_config: {
      url: "https://your-feishu-form-url", // 问卷链接
      // 或者使用 form_url, questionnaire_url
    }
    // ... 其他节点数据
  }}
  jobApplyId="12345"
/>
```

## 问卷链接配置

组件会从 `nodeData.node_config` 中按优先级获取问卷链接：
1. `node_config.url`
2. `node_config.form_url` 
3. `node_config.questionnaire_url`

## 三种状态展示

### 1. 未填写状态 (status: 0)
- 显示紫色加载动画
- 提示用户点击链接填写问卷
- 显示飞书问卷链接
- 显示专属申请ID

### 2. 待审核状态 (status: 20)
- 显示紫色加载动画
- 提示已收到信息，等待审核

### 3. 被拒绝状态 (status: 40)
- 显示紫色加载动画
- 感谢用户关注
- 提供职位列表链接

## 优化特性

- **简化接口**：只需要传入节点数据和岗位ID
- **自动状态判断**：根据节点状态自动显示对应界面
- **智能ID显示**：优先使用jobId，回退到nodeData.id
- **响应式设计**：适配不同屏幕尺寸
