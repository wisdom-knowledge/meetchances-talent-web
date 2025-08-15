import type { FileItem } from '..'

export function generateMockItems(): FileItem[] {
  const base = (id: string, name: string, status: FileItem['status'], progress?: number): FileItem => ({
    id,
    name,
    ext: 'pdf',
    status,
    progress,
  })

  return [
    // 进行中
    base('m-uploading-1', '正在上传-1', 'uploading', 42),
    base('m-uploaded-1', '上传完成-1', 'uploaded', 100),
    base('m-parsing-1', '正在解析-1', 'parsing', 28),
    base('m-parsed-1', '解析完成-1', 'parsed', 100),
    base('m-importing-1', '录入中-1', 'importing', 77),
    base('m-success-1', '成功-1', 'success', 100),

    // 失败态
    base('e-upload-failed', '上传失败-1', 'upload_failed'),
    base('e-format-unsupported', '格式不支持-1', 'format_unsupported'),
    base('e-file-corrupted', '文件损坏-1', 'file_corrupted'),
    base('e-exceed-limit', '超出限制-1', 'exceed_limit'),
    base('e-parse-failed', '解析失败-1', 'parse_failed'),
    base('e-parse-abnormal', '解析异常-1', 'parse_abnormal'),
    base('e-import-failed', '录入失败-1', 'import_failed'),
    base('e-import-missing', '录入缺失信息-1', 'import_missing_info'),
    base('e-duplicate', '系统已存在-1', 'duplicate_exists'),
  ]
}


