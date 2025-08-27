import type { ResumeFormValues } from '@/features/resume/data/schema'
import type { StructInfo } from '@/features/resume-upload/types/struct-info'

function joinAchievements(list?: string[] | null): string | undefined {
  if (!Array.isArray(list) || list.length === 0) return undefined
  return list.filter(Boolean).join('\n')
}

export function mapStructInfoToResumeFormValues(structInfo?: StructInfo | null): ResumeFormValues {
  const basic = structInfo?.basic_info
  const exp = structInfo?.experience

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
    institution: e?.institution ?? undefined,
    major: e?.major ?? undefined,
    degreeType: e?.degree_type ?? undefined,
    degreeStatus: e?.degree_status ?? undefined,
    city: e?.city ?? undefined,
    startDate: e?.start_date ?? undefined,
    endDate: e?.end_date ?? undefined,
    achievements: joinAchievements(e?.achievements ?? undefined),
  }))

  const values: ResumeFormValues = {
    name: basic?.name ?? undefined,
    phone: basic?.phone ?? undefined,
    email: basic?.email ?? undefined,
    gender: (basic?.gender as ResumeFormValues['gender']) ?? undefined,
    city: basic?.city ?? undefined,
    workExperience: workExperience.length ? workExperience : undefined,
    projectExperience: projectExperience.length ? projectExperience : undefined,
    education: education.length ? education : undefined,
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
    },
    experience: {
      work_experience: work,
      project_experience: projects,
      education: edu,
    },
  }
  return struct
}


