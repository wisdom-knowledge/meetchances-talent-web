export const resumeMockData = {
  structured_resume: {
    basic_info: {
      name: '林佳蓉',
      phone: '18654550887',
      city: null as string | null,
      gender: null as string | null,
      email: '996239579@qq.com',
    },
    experience: {
      work_experience: [
        {
          organization: '网易风雨美术部',
          start_date: '2021/07',
          end_date: '2022/06',
          title: '场景概念设计师',
          achievements: [
            '气氛图',
            '建筑单体设计拆分和细化',
            '引擎内场景优化',
            '项目关键词：写实，西幻,中东风',
          ],
          city: null as string | null,
          employment_type: null as string | null,
        },
        {
          organization: '悠星网络',
          start_date: '2022/06',
          end_date: '2023/12',
          title: '场景概念设计师',
          achievements: [
            '前期场景风格探索',
            '场景概念设计',
            '场景物件拆分',
            '配合地编进行氛围优化调整',
            '项目关键词：二次元角色结合偏写实场景，科幻，太空歌剧',
          ],
          city: null as string | null,
          employment_type: null as string | null,
        },
        {
          organization: 'Funplus',
          start_date: '2024/06',
          end_date: '至今',
          title: '场景概念设计师',
          achievements: [
            '地图区域规划',
            '整体气氛图',
            '建筑概念设计',
            '建筑单体及小物件细化设计',
            '项目：代号-界 古风写实MMO',
          ],
          city: null as string | null,
          employment_type: null as string | null,
        },
      ],
      project_experience: [
        {
          organization: '外包项目',
          role: '场景概念设计师',
          start_date: '2022/01',
          end_date: '2023/12',
          achievements: [
            '《明末》国风写实项目概念图',
            '古装剧《繁城之下》气氛图',
            '高达联名麦当劳广告项目',
            '智己汽车广告项目',
            '百威啤酒广告项目',
          ],
        },
      ],
      education: [
        {
          institution: 'Syracuse University(美国)',
          major: '插画专业',
          degree_type: '硕士',
          degree_status: null as string | null,
          city: null as string | null,
          start_date: '2018/09',
          end_date: '2021/08',
          achievements: ['辅修多媒体专业'],
        },
        {
          institution: '山东科技大学',
          major: '产品设计专业',
          degree_type: '本科',
          degree_status: null as string | null,
          city: null as string | null,
          start_date: '2014/09',
          end_date: '2018/07',
          achievements: null as string[] | null,
        },
      ],
    },
    additional_qualifications: null as unknown as never,
    self_assessment: {
      summary:
        '3年游戏行业经验的场景概念设计师，拥有留学背景和英语交流能力，经历过多种风格项目（写实或二次元，魔幻或科幻），从初期概念到后面落地设计推进的各个阶段都有经验，性格外向，热爱交流，善于配合团队协作。',
      hard_skills: [
        { skill_name: 'Blender', proficiency: '精通' },
        { skill_name: 'Substance Painter', proficiency: '精通' },
        { skill_name: 'C4D', proficiency: '精通' },
        { skill_name: 'ZBrush', proficiency: '精通' },
        { skill_name: 'Marvelous Designer', proficiency: '精通' },
        { skill_name: 'DAZ', proficiency: '精通' },
        { skill_name: 'World Creator', proficiency: '精通' },
        { skill_name: 'UE4', proficiency: '精通' },
        { skill_name: '2D/3D工作流程', proficiency: '精通' },
        { skill_name: '场景概念设计', proficiency: '精通' },
        { skill_name: '英语', proficiency: '熟悉' },
      ],
      soft_skills: ['善于学习', '能力全面', '性格外向', '热爱交流', '团队协作', '积极配合'],
    },
  },
}

export type ResumeApiMock = typeof resumeMockData


