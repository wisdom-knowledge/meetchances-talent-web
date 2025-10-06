import type { ResumeFormValues } from '@/features/resume/data/schema'
import type { StructInfo } from '@/features/resume-upload/types/struct-info'

function joinAchievements(list?: string[] | null): string | undefined {
  if (!Array.isArray(list) || list.length === 0) return undefined
  return list.filter(Boolean).join('\n')
}

export function mapStructInfoToResumeFormValues(structInfo?: StructInfo | null): ResumeFormValues {
  const basic = structInfo?.basic_info
  const exp = structInfo?.experience
  const sa = structInfo?.self_assessment

  const workExperience = (exp?.work_experience ?? []).map((w) => ({
    organization: w?.organization ?? undefined,
    title: w?.title ?? undefined,
    startDate: w?.start_date ?? undefined,
    endDate: w?.end_date ?? undefined,
    city: w?.city ?? undefined,
    employmentType: w?.employment_type ?? undefined,
    achievements: joinAchievements(w?.achievements ?? undefined),
  }))

  const projectExperience = (exp?.project_experience ?? []).map((p) => ({
    organization: p?.organization ?? undefined,
    role: p?.role ?? undefined,
    startDate: p?.start_date ?? undefined,
    endDate: p?.end_date ?? undefined,
    achievements: joinAchievements(p?.achievements ?? undefined),
  }))

  const education = (exp?.education ?? []).map((e) => ({
    institution: e?.institution ?? '',
    major: e?.major ?? '',
    degreeType: e?.degree_type ?? '',
    degreeStatus: e?.degree_status ?? '',
    city: e?.city ?? undefined,
    startDate: e?.start_date ?? '',
    endDate: e?.end_date ?? '',
    achievements: joinAchievements(e?.achievements ?? undefined),
  }))

  // 附加资质
  const awards = (exp?.awards ?? []).map((a) => ({
    title: a?.title ?? '',
    issuer: a?.issuer ?? undefined,
    date: a?.date ?? '',
    achievements: joinAchievements(a?.achievements ?? undefined),
  }))

  const publications = (exp?.publications ?? []).map((p) => ({
    title: p?.title ?? '',
    publisher: p?.publisher ?? undefined,
    date: p?.date ?? '',
    url: p?.url ?? undefined,
    achievements: joinAchievements(p?.achievements ?? undefined),
  }))

  const repositories = (exp?.repositories ?? []).map((r) => ({
    name: r?.name ?? '',
    url: r?.url ?? '',
    achievements: joinAchievements(r?.achievements ?? undefined),
  }))

  const patents = (exp?.patents ?? []).map((p) => ({
    title: p?.title ?? '',
    number: p?.number ?? undefined,
    status: p?.status ?? undefined,
    date: p?.date ?? '',
    achievements: joinAchievements(p?.achievements ?? undefined),
  }))

  const socialMedia = (exp?.social_media ?? []).map((s) => ({
    platform: s?.platform ?? '',
    handle: s?.handle ?? undefined,
    url: s?.url ?? '',
    achievements: joinAchievements(s?.achievements ?? undefined),
  }))

  const values: ResumeFormValues = {
    name: basic?.name ?? '',
    phone: basic?.phone ?? '',
    email: basic?.email ?? '',
    gender: (basic?.gender as ResumeFormValues['gender']) ?? undefined,
    city: basic?.city ?? undefined,
    origin: basic?.origin ?? undefined,
    expectedSalary: basic?.expected_salary ?? undefined,
    // 自我评价
    selfEvaluation: sa?.summary ?? undefined,
    workExperience: workExperience.length ? workExperience : undefined,
    projectExperience: projectExperience.length ? projectExperience : undefined,
    education: education.length ? education : [],
    awards: awards.length ? awards : undefined,
    publications: publications.length ? publications : undefined,
    repositories: repositories.length ? repositories : undefined,
    patents: patents.length ? patents : undefined,
    socialMedia: socialMedia.length ? socialMedia : undefined,
    // 将有熟练度的 hard_skills 映射到工作技能
    workSkills:
      (sa?.hard_skills ?? [])
        .map((hs) => ({
          name: (hs?.skill_name ?? undefined) as ResumeFormValues['workSkills'] extends Array<infer T> ? T extends { name?: string } ? string | undefined : string | undefined : string | undefined,
          level: (hs?.proficiency ?? undefined) as string | undefined,
        }))
        .filter((w) => Boolean(w.name) && Boolean(w.level)) as ResumeFormValues['workSkills'],
    // 通用技能：优先读取 self_assessment.skills（数组），兼容旧数据回落到 hard_skills 无熟练度项
    skills: (() => {
      const explicitSkills = Array.isArray(sa?.skills)
        ? (sa?.skills as string[]).map((s) => (typeof s === 'string' ? s : s == null ? '' : String(s))).filter(Boolean)
        : []
      if (explicitSkills.length) return explicitSkills.join('、')
      const fallbackPlain = (sa?.hard_skills ?? [])
        .filter((hs) => !hs?.proficiency)
        .map((hs) => hs?.skill_name)
        .filter(Boolean) as string[]
      return fallbackPlain.length ? fallbackPlain.join('、') : undefined
    })(),
    // 兴趣爱好：读取 self_assessment.hobbies 数组
    hobbies: (() => {
      const arr = Array.isArray(sa?.hobbies)
        ? (sa?.hobbies as string[]).map((s) => (typeof s === 'string' ? s : s == null ? '' : String(s))).filter(Boolean)
        : []
      return arr.length ? arr.join('、') : undefined
    })(),
    softSkills: (() => {
      const ss = (sa?.soft_skills ?? []) as Array<unknown>
      const list = ss.map((v) => (typeof v === 'string' ? v : v == null ? '' : String(v))).filter(Boolean)
      return list.length ? list.join('、') : undefined
    })(),
  }

  return values
}

function splitAchievements(text?: string): string[] | undefined {
  if (!text) return undefined
  const arr = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  return arr.length ? arr : undefined
}

export function mapResumeFormValuesToStructInfo(values: ResumeFormValues): StructInfo {
  function splitTags(text?: string): string[] | null {
    if (!text) return null
    const list = String(text)
      .split(/[，、,\s]+/u)
      .map((s) => s.trim())
      .filter(Boolean)
    return list.length ? list : null
  }

  const work = (values.workExperience ?? []).map((w) => ({
    organization: w.organization ?? null,
    title: w.title ?? null,
    start_date: w.startDate ?? null,
    end_date: w.endDate ?? null,
    city: w.city ?? null,
    employment_type: w.employmentType ?? null,
    achievements: splitAchievements(w.achievements) ?? null,
  }))

  const projects = (values.projectExperience ?? []).map((p) => ({
    organization: p.organization ?? null,
    role: p.role ?? null,
    start_date: p.startDate ?? null,
    end_date: p.endDate ?? null,
    achievements: splitAchievements(p.achievements) ?? null,
  }))

  const edu = (values.education ?? []).map((e) => ({
    institution: e.institution ?? null,
    major: e.major ?? null,
    degree_type: e.degreeType ?? null,
    degree_status: e.degreeStatus ?? null,
    city: e.city ?? null,
    start_date: e.startDate ?? null,
    end_date: e.endDate ?? null,
    achievements: splitAchievements(e.achievements) ?? null,
  }))

  const struct: StructInfo = {
    basic_info: {
      name: values.name ?? null,
      phone: values.phone ?? null,
      email: values.email ?? null,
      gender: (values.gender as StructInfo['basic_info'] extends infer T ? T extends { gender?: unknown } ? T['gender'] : string : string) ?? null,
      city: values.city ?? null,
      origin: values.origin ?? null,
      expected_salary: values.expectedSalary ?? null,
    },
    experience: {
      work_experience: work,
      project_experience: projects,
      education: edu,
      awards: (values.awards ?? []).map((a) => ({
        title: a.title ?? null,
        issuer: a.issuer ?? null,
        date: a.date ?? null,
        achievements: splitAchievements(a.achievements) ?? null,
      })),
      publications: (values.publications ?? []).map((p) => ({
        title: p.title ?? null,
        publisher: p.publisher ?? null,
        date: p.date ?? null,
        url: p.url ?? null,
        achievements: splitAchievements(p.achievements) ?? null,
      })),
      repositories: (values.repositories ?? []).map((r) => ({
        name: r.name ?? null,
        url: r.url ?? null,
        achievements: splitAchievements(r.achievements) ?? null,
      })),
      patents: (values.patents ?? []).map((p) => ({
        title: p.title ?? null,
        number: p.number ?? null,
        status: p.status ?? null,
        date: p.date ?? null,
        achievements: splitAchievements(p.achievements) ?? null,
      })),
      social_media: (values.socialMedia ?? []).map((s) => ({
        platform: s.platform ?? null,
        handle: s.handle ?? null,
        url: s.url ?? null,
        achievements: splitAchievements(s.achievements) ?? null,
      })),
    },
    self_assessment: {
      summary: values.selfEvaluation ?? null,
      hard_skills: ((values.workSkills ?? []).map((w) => ({
        skill_name: w?.name ?? null,
        proficiency: w?.level ?? null,
      })) as Array<{ skill_name?: string | null; proficiency?: string | null }>),
      soft_skills: (splitTags(values.softSkills) ?? undefined) as unknown[] | undefined,
      // 新增：分别写入 skills 与 hobbies（数组）
      skills: splitTags(values.skills) ?? null,
      hobbies: splitTags(values.hobbies) ?? null,
    },
  }
  return struct
}


