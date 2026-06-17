import { type Request, type Response, type NextFunction } from 'express'
import { operationLogRepository } from '../dataSource/index.js'
import type { OperationLog, UserRole } from '../../shared/types.js'

const getClientIp = (req: Request): string => {
  const xForwardedFor = req.headers['x-forwarded-for']
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0]?.trim() ?? 'unknown'
  }
  if (Array.isArray(xForwardedFor)) {
    return xForwardedFor[0]?.trim() ?? 'unknown'
  }
  return req.socket.remoteAddress ?? req.ip ?? 'unknown'
}

const extractModuleAndAction = (req: Request): { module: string; action: string } => {
  const pathParts = req.path.split('/').filter(Boolean)
  const method = req.method.toLowerCase()

  if (pathParts.length < 2) {
    return { module: 'system', action: `${method}_root` }
  }

  const module = pathParts[1] ?? 'system'
  const resourceId = pathParts[2]

  let action = method
  if (resourceId && resourceId.length > 0 && !resourceId.startsWith(':')) {
    switch (method) {
      case 'get':
        action = 'get'
        break
      case 'put':
      case 'patch':
        action = 'update'
        break
      case 'delete':
        action = 'delete'
        break
      default:
        action = method
    }
  } else {
    switch (method) {
      case 'get':
        action = 'list'
        break
      case 'post':
        action = 'create'
        break
      default:
        action = method
    }
  }

  const specialActions: Record<string, string> = {
    'auth/login': '用户登录',
    'auth/logout': '用户登出',
    'auth/face-login': '人脸识别登录',
    'approvals/approve': '审批通过',
    'approvals/reject': '审批拒绝',
    'reports/daily/export': '导出日报',
    'devices/report': '设备报修',
    'buses/scan': '异常扫描',
    'schedule/allocate': '自动排课',
  }

  const pathKey = pathParts.slice(1).join('/')
  if (specialActions[pathKey]) {
    return { module, action: specialActions[pathKey] }
  }
  if (resourceId) {
    const pathWithId = `${pathParts[1]}/:id/${pathParts.slice(3).join('/')}`
    if (specialActions[pathWithId]) {
      return { module, action: specialActions[pathWithId] }
    }
  }

  return { module, action }
}

export const writeLog = async (logData: Omit<OperationLog, 'id' | 'createdAt'>): Promise<OperationLog> => {
  return operationLogRepository.create(logData)
}

export const operationLogger = (req: Request, res: Response, next: NextFunction): void => {
  const { module, action } = extractModuleAndAction(req)
  const ipAddress = getClientIp(req)
  const startTime = Date.now()
  const originalSend = res.send.bind(res)

  let responseBody = ''
  res.send = ((body: unknown): Response => {
    if (typeof body === 'string') {
      responseBody = body
    } else if (body !== undefined) {
      try {
        responseBody = JSON.stringify(body)
      } catch {
        responseBody = '[unserializable]'
      }
    }
    return originalSend(body as never)
  }) as typeof res.send

  res.on('finish', async (): Promise<void> => {
    const isSuccess = res.statusCode >= 200 && res.statusCode < 400

    let detail: string | undefined
    if (!isSuccess) {
      try {
        const parsed = JSON.parse(responseBody)
        detail = parsed.message || responseBody.substring(0, 500)
      } catch {
        detail = responseBody.substring(0, 500)
      }
    }

    const logData: Omit<OperationLog, 'id' | 'createdAt'> = {
      userId: req.user?.id ?? 'anonymous',
      userName: req.user?.name ?? '未登录用户',
      userRole: (req.user?.role as UserRole) ?? 'student',
      module,
      action,
      ipAddress,
      userAgent: req.headers['user-agent'] ?? '',
      status: isSuccess ? 'SUCCESS' : 'FAILURE',
      detail: isSuccess ? undefined : detail,
    }

    try {
      await operationLogRepository.create(logData)
    } catch (err) {
      console.error('写入操作日志失败:', err)
    }

    void startTime
  })

  next()
}

export const getLogs = async (): Promise<OperationLog[]> => {
  return operationLogRepository.findAll()
}

export const queryLogs = async (
  filter: Partial<Pick<OperationLog, 'userId' | 'module' | 'action' | 'status'>>,
): Promise<OperationLog[]> => {
  let logs = operationLogRepository.findAll()
  if (filter.userId) logs = logs.filter(l => l.userId === filter.userId)
  if (filter.module) logs = logs.filter(l => l.module === filter.module)
  if (filter.action) logs = logs.filter(l => l.action === filter.action)
  if (filter.status) logs = logs.filter(l => l.status === filter.status)
  return logs
}
