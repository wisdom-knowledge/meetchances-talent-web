export interface InterviewReportParams {
  talent_id?: number
  job_id?: number
}

export interface ScoreCardItem {
  title: string
  score: number
  reason: string
}

export interface InterviewScoreSection {
  score: number // 得分
  full_mark: number // 满分
  reason?: string | null // 原因
}

export interface ScoreItem {
  feedback: string[]
  score: number
}

export interface SectionScoresItem {
  section_name: string
  score_item: ScoreItem
}

export interface AiInterviewSection {
  section_score: InterviewScoreSection
  section_scores: SectionScoresItem[]
  detail_text: Array<{
    role: 'assistant' | 'user' | string
    content: string
    metadata?: {
      ts?: string
      t_sec?: number
    }
  }>
  skill_match?: InterviewScoreSection // 技能匹配（可选）
  soft_skill?: InterviewScoreSection // 软技能（可选）
  motivation?: InterviewScoreSection // 动机态度（可选）
}

export interface ResumeMatchScoreSection
  extends Omit<InterviewScoreSection, 'reason'> {
  reason?: string[] // 原因（多条）
}

export interface ResumeMatchSection {
  section_score: ResumeMatchScoreSection
  extra_info: unknown
  video_url: string
  avatar_url: string
}

export interface PosterInfo {
  name: string
  jobName: string
}

export interface InterviewReportData {
  title: string
  overall_score: InterviewScoreSection
  applicant_brief: string
  education_brief: string
  experience_brief: string
  ai_interview: AiInterviewSection
  resume_match: ResumeMatchSection
  poster_info: PosterInfo
}
