import { useState, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Library,
  UtensilsCrossed,
  Bus,
  UserCheck,
  Wrench,
  FileSpreadsheet,
  History,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '首页看板' },
  { path: '/teaching', icon: Building2, label: '教学楼' },
  { path: '/library', icon: Library, label: '图书馆' },
  { path: '/canteen', icon: UtensilsCrossed, label: '食堂管理' },
  { path: '/bus', icon: Bus, label: '校车调度' },
  { path: '/visitor', icon: UserCheck, label: '访客管理' },
  { path: '/device', icon: Wrench, label: '设备工单' },
  { path: '/approval', icon: ClipboardList, label: '审批中心' },
  { path: '/report', icon: FileSpreadsheet, label: '报表统计' },
  { path: '/logs', icon: History, label: '操作日志' },
];

const roleLabels: Record<string, string> = {
  student: '学生',
  teacher: '教师',
  head_teacher: '班主任',
  logistics_director: '后勤主任',
  moral_director: '德育主任',
  principal: '校长',
  parent: '家长',
};

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-bg text-gray-100 overflow-hidden">
      <aside
        className={`flex flex-col bg-bg-light border-r border-bg-border transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-bg-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-orbitron text-lg font-bold bg-gradient-to-r from-success to-primary-200 bg-clip-text text-transparent">
                SmartCampus
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-success flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-bg-lighter transition-colors text-gray-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/40 to-success/20 text-success border border-success/30 shadow-lg shadow-success/10'
                    : 'text-gray-400 hover:text-white hover:bg-bg-lighter'
                } ${collapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'group-hover:scale-110 transition-transform'}`} />
              {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-bg-border">
          {!collapsed ? (
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20">
              <div className="text-xs text-gray-400 mb-1">系统版本</div>
              <div className="font-orbitron text-sm text-success">v2.0.0 Pro</div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-primary/30 to-success/10 flex items-center justify-center border border-primary/20">
              <span className="font-orbitron text-xs text-success">2.0</span>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-bg-light/80 backdrop-blur-xl border-b border-bg-border flex items-center justify-between px-6 sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-semibold">智慧校园管理平台</h1>
            <p className="text-xs text-gray-500">3D教务调度与安全管理系统</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl bg-bg-card border border-bg-border hover:border-success/30 transition-all text-gray-400 hover:text-success group">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-bg-light animate-pulse"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-bg-card border border-bg-border hover:border-primary/30 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-success flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium">{user?.name || '用户'}</div>
                  <div className="text-xs text-gray-500">
                    {user?.role ? roleLabels[user.role] || user.role : ''}
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-90' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-bg-card border border-bg-border rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-bg-border">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.username}</div>
                    <div className="text-xs text-success mt-1">
                      {user?.role ? roleLabels[user.role] || user.role : ''}
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-lighter transition-colors text-gray-300">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">个人设置</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-danger/10 hover:text-danger transition-colors text-gray-300"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">退出登录</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
