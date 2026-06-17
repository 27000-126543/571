import { type Request, type Response, type NextFunction } from 'express'
import dayjs from 'dayjs'
import { operationLogRepository, userRepository } from '../dataSource/index.js'
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
    return { module: '系统管理', action: `${method}_root` }
  }

  const module = pathParts[1] ?? 'system'
  const resourceId = pathParts[2]

  const specialActions: Record<string, { module: string; action: string }> = {
    'auth/login': { module: '登录登出', action: '用户登录' },
    'auth/logout': { module: '登录登出', action: '用户登出' },
    'auth/face-login': { module: '登录登出', action: '人脸识别登录' },
    'approvals/approve': { module: '审批中心', action: '审批通过' },
    'approvals/reject': { module: '审批中心', action: '审批拒绝' },
    'approvals/todo': { module: '审批中心', action: '查看待审批' },
    'reports/daily/export': { module: '报表统计', action: '导出日报' },
    'reports/daily': { module: '报表统计', action: '查看日报' },
    'devices/report': { module: '设备工单', action: '设备报修' },
    'buses/scan': { module: '校车调度', action: '异常扫描' },
    'schedule/allocate': { module: '教学管理', action: '自动排课' },
    'canteen/inventory/scan': { module: '食堂管理', action: '库存扫描' },
    'canteen/purchase-orders': { module: '食堂管理', action: '创建采购单' },
    'canteen/inventory': { module: '食堂管理', action: '查看库存' },
    'buses/anomalies': { module: '校车调度', action: '查看异常' },
    'buses': { module: '校车调度', action: '查看校车' },
  }

  const pathKey = pathParts.slice(1).join('/')
  if (specialActions[pathKey]) {
    return specialActions[pathKey]
  }

  if (resourceId && resourceId.length > 8) {
    const subAction = pathParts.slice(3).join('/')
    if (subAction === 'approve') {
      return { module: '审批中心', action: '审批通过' }
    }
    if (subAction === 'reject') {
      return { module: '审批中心', action: '审批拒绝' }
    }
    if (subAction === 'resolve') {
      return { module: '校车调度', action: '异常处理' }
    }

    const pathWithId = `${pathParts[1]}/:id/${subAction}`
    if (specialActions[pathWithId]) {
      return specialActions[pathWithId]
    }
  }

  const moduleLabels: Record<string, string> = {
    auth: '登录登出',
    approvals: '审批中心',
    reports: '报表统计',
    devices: '设备工单',
    buses: '校车调度',
    schedule: '教学管理',
    canteen: '食堂管理',
    classrooms: '教学管理',
    library: '图书馆',
    visitors: '访客系统',
    users: '系统管理',
    logs: '系统管理',
    path: '系统管理',
    kpi: '系统管理',
  }

  const moduleName = moduleLabels[module] || module

  let action: string
  if (resourceId && resourceId.length > 0 && !resourceId.startsWith(':')) {
    switch (method) {
      case 'get':
        action = '查看详情'
        break
      case 'put':
      case 'patch':
        action = '更新'
        break
      case 'delete':
        action = '删除'
        break
      default:
        action = method
    }
  } else {
    switch (method) {
      case 'get':
        action = '列表查询'
        break
      case 'post':
        action = '创建'
        break
      default:
        action = method
    }
  }

  return { module: moduleName, action }
}

export const writeLog = async (logData: Omit<OperationLog, 'id' | 'createdAt'>): Promise<OperationLog> => {
  return operationLogRepository.create({
    ...logData,
    createdAt: dayjs().toISOString(),
  })
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

    let userId = req.user?.id
    let userName = req.user?.name
    let userRole = req.user?.role as UserRole | undefined

    if (!userId) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const jwt = await import('jsonwebtoken')
          const decoded = jwt.verify(authHeader.slice(7), 'JWT_SECRET_571') as { userId: string }
          const user = userRepository.findById(decoded.userId)
          if (user) {
            userId = user.id
            userName = user.name
            userRole = user.role
          }
        } catch {}
      }
    }

    const pathParts = req.path.split('/').filter(Boolean)
    const isLoginAction = pathParts[1] === 'auth' && (pathParts[2] === 'login' || pathParts[2] === 'face-login')

    if (isLoginAction && isSuccess && !userId) {
      try {
        const parsed = JSON.parse(responseBody)
        if (parsed?.data?.user) {
          userId = parsed.data.user.id
          userName = parsed.data.user.name
          userRole = parsed.data.user.role
        }
      } catch {}
    }

    if (!userId) {
      userId = 'anonymous'
      userName = '未登录用户'
      userRole = 'student'
    }

    let detail: string | undefined
    if (!isSuccess) {
      try {
        const parsed = JSON.parse(responseBody)
        detail = parsed.message || responseBody.substring(0, 500)
      } catch {
        detail = responseBody.substring(0, 500)
      }
    } else {
      const pathKey = pathParts.slice(1).join('/')
      if (pathKey === 'auth/login' || pathKey === 'auth/face-login') {
        detail = `用户 ${userName} 登录成功`
      } else if (pathKey === 'auth/logout') {
        detail = `用户 ${userName} 登出系统`
      } else if (pathParts[2] && pathParts[3] === 'approve') {
        detail = `${userName} 审批通过 ${pathParts[2]}`
      } else if (pathParts[2] && pathParts[3] === 'reject') {
        detail = `${userName} 审批拒绝 ${pathParts[2]}`
      } else if (pathKey === 'reports/daily/export') {
        detail = `${userName} 导出日报`
      } else if (pathKey === 'devices/report') {
        detail = `${userName} 提交设备报修`
      } else if (pathKey === 'schedule/allocate') {
        detail = `${userName} 执行自动排课`
      } else if (pathKey === 'canteen/inventory/scan') {
        detail = `${userName} 执行库存扫描`
      }
    }

    const logData: Omit<OperationLog, 'id' | 'createdAt'> = {
      userId: userId!,
      userName: userName!,
      userRole: userRole ?? 'student',
      module,
      action,
      ipAddress,
      userAgent: req.headers['user-agent'] ?? '',
      status: isSuccess ? 'SUCCESS' : 'FAILURE',
      detail,
    }

    try {
      await operationLogRepository.create({
        ...logData,
        createdAt: dayjs().toISOString(),
      })
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
