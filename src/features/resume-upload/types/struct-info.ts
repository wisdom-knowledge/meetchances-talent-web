export interface StructInfo {
  basic_info?: {
    city?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    gender?: '男' | '女' | string | null
    origin?: string | null
    expected_salary?: string | null
  }
  experience?: {
    education?: Array<{
      city?: string | null
      major?: string | null
      end_date?: string | null
      start_date?: string | null
      degree_type?: string | null
      institution?: string | null
      achievements?: string[] | null
      degree_status?: string | null
    }>
    work_experience?: Array<{
      city?: string | null
      title?: string | null
      end_date?: string | null
      start_date?: string | null
      achievements?: string[] | null
      organization?: string | null
      employment_type?: string | null
    }>
    project_experience?: Array<{
      role?: string | null
      end_date?: string | null
      start_date?: string | null
      achievements?: string[] | null
      organization?: string | null
    }>
    // 附加资质
    awards?: Array<{
      title?: string | null
      issuer?: string | null
      date?: string | null
      achievements?: string[] | null
    }>
    publications?: Array<{
      title?: string | null
      publisher?: string | null
      date?: string | null
      url?: string | null
      achievements?: string[] | null
    }>
    repositories?: Array<{
      name?: string | null
      url?: string | null
      achievements?: string[] | null
    }>
    patents?: Array<{
      title?: string | null
      number?: string | null
      status?: string | null
      date?: string | null
      achievements?: string[] | null
    }>
    social_media?: Array<{
      platform?: string | null
      handle?: string | null
      url?: string | null
      achievements?: string[] | null
    }>
  }
  self_assessment?: {
    summary?: string | null
    hard_skills?: Array<{ skill_name?: string | null; proficiency?: string | null }>
    soft_skills?: unknown[]
    // 新增：区分存储通用技能与兴趣爱好
    skills?: string[] | null
    hobbies?: string[] | null
  } | null
}


