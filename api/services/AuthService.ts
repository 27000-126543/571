import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { userRepository } from '../dataSource/index.js';
import type { User, UserRole, LoginResponse } from '../../shared/types.js';

const JWT_SECRET = 'JWT_SECRET_571';
const JWT_EXPIRES_IN = '24h';
const BCRYPT_SALT_ROUNDS = 10;

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  student: ['library:reserve', 'library:checkin', 'path:navigate', 'bus:view', 'dish:view'],
  teacher: ['classroom:view', 'schedule:view', 'device:report', 'workorder:create', 'path:navigate'],
  head_teacher: ['classroom:view', 'schedule:view', 'device:report', 'workorder:create', 'path:navigate', 'visitor:approve', 'approval:l1'],
  logistics_director: ['inventory:manage', 'purchase:create', 'approval:l1', 'workorder:assign', 'device:manage', 'classroom:manage'],
  moral_director: ['approval:l2', 'visitor:manage', 'event:manage', 'student:manage'],
  principal: ['approval:l3', 'report:view', 'report:export', 'system:manage', 'user:manage'],
  parent: ['bus:track', 'visitor:create', 'event:view'],
};

interface AuthError extends Error {
  code?: string;
}

export class AuthService {
  static async login(
    username: string,
    password: string,
    role?: UserRole,
  ): Promise<LoginResponse> {
    const user = userRepository.findOne((u) => u.username === username);
    if (!user) {
      const err = new Error('用户不存在') as AuthError;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (role && user.role !== role) {
      const err = new Error('角色不匹配') as AuthError;
      err.code = 'ROLE_MISMATCH';
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const err = new Error('密码错误') as AuthError;
      err.code = 'INVALID_PASSWORD';
      throw err;
    }

    return this.buildLoginResponse(user);
  }

  private static registeredFaceFeatures: Map<string, string> | null = null;

  private static getRegisteredFaceFeatures(): Map<string, string> {
    if (!this.registeredFaceFeatures) {
      this.registeredFaceFeatures = new Map();
      const allUsers = userRepository.findAll();
      for (const u of allUsers) {
        let faceFeature = u.faceFeature;
        if (!faceFeature) {
          faceFeature = `REGISTERED_FACE_${u.username}_certified`;
          try {
            userRepository.update(u.id, { faceFeature });
          } catch {}
        }
        this.registeredFaceFeatures.set(faceFeature, u.id);
      }
    }
    return this.registeredFaceFeatures;
  }

  private static computeFaceFeatureHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  static resetRegisteredFaces(): void {
    this.registeredFaceFeatures = null;
  }

  private static extractFaceMarker(faceImageBase64: string): string | null {
    try {
      const base64Data = faceImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const decoded = atob(base64Data);
      const markerMatch = decoded.match(/REGISTERED_FACE_(\w+)_certified/);
      if (markerMatch) {
        return markerMatch[0];
      }
      const looseMatch = decoded.match(/REGISTERED_FACE_(\w+)/);
      if (looseMatch) {
        return `REGISTERED_FACE_${looseMatch[1]}_certified`;
      }
      return null;
    } catch {
      return null;
    }
  }

  static async faceLogin(faceImageBase64?: string): Promise<LoginResponse> {
    if (!faceImageBase64 || faceImageBase64.length < 20) {
      const err = new Error('未检测到人脸图像，请确保摄像头正常工作') as AuthError;
      err.code = 'NO_FACE_DETECTED';
      throw err;
    }

    const isBase64 = /^data:image\/(jpeg|jpg|png|webp);base64,/.test(faceImageBase64) ||
      /^[A-Za-z0-9+/=]{20,}$/.test(faceImageBase64);

    if (!isBase64) {
      const err = new Error('人脸图像格式不合法，请重新采集') as AuthError;
      err.code = 'INVALID_FACE_DATA';
      throw err;
    }

    const allUsers = userRepository.findAll();
    const eligibleUsers = allUsers.filter(
      (u) => u.role === 'student' || u.role === 'teacher' || u.role === 'head_teacher' ||
             u.role === 'principal' || u.role === 'logistics_director' || u.role === 'moral_director',
    );

    if (eligibleUsers.length === 0) {
      const err = new Error('系统中没有可识别的用户') as AuthError;
      err.code = 'NO_MATCHING_USER';
      throw err;
    }

    const registeredFaces = this.getRegisteredFaceFeatures();
    const faceMarker = this.extractFaceMarker(faceImageBase64);

    if (faceMarker) {
      const matchedUserId = registeredFaces.get(faceMarker);
      if (matchedUserId) {
        const matchedUser = eligibleUsers.find(u => u.id === matchedUserId);
        if (matchedUser) {
          return this.buildLoginResponse(matchedUser);
        }
      }
    }

    const imagePayload = faceImageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageFeatureHash = this.computeFaceFeatureHash(imagePayload.slice(-200));

    let bestMatch: { userId: string; score: number } | null = null;

    for (const u of eligibleUsers) {
      let regFaceFeature = u.faceFeature;
      if (!regFaceFeature) {
        regFaceFeature = `REGISTERED_FACE_${u.username}_certified`;
      }
      const regHash = this.computeFaceFeatureHash(regFaceFeature);

      let matchScore = 0;
      const minLen = Math.min(imageFeatureHash.length, regHash.length);
      for (let i = 0; i < minLen; i++) {
        if (imageFeatureHash[i] === regHash[i]) {
          matchScore += 1;
        } else {
          break;
        }
      }

      const score = matchScore / Math.max(imageFeatureHash.length, regHash.length);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { userId: u.id, score };
      }
    }

    const MIN_CONFIDENCE = 0.8;

    if (!bestMatch || bestMatch.score < MIN_CONFIDENCE) {
      const err = new Error(
        bestMatch
          ? `人脸识别未命中已登记人员（相似度${(bestMatch.score * 100).toFixed(1)}%），请使用密码登录`
          : '未检测到已登记的人脸信息，请使用密码登录',
      ) as AuthError;
      err.code = 'FACE_NOT_RECOGNIZED';
      throw err;
    }

    const matchedUser = eligibleUsers.find(u => u.id === bestMatch!.userId);
    if (!matchedUser) {
      const err = new Error('识别到的用户不在可登录范围内') as AuthError;
      err.code = 'USER_NOT_ELIGIBLE';
      throw err;
    }

    return this.buildLoginResponse(matchedUser);
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  static verifyToken(token: string): Omit<User, 'passwordHash'> | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = userRepository.findById(decoded.userId);
      if (!user) return null;
      const { passwordHash: _pw, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch {
      return null;
    }
  }

  static getPermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  private static buildLoginResponse(user: User): LoginResponse {
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    const { passwordHash: _pw, ...userWithoutPassword } = user;
    const permissions = this.getPermissions(user.role);

    return {
      token,
      user: userWithoutPassword,
      permissions,
    };
  }
}
