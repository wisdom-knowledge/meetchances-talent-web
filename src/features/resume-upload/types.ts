export enum BackendStatus {
  InProgress = 0,
  Success = 10,
  Failed = 20,
  ParseFailed = 30,
  ImportMissingInfo = 31,
}

export enum UploadCardStatusCode {
  Queued = 'queued',
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Parsing = 'parsing',
  Parsed = 'parsed',
  Importing = 'importing',
  Success = 'success',
  UploadFailed = 'upload_failed',
  FormatUnsupported = 'format_unsupported',
  FileCorrupted = 'file_corrupted',
  ExceedLimit = 'exceed_limit',
  ParseFailed = 'parse_failed',
  ParseAbnormal = 'parse_abnormal',
  ImportFailed = 'import_failed',
  ImportMissingInfo = 'import_missing_info',
  DuplicateExists = 'duplicate_exists',
}


