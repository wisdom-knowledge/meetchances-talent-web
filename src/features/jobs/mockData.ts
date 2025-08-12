import { JobType } from "@/constants/explore";
import { Job } from "@/types/solutions";

export const ExploreJobs: Job[] = [
    {
      id: "senior-software-engineer",
      title: "资深软件工程师",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一个极具挑战性的项目招聘顶尖的资深软件工程师，该项目与一家领先的基座模型AI Lab合作。</p>
         <p class="mb-2 mt-2 text-base text-gray-600">这些项目涉及常见的软件工程任务，包括调试、重构以及复杂代码库的测试编写。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>拥有5年以上在头部科技公司工作的经验</li>
           <li>热衷于提升模型在复杂软件工程任务中的能力</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>工作完全远程，时间灵活</li>
           <li>每周预计投入20小时，试点期为3-4周</li>
           <li>项目包含晋升机会，表现优异者可长期合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 160-400 元人民币</li>
           <li>按记录工时通过 支付宝/微信 每周结算</li>
           <li>独立承包商身份</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">关于一面千识</span>：一面千识总部位于北京海淀，专注于为全球顶尖的 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [160, 400],
      referralBonus: 1000,
    },
    {
      id: "economics-finance-expert",
      title: "经济/金融专家",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一个与全球领先的基座模型AI Lab寻找具备专业背景的经济与金融领域专家。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>拥有经济学或金融学博士学历，或</li>
           <li>拥有8年以上经济或金融领域的专业工作经验</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>具备快速阅读长篇文本、提取关键信息并准确理解整体语境的能力</li>
           <li>能对 AI 生成的回答进行分析，指出问题，并重写为更清晰、有逻辑的表述</li>
           <li>能比较不同思路，判断优劣，并清晰解释理由</li>
           <li>每周最少工作时间为 5 小时，优秀者每周最多可获得 20 小时的任务量</li>
           <li>表现良好将增加被 Meetchances/一面千识 未来项目选中的机会</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>提交简历并进行学历验证</li>
           <li>30 分钟的 AI 视频面试</li>
           <li>包含文本分析与修改的测试任务（约 2 小时，完成即可获得 400 元人民币 报酬）</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 200–500 元人民币，视经验与资历而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [200, 500],
      referralBonus: 2000,
    },
    {
      id: "tech-support-expert",
      title: "技术支持专家",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一家全球顶尖的基座模型 AI Lab 招募技术支持专家，参与一个短期、高强度的研究项目。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>拥有 4 年以上全职技术支持相关经验（技术支持、IT 服务、系统运维等）</li>
           <li>具备扎实的一线技术支持能力，了解常见 IT 服务流程与用户需求</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>基于自身职业经验，为 AI 系统设计与计算机技术支持相关的专业问题</li>
           <li>需使用台式机或笔记本电脑</li>
           <li>项目预计持续 3–4 周，每周至少投入 15 小时</li>
           <li>表现良好将增加被 Meetchances/一面千识 未来项目选中的机会</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>AI 视频面试，回答技术支持与 IT 相关问题</li>
           <li>需共享屏幕完成约 15 分钟现场任务：排查问题并操控电脑解决</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 150–300 元人民币，视经验与资历而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [150, 300],
      referralBonus: 1000,
    },
    {
      id: "math-expert",
      title: "数学专家",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一家全球顶尖的人工智能实验室招聘数学专家，为下一代基础模型提供具备严谨逻辑的数学训练数据。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>数学或相关领域硕士及以上学历</li>
           <li>3 年以上数学研究或数学建模、算法设计等相关经验</li>
           <li>熟悉代数、微积分、实/复分析、离散数学、图论与组合、微分方程、动力系统、数值分析、逻辑、概率统计等任一或多项</li>
           <li>具备扎实的逻辑推理能力与优秀的书面表达能力</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>设计、审核并优化与数学相关的 AI 提示词（prompts）</li>
           <li>项目全程远程，时间灵活；每周 10–20 小时，高质量参与者可至 40 小时</li>
           <li>初期项目周期 1–2 个月，后续可能延长</li>
           <li>表现良好将增加被 Meetchances/一面千识 未来项目选中的机会</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>AI 视频面试，回答与数学及形式逻辑相关的问题</li>
           <li>共享屏幕完成约 25 分钟现场任务：设计训练用数学问题、比较多模型输出并分析优劣</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 150–350 元人民币，视经验与资历而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [150, 350],
      referralBonus: 1200,
    },
    {
      id: "senior-tutor",
      title: "资深课辅老师",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一家顶尖的 AI 公司寻找具有丰富教育经验的辅导老师，参与一项围绕教育实践的前沿 AI 训练项目。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>至少 4 年全职教培行业经验（K12、大学辅导、考试培训等）</li>
           <li>熟悉教学内容设计与学术答疑，有实际辅导学生的经验</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>基于教学/教研经验，设计与教培高度相关的高质量问题</li>
           <li>项目完全远程，时间灵活</li>
           <li>每周至少 15 小时稳定投入，项目预计 3–4 周</li>
           <li>表现良好将增加被 Meetchances/一面千识 未来项目选中的机会</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>AI 视频面试（教培相关）</li>
           <li>完成相应测试题</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 75–200 元人民币，视经验与资历而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [75, 200],
      referralBonus: 500,
    },
    {
      id: "phd-physics",
      title: "物理学博士",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一家全球顶尖的人工智能实验室招募拥有专业背景的物理相关学科博士。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>物理或相关专业博士（在读者需已进入研究阶段 2 年以上）</li>
           <li>至少 2 年教学、科研或应用物理相关经验</li>
           <li>熟悉量子力学、电动力学、热力学、广义相对论等复杂和高级物理主题</li>
           <li>具备扎实的写作能力与批判性思维</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>设计、审核并优化与物理学科相关的问题，训练 AI 的逻辑与概念理解能力</li>
           <li>每周承诺 15 小时工作时间</li>
           <li>首期 3 周试点，顺利后进入长期合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>简短 AI 面试，评估物理背景与学术能力</li>
           <li>第二轮测试，模拟实际项目任务</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 100–250 元人民币，视经验与资历而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [100, 250],
      referralBonus: 500,
    },
    {
      id: "marketing-expert",
      title: "市场营销专家",
      company: "Meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一家全球顶尖的 AI 公司寻找具备专业背景的市场营销专家，参与一项基于真实业务经验的 AI 训练项目。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>4 年以上市场营销经理相关全职经验</li>
           <li>熟悉品牌策略、市场分析、渠道规划、产品推广、营销漏斗管理等</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>基于自身营销管理经验，为 AI 模型设计与“市场营销”密切相关的专业问题</li>
           <li>每周至少投入 15 小时，项目持续 3–4 周</li>
           <li>需使用台式机或笔记本电脑</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>简短 AI 面试，评估市场营销经验</li>
           <li>第二轮测试，模拟实际项目任务</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪范围 100–300 元人民币，视经验与资历而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [100, 300],
      referralBonus: 500,
    },
    {
      id: "phd-statistics",
      title: "统计学博士",
      company: "meetchances/一面千识",
      description:
        `<p class="mb-2 mt-2 text-base text-gray-600">Meetchances/一面千识 正在为一家全球顶尖的人工智能实验室招募统计学博士，参与一项模型能力评估项目，旨在通过专家提出的高质量问题推动大模型在统计学领域的理解与推理能力。</p>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">我们希望你</span>：</p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>拥有来自顶尖高校的统计学博士学位（本科也就读于顶尖高校）</li>
           <li>读写能力出色，逻辑清晰，表达精准</li>
           <li>注重细节，擅长从严谨视角分析问题并提出具有挑战性的问题设计</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">更多工作细节</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>基于统计学专业知识，为 AI 模型设计复杂问题并参与数据质量评估</li>
           <li>有机会与一线 AI 实验室研究人员直接沟通</li>
           <li>每周工作 10–20 小时，优秀者可至 40 小时</li>
           <li>项目周期至少 1–2 个月，表现出色可转长期合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">筛选流程</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>提交简历与学历验证后进入筛选流程：一轮 AI 面试 + 一份技能测试（预计不超 30 分钟）</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600"><span class="font-medium text-black">薪酬与福利</span></p>
         <ul class="mb-4 list-disc pl-4 text-base text-gray-600">
           <li>时薪 300–500 元人民币，视经验与背景而定</li>
           <li>根据记录工时，每周通过 支付宝/微信 支付</li>
           <li>以 Meetchances/一面千识 独立承包商身份合作</li>
         </ul>
         <p class="mb-2 mt-2 text-base text-gray-600">一面千识总部位于北京海淀，专注为全球顶尖 AI 实验室和 Agent 团队招募各领域专家。我们已利用 AI 技术成功帮助成千上万的专业人才找到理想职位。</p>`,
      jobType: JobType.PART_TIME,
      salaryType: "hour",
      salaryRange: [300, 500],
      referralBonus: 1500,
    },
  ];


