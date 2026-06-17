import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import type { UserRole } from '../../shared/types.js'
import { userRepository } from '../dataSource/index.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        username: string
        role: UserRole
      }
    }
  }
}

const JWT_SECRET = 'JWT_SECRET_571'

interface JwtPayload {
  userId: string
  username: string
  role: UserRole
  iat?: number
  exp?: number
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未提供认证令牌',
      timestamp: Date.now(),
    })
    return
  }

  const token = authHeader.slice(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    const user = userRepository.findById(decoded.userId)
    if (!user) {
      res.status(401).json({
        code: 401,
        message: '用户不存在',
        timestamp: Date.now(),
      })
      return
    }
    req.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    }
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        code: 401,
        message: '令牌已过期',
        timestamp: Date.now(),
      })
      return
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        code: 401,
        message: '无效的认证令牌',
        timestamp: Date.now(),
      })
      return
    }
    res.status(401).json({
      code: 401,
      message: '认证失败',
      timestamp: Date.now(),
    })
  }
}

export const requireRoles = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '用户未认证',
        timestamp: Date.now(),
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        code: 403,
        message: `权限不足，需要以下角色之一: ${roles.join(', ')}`,
        timestamp: Date.now(),
      })
      return
    }

    next()
  }
}

export const signToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: SignOptions['expiresIn'] = '24h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}
