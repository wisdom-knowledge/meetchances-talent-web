import { useEffect, useRef, useState } from 'react'
import type { ApiJob } from '@/features/jobs/api'
import backImg from '@/assets/images/back.svg'
import avatarsImg from '@/assets/images/avatars.png'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/ui/rich-text'
import JobTitleAndTags from './job-title-and-tags'
import PublisherSection from './publisher-section'

export interface JobDetailContentProps {
  job: ApiJob
  inviteToken?: string
  onBack?: () => void
  recommendName?: string
  isTwoColumn?: boolean
}

const salaryTypeUnit: Record<NonNullable<ApiJob['salary_type']>, string> = {
  hour: '小时',
  month: '月',
  year: '年',
}

export default function JobDetailContent({
  job,
  inviteToken = '',
  onBack,
  recommendName,
  isTwoColumn = false,
}: JobDetailContentProps) {
  const isMobile = useIsMobile()

  const applicationCardRef = useRef<HTMLDivElement>(null)
  const [showFixedBar, setShowFixedBar] = useState(true)

  // 使用 IntersectionObserver 根据申请卡片是否可见切换底部栏
  useEffect(() => {
    if (!isMobile) {
      setShowFixedBar(false)
      return
    }

    const rootEl = document.querySelector(
      '[data-slot="sheet-content"]'
    ) as HTMLElement | null
    const target = applicationCardRef.current
    if (!target) {
      setShowFixedBar(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        // 当申请卡片进入可视区域一定比例时，隐藏固定栏
        setShowFixedBar(!entry.isIntersecting)
      },
      {
        root: rootEl ?? null,
        threshold: 0.2,
      }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [isMobile, job?.id])

  const applyJob = async () => {
    let params = `data=job_id${job.id}`
    if (inviteToken) {
      params = `${params}andinvite_token${inviteToken}`
    }
    let targetUrl
    if (import.meta.env.DEV) {
      targetUrl = `/interview/prepare`
    } else {
      targetUrl = import.meta.env.VITE_INVITE_REDIRECT_URL
    }

    window.location.href = `${targetUrl}?${params}`
  }

  const low = job.salary_min ?? 0
  const high = job.salary_max ?? 0
  const unit = salaryTypeUnit[job.salary_type as keyof typeof salaryTypeUnit] ?? '小时'

  return (
    <div className={cn(isMobile ? 'my-[16px] mx-[8px]' : 'm-[16px]' )}>
      <div
        className={cn(
          isTwoColumn && 'grid grid-cols-1 gap-8 md:grid-cols-[1fr_320px]'
        )}
      >
        <div>
          {onBack && (
            <div className='flex pt-2 pb-2'>
              <button
                type='button'
                onClick={onBack}
                aria-label='返回'
                className='cursor-pointer'
              >
                <img src={backImg} alt="back" className='text-muted-foreground h-6 w-6' />
              </button>
            </div>
          )}

          {/* 顶部信息区（桌面在左列展示，这里仅用于小屏） */}
          <div className='flex flex-row items-start justify-between border-b border-gray-200 pt-5 pb-5'>
            {/* 左侧：标题和标签 */}
            <div className='min-w-0 flex-1'>
              <JobTitleAndTags job={job} />
              {/* 移动端：薪资信息显示在左侧标题下方 */}
              {isMobile && (
                <div>
                  <div className='flex items-center gap-2'>
                    <div className='text-xl font-semibold text-gray-900'>
                      ¥{low}~¥{high}
                    </div>
                    <div className='text-xs text-gray-500'>{`每${unit}`}</div>
                  </div>
                </div>
              )}
            </div>
            {/* 右侧：薪资和按钮 - 桌面端显示 */}
            {!isMobile && (
              <div className='flex min-w-[140px] flex-col items-end'>
                <div className='mb-1 text-xl font-semibold text-gray-900'>
                  ¥{low}~¥{high}
                </div>
                <div className='mb-3 text-xs text-gray-500'>{`每${unit}`}</div>
                <Button
                  onClick={applyJob}
                  className='!rounded-md !bg-[#4E02E4] !px-6 !py-2 !text-base !text-white'
                >
                  立即申请
                </Button>
              </div>
            )}
          </div>

          <PublisherSection recommendName={recommendName} />

          {/* <RichText
            content={job.description || '暂无描述'}
            className='min-h-[100px] mt-5 mb-8'
          /> */}
          <RichText
            content='<h2>Meetchances / 一面千识</h2>

<p>正在为一个<strong>极具挑战性的项目</strong>招聘顶尖的前端工程师，该项目与一家北京市海淀区中关村区域附近的领先的基座模型 AI Lab 合作。</p>

<p>&nbsp;</p>

<h3>主要职责</h3>

<ul>
	<li>
	<p>根据业务提供的推理/代码题目，扩展构造新题目，（包括纯推理题和推理xOOD题）用于衡量longcot模型推理/代码能力强弱。</p>
	</li>
	<li>
	<p>评估代码的可用性，定位代码异常原因并能提出改善建议</p>
	</li>
	<li>
	<p>标注前端代码组件层级、部署配置，支撑 Agent 生成可直接部署的代码</p>
	</li>
</ul>

<p>&nbsp;</p>

<h3>我们希望你</h3>

<ol>
	<li>
	<p><strong>学历与专业</strong>：本科及以上学历，理工/数学/计算机等专业优先</p>
	</li>
	<li>
	<p><strong>工作经验</strong>：具有 3 年以上前端项目开发经验，做过模型评估、题目构造、PE构造等优先。</p>
	</li>
	<li>
	<p><strong>技术技能</strong>：</p>

	<ul>
		<li>
		<p>精通前端基础技术栈：深入理解 HTML5 语义化标签、Canvas/WebGL 应用场景；熟练掌握 CSS3 核心能力（Flex/Grid 布局、动画过渡、响应式设计）；熟练运用 JavaScript ES6 + 特性（箭头函数、Promise、Async/Await、模块化），理解浏览器渲染原理与 DOM 事件机制。</p>
		</li>
		<li>
		<p>框架与状态管理：熟练掌握至少一种主流框架，如 React（Hooks、Redux/Context API）或 Vue 3（Composition API、Pinia/Vuex），能独立设计组件结构、管理业务状态，解决框架使用中的复杂场景（如跨组件通信、性能瓶颈）。</p>
		</li>
		<li>
		<p>前端工程化：熟悉 Webpack、Vite 等构建工具的配置与优化，了解 ES Module、CommonJS 模块化规范；掌握前端代码质量保障工具（ESLint、Prettier），具备单元测试（Jest/Vitest）或 E2E 测试（Cypress）编写能力者优先。</p>
		</li>
		<li>
		<p>跨端与兼容性：掌握移动端前端开发技术（REM/EM 适配、viewport 配置、PWA 基础），有微信小程序 / 支付宝小程序或跨端框架（UniApp/Taro）开发经验者优先；能独立解决不同浏览器、设备的兼容性问题（如 IE 兼容、移动端适配 bug）。</p>
		</li>
		<li>
		<p>数据交互与协作：了解前后端交互原理，熟练使用 Axios、Fetch 等工具调用 RESTful API 或 GraphQL 接口；能与后端团队高效协作联调，定位并解决数据传输、接口适配中的问题。</p>
		</li>
		<li>
		<p>性能优化：熟悉 Lighthouse、Chrome DevTools 等性能分析工具，掌握前端性能优化核心手段（代码分割、懒加载、图片优化、CDN 使用），有大型项目性能优化落地经验者优先。</p>
		</li>
		<li>
		<p>辅助技能：了解 Linux 基础操作（如 Shell 命令）、Docker 前端部署流程，或掌握 TypeScript 深度应用、前端可视化技术（ECharts、D3.js）者优先。</p>
		</li>
	</ul>
	</li>
	<li>
	<p><strong>能力素质</strong>：</p>

	<ul>
		<li>
		<p>具备较强的问题解决能力，能够快速定位与解决大数据平台开发与运行过程中出现的技术问题。</p>
		</li>
		<li>
		<p>良好的团队协作精神与沟通能力，能够与跨部门团队有效沟通与协作，共同推进项目进展。</p>
		</li>
		<li>
		<p>具备较强的学习能力与自我驱动力，能够快速学习与掌握新技术，适应大数据领域快速发展的技术需求。</p>
		</li>
		<li>
		<p>对数据敏感，具备较强的数据分析思维与能力，能够从数据中发现问题、解决问题。</p>
		</li>
	</ul>
	</li>
	<li>
	<p><strong>加分项：</strong></p>

	<ul>
		<li>
		<p>在头部互联网大厂有数据项目工程经验</p>
		</li>
	</ul>
	</li>
</ol>

<p>&nbsp;</p>

<h3>更多工作细节</h3>

<ul>
	<li>
	<p>工作<strong>完全远程</strong>，您可以根据自己的时间安排进行</p>
	</li>
	<li>
	<p>您必须能保证每周投入<strong>大约20小时</strong>的工作时间，否则可能被项目淘汰</p>
	</li>
	<li>
	<p>该合同预计将持续数月，并包含项目内的晋升机会</p>
	</li>
	<li>
	<p>在项目中表现良好将增加您被 Meetchances/一面千识 未来其他项目选中的机会</p>
	</li>
</ul>

<p>&nbsp;</p>

<h3>筛选流程</h3>

<ul>
	<li>
	<p>15分钟的 <strong>AI</strong><strong>面试</strong></p>
	</li>
</ul>

<p>&nbsp;</p>

<h3>薪酬与福利</h3>

<ul>
	<li>
	<p>时薪范围为 <strong>100-200元人民币</strong>，具体取决于您的经验水平</p>
	</li>
	<li>
	<p>我们将根据您记录的工作小时数，通过 <strong>支付宝/微信</strong> 每周向您支付报酬</p>
	</li>
	<li>
	<p>您的身份为 Meetchances/一面千识 的<strong>独立承包商</strong></p>
	</li>
</ul>

<p>&nbsp;</p>

<h3>关于一面千识</h3>

<p>一面千识致力于全球顶尖领域的 AI 实验室和 Agent 团队招募各领域专家。 我们利用 AI 技术成功帮助成千上万的专业人才找到理想职位。 <strong>立即申请，发挥你的专业影响力和技术能力，共同推动前沿 AI 模型和应用的发展！</strong></p>
'
            className='min-h-[100px] mt-5 mb-8'
            />
        </div>
        {isTwoColumn && (
          <div
            ref={applicationCardRef}
            className={cn(
              'bg-primary/5 relative max-h-[303px] rounded-lg px-6 py-5 shadow-sm',
              'w-full md:w-[320px]'
            )}
            style={
              isMobile
                ? {
                    backgroundImage:
                      'url("https://dnu-cdn.xpertiise.com/common/3be774fc-cec8-4dae-9a15-7e83f4315dcc.svg")',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '283px 314px',
                    backgroundPosition: 'right 17px bottom -31px',
                  }
                : undefined
            }
          >
            <div className='text-foreground mb-3 text-[18px] font-bold'>
              准备好加入我们的专家群体了吗?
            </div>
            <div className='mb-[64px]'>
              <div className='mb-3 text-[16px]'>
                已有
                <span className='px-[5px] text-[18px] font-semibold text-[#4E02E4]'>
                  5万+
                </span>
                专家进驻
              </div>
              <div className='flex flex-row-reverse items-center'>
                <div className='mr-3 flex -space-x-2'>
                  <img src={avatarsImg} className='h-[37px] w-[187px]' />
                </div>
              </div>
            </div>
            <div className='mb-[12px] text-sm'>备好简历,开始申请吧！</div>
            <Button onClick={applyJob} className='h-[44px] w-full'>
              立即申请
            </Button>
          </div>
        )}
      </div>

      {/* 申请卡片放在正文下方 */}
      {!isTwoColumn && (
        <div
          ref={applicationCardRef}
          className={cn(
            'bg-primary/5 relative rounded-lg px-6 py-5 shadow-sm',
            'mx-auto my-6 w-full'
          )}
          style={
            isMobile
              ? undefined
              : {
                backgroundImage:
                  'url("https://dnu-cdn.xpertiise.com/common/3be774fc-cec8-4dae-9a15-7e83f4315dcc.svg")',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '283px 314px',
                backgroundPosition: 'right 17px bottom -31px',
              }
          }
        >
          <div className='text-foreground mb-3 text-[18px] font-bold'>
            准备好加入我们的专家群体了吗?
          </div>
          <div className='mb-[64px]'>
            <div className='mb-3 text-[16px]'>
              已有
              <span className='px-[5px] text-[18px] font-semibold text-[#4E02E4]'>
                5万+
              </span>
              专家进驻
            </div>
            <div className={cn('flex items-center', isMobile ? 'flex-row-reverse' : '')}>
              <div className='flex -space-x-2'>
                <img src={avatarsImg} className='h-[37px] w-[187px]' />
              </div>
            </div>
          </div>
          <div className='mb-[12px] text-sm'>备好简历,开始申请吧！</div>
          <Button onClick={applyJob} className={cn('h-[44px] w-full', isMobile ? '' : 'max-w-[272px]')}>
            立即申请
          </Button>
        </div>
      )}

      {/* 底部固定栏 - 仅在移动端显示，带过渡 */}
      {isMobile && (
        <div
          aria-hidden={!showFixedBar}
          className={
            'bg-background/95 supports-[backdrop-filter]:bg-background/75 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur transition-transform duration-300 ease-out will-change-transform ' +
            (showFixedBar ? 'translate-y-0' : 'translate-y-full')
          }
        >
          <div className='mx-auto w-full max-w-screen-sm px-4 py-3'>
            <div className='flex items-center justify-between'>
              <div className='mr-3 min-w-0 flex-1'>
                <div className='truncate text-sm font-semibold text-gray-900'>
                  {job.title}
                </div>
              </div>
              <Button
                onClick={applyJob}
                className='flex-shrink-0 !rounded-md !border-[#4E02E4] !bg-[#4E02E4] !px-4 !py-2 !text-sm !font-medium !text-white'
              >
                立即申请
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
