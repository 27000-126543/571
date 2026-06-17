import { Router, type Request, type Response } from 'express';
import { AuthService } from '../services/index.js';
import { authenticate } from '../middleware/auth.js';
import type { LoginRequest, ApiResponse, LoginResponse, User } from '../../shared/types.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body as LoginRequest;
    const result = await AuthService.login(username, password, role);
    const response: ApiResponse<LoginResponse> = {
      code: 0,
      message: '登录成功',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    const response: ApiResponse<null> = {
      code: 401,
      message,
      data: null,
      timestamp: Date.now(),
    };
    res.status(401).json(response);
  }
});

router.post('/face-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { faceImage } = req.body as { faceImage?: string };
    const result = await AuthService.faceLogin(faceImage);
    const response: ApiResponse<LoginResponse> = {
      code: 0,
      message: '人脸识别登录成功',
      data: result,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败';
    const errorCode = (error as any).code || 'AUTH_FAILED';
    const response: ApiResponse<null> = {
      code: 401,
      message,
      data: null,
      timestamp: Date.now(),
      errorCode,
    };
    res.status(401).json(response);
  }
});

router.get('/me', authenticate, (req: Request, res: Response): void => {
  const response: ApiResponse<typeof req.user> = {
    code: 0,
    message: '获取当前用户信息成功',
    data: req.user,
    timestamp: Date.now(),
  };
  res.status(200).json(response);
});

router.post('/logout', authenticate, (_req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    code: 0,
    message: '登出成功',
    data: null,
    timestamp: Date.now(),
  };
  res.status(200).json(response);
});

export default router;
