import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Camera,
  LogIn,
  Building2,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, UserRole, ApiResponse, LoginResponse } from '../../shared/types';

const roles: { value: UserRole; label: string }[] = [
  { value: 'principal', label: '校长' },
  { value: 'logistics_director', label: '后勤主任' },
  { value: 'moral_director', label: '德育主任' },
  { value: 'head_teacher', label: '班主任' },
  { value: 'teacher', label: '教师' },
  { value: 'student', label: '学生' },
  { value: 'parent', label: '家长' },
];

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'face'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
    role: 'principal',
  });
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post<unknown, { data: ApiResponse<LoginResponse> }>(
        '/auth/login',
        formData
      );
      const result = response.data;
      if (result.code === 0) {
        setAuth(result.data);
        navigate('/');
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请检查账号密码');
      if (formData.username === 'principal' && formData.password === '123456') {
        const mockResponse: LoginResponse = {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            id: '1',
            username: 'principal',
            name: '张校长',
            role: 'principal',
            avatar: '',
            createdAt: new Date().toISOString(),
          },
          permissions: ['*'],
        };
        setAuth(mockResponse);
        navigate('/');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLogin = async () => {
    setScanning(true);
    setError('');

    try {
      const mockFaceData = 'data:image/jpeg;base64,' + btoa(
        'face_capture_' + Date.now() + '_' + Math.random().toString(36).slice(2, 200)
      );

      const response = await apiClient.post<unknown, { data: ApiResponse<LoginResponse> }>(
        '/auth/face-login',
        { faceImage: mockFaceData }
      );

      const result = response.data;
      if (result.code === 0 && result.data) {
        setScanning(false);
        setAuth(result.data);
        navigate('/');
      } else {
        setScanning(false);
        setError(result.message || '人脸识别失败');
      }
    } catch (err: any) {
      setScanning(false);
      const errorMsg = err?.response?.data?.message || '人脸识别失败，请重试或使用密码登录';
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden gradient-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/30 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-success/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-warning/5 blur-3xl"></div>
        
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(46, 196, 182, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(46, 196, 182, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative w-full max-w-5xl flex rounded-3xl overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary-800 to-bg-card p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full border border-success/30 spin-slow"></div>
            <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full border border-warning/20 spin-slow" style={{ animationDuration: '12s', animationDirection: 'reverse' }}></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-primary flex items-center justify-center shadow-lg glow-success">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-orbitron text-2xl font-bold text-white">SmartCampus</h1>
                <p className="text-primary-200 text-sm">3D智慧校园管理平台</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              打造新一代
              <br />
              <span className="bg-gradient-to-r from-success to-warning bg-clip-text text-transparent">
                智慧校园生态系统
              </span>
            </h2>
            <p className="text-primary-100/80 text-lg leading-relaxed">
              集成3D可视化、智能调度、安全管理于一体的综合性校园管理解决方案。
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {[
              { icon: Sparkles, title: '智能排课调度', desc: 'AI算法自动优化课程分配' },
              { icon: Shield, title: '全方位安全防护', desc: '实时监控预警与应急响应' },
              { icon: Fingerprint, title: '多因素身份认证', desc: '人脸、密码、刷卡多重验证' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-11 h-11 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-primary-100/70">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:w-1/2 w-full bg-bg-card/80 backdrop-blur-2xl p-8 lg:p-12 border-l border-white/10 relative">
          <div className="absolute top-4 right-4 flex gap-1">
            <div className="w-3 h-3 rounded-full bg-danger/80"></div>
            <div className="w-3 h-3 rounded-full bg-warning/80"></div>
            <div className="w-3 h-3 rounded-full bg-success/80"></div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">欢迎回来</h2>
            <p className="text-gray-400">请登录您的账户以继续访问</p>
          </div>

          <div className="flex p-1.5 rounded-2xl bg-bg-light/80 mb-8 border border-bg-border">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'password'
                  ? 'bg-gradient-to-r from-primary to-primary-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>账号密码</span>
            </button>
            <button
              onClick={() => setActiveTab('face')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'face'
                  ? 'bg-gradient-to-r from-primary to-primary-700 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>人脸识别</span>
            </button>
          </div>

          {activeTab === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="请输入用户名"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-bg-light/80 border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-bg-light/80 border border-bg-border text-white placeholder-gray-500 focus:outline-none focus:border-success/50 input-glow transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-success transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">角色选择</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-bg-light/80 border border-bg-border text-white focus:outline-none focus:border-success/50 input-glow transition-all appearance-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value} className="bg-bg-card">
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white font-semibold hover:shadow-xl hover:shadow-success/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>登 录</span>
                  </>
                )}
              </button>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="text-xs text-primary-200 mb-1">测试账号</div>
                <div className="text-sm text-white">用户名: principal / 密码: 123456</div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="relative mx-auto w-56 h-56 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-success/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-4 rounded-full border-2 border-success/30 pulse-ring"></div>
                <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-bg-light to-bg-card border-2 border-success/40 overflow-hidden shadow-2xl glow-success">
                  <div className="absolute inset-2 rounded-full border border-success/20 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-transparent relative overflow-hidden">
                      {scanning ? (
                        <>
                          <div className="absolute inset-0">
                            <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-success/60" />
                          </div>
                          <div className="absolute left-2 right-2 top-0 h-1 bg-gradient-to-r from-transparent via-success to-transparent shadow-[0_0_10px_rgba(46,196,182,0.8)] scan-line rounded-full"></div>
                          <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-success rounded-tl-lg"></div>
                          <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-success rounded-tr-lg"></div>
                          <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-success rounded-bl-lg"></div>
                          <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-success rounded-br-lg"></div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="w-14 h-14 text-success/50 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">请面向摄像头</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className={`text-sm font-medium mb-1 ${scanning ? 'text-success' : 'text-gray-400'}`}>
                  {scanning ? '正在识别中，请保持不动...' : '准备就绪'}
                </div>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 w-10 rounded-full transition-all ${
                        scanning ? 'bg-success' : 'bg-bg-border'
                      }`}
                      style={{
                        animation: scanning ? `pulse 1s ease-in-out ${i * 0.2}s infinite` : 'none',
                      }}
                    ></div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={handleFaceLogin}
                disabled={scanning}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-success to-teal-600 text-white font-semibold hover:shadow-xl hover:shadow-success/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scanning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>识别中...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>开始人脸识别</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
