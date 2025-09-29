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
  feedback: string[] | null
  score: number
  feedback_for_user?: string[]
  suggestions_for_user?: string[]
}

export interface SectionScoresItem {
  section_name: string
  score_item: ScoreItem
}

export interface AiInterviewSection {
  section_score: InterviewScoreSection
  section_scores?: SectionScoresItem[]
  detail_text: Array<{
    role: 'assistant' | 'user' | string
    content: string
    metadata?: {
      ts?: string
      t_sec?: number
    }
  }>
  talent_interview_evaluation?: SectionScoresItem[]
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

export interface InterviewReportData {
  title: string
  video_url: string
  overall_score: InterviewScoreSection
  ai_interview: AiInterviewSection
  resume_match: ResumeMatchSection
  avatar_url: string
  resume_name: string
  job_name: string
}
