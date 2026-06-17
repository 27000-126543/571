import { useState } from 'react';
import Layout from '../components/Layout';
import { TeachingScene } from '../components/scenes3d';
import {
  Building2,
  Calendar,
  Users,
  Monitor,
  Thermometer,
  Droplets,
  Lightbulb,
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Classroom, Course, AllocationResult } from '../../shared/types';

const mockClassrooms: Classroom[] = [
  {
    id: 'c1',
    buildingId: 'b1',
    floor: 1,
    roomNumber: 'A101',
    capacity: 60,
    occupiedSeats: 45,
    equipment: ['projector', 'blackboard', 'computer'],
    sensors: { temperature: 24.5, humidity: 55, illuminance: 450 },
    position3D: { x: 0, y: 0, z: 0, floorHeight: 4 },
  },
  {
    id: 'c2',
    buildingId: 'b1',
    floor: 1,
    roomNumber: 'A102',
    capacity: 48,
    occupiedSeats: 48,
    equipment: ['projector', 'blackboard'],
    sensors: { temperature: 26.1, humidity: 60, illuminance: 380 },
    position3D: { x: 5, y: 0, z: 0, floorHeight: 4 },
  },
  {
    id: 'c3',
    buildingId: 'b1',
    floor: 2,
    roomNumber: 'A201',
    capacity: 80,
    occupiedSeats: 32,
    equipment: ['projector', 'blackboard', 'computer', 'lab'],
    sensors: { temperature: 23.8, humidity: 52, illuminance: 520 },
    position3D: { x: 0, y: 4, z: 0, floorHeight: 4 },
  },
  {
    id: 'c4',
    buildingId: 'b1',
    floor: 2,
    roomNumber: 'A202',
    capacity: 60,
    occupiedSeats: 0,
    equipment: ['projector', 'blackboard', 'music'],
    sensors: { temperature: 22.0, humidity: 48, illuminance: 300 },
    position3D: { x: 5, y: 4, z: 0, floorHeight: 4 },
  },
  {
    id: 'c5',
    buildingId: 'b1',
    floor: 3,
    roomNumber: 'A301',
    capacity: 120,
    occupiedSeats: 110,
    equipment: ['projector', 'blackboard', 'computer', 'art'],
    sensors: { temperature: 25.2, humidity: 58, illuminance: 600 },
    position3D: { x: 0, y: 8, z: 0, floorHeight: 4 },
  },
  {
    id: 'c6',
    buildingId: 'b1',
    floor: 3,
    roomNumber: 'A302',
    capacity: 40,
    occupiedSeats: 28,
    equipment: ['projector', 'blackboard', 'lab'],
    sensors: { temperature: 24.0, humidity: 50, illuminance: 420 },
    position3D: { x: 5, y: 8, z: 0, floorHeight: 4 },
  },
];

const mockCourses: Course[] = [
  {
    id: 'co1',
    name: '高等数学',
    teacherId: 't1',
    teacherName: '李明教授',
    grade: 1,
    classId: 'cs1',
    classroomId: 'c1',
    startTime: '08:00',
    endTime: '09:40',
    weekday: 1,
    priority: 10,
  },
  {
    id: 'co2',
    name: '大学英语',
    teacherId: 't2',
    teacherName: '王芳老师',
    grade: 1,
    classId: 'cs2',
    classroomId: 'c2',
    startTime: '08:00',
    endTime: '09:40',
    weekday: 1,
    priority: 8,
  },
  {
    id: 'co3',
    name: '程序设计',
    teacherId: 't3',
    teacherName: '张伟教授',
    grade: 2,
    classId: 'cs3',
    classroomId: 'c3',
    startTime: '10:00',
    endTime: '11:40',
    weekday: 1,
    requiredEquipment: ['computer', 'lab'],
    priority: 9,
  },
  {
    id: 'co4',
    name: '物理实验',
    teacherId: 't4',
    teacherName: '刘强老师',
    grade: 2,
    classId: 'cs4',
    classroomId: 'c6',
    startTime: '14:00',
    endTime: '15:40',
    weekday: 1,
    requiredEquipment: ['lab'],
    priority: 7,
  },
];

function OccupancyRing({ value, size = 80, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 90 ? '#ef4444' : value >= 70 ? '#eab308' : '#22c55e';

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="bold"
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
}

export default function TeachingBuildingPage() {
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);

  const filteredClassrooms = selectedFloor === 'all'
    ? mockClassrooms
    : mockClassrooms.filter(c => c.floor === selectedFloor);

  const runAllocation = () => {
    setIsAllocating(true);
    setTimeout(() => {
      const result: AllocationResult = {
        totalCourses: 156,
        allocatedCourses: 152,
        autoAdjusted: 23,
        conflicts: [
          {
            id: 'conf1',
            classroomId: 'c2',
            classroomNumber: 'A201',
            timeSlot: '周三 3-4节',
            courses: [
              { courseId: 'x1', courseName: '数据结构', grade: 2, className: '计科2班', teacherName: '赵老师', priority: 9 },
              { courseId: 'x2', courseName: '操作系统', grade: 3, className: '软工1班', teacherName: '钱老师', priority: 8 },
            ],
            resolved: false,
          },
        ],
        timetable: mockCourses,
      };
      setAllocationResult(result);
      setIsAllocating(false);
    }, 2000);
  };

  const handleSelectClassroom = (id: string) => {
    const room = mockClassrooms.find(c => c.id === id);
    if (room) {
      setSelectedClassroom(room);
    }
  };

  const displayClassroom = selectedClassroom || filteredClassrooms[0];
  const occupancy = displayClassroom
    ? Math.round((displayClassroom.occupiedSeats / displayClassroom.capacity) * 100)
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Building2 className="w-7 h-7 text-primary-300" />
              教学楼智能管理
            </h2>
            <p className="text-gray-500 mt-1">教室状态监控与智能排课调度</p>
          </div>
          <button
            onClick={runAllocation}
            disabled={isAllocating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-success text-white font-medium disabled:opacity-60"
          >
            {isAllocating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>AI 分配计算中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>执行智能分配</span>
              </>
            )}
          </button>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 relative">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-700/50" style={{ height: 'calc(100vh - 120px)' }}>
              <TeachingScene
                classrooms={filteredClassrooms}
                selectedId={selectedClassroom?.id}
                onSelectClassroom={handleSelectClassroom}
              />
            </div>
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              {([1, 2, 3, 4] as const).map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur ${
                    selectedFloor === floor
                      ? 'bg-success text-white'
                      : 'bg-bg-card/80 text-gray-400 hover:text-white border border-bg-border'
                  }`}
                >
                  {floor}F
                </button>
              ))}
              <button
                onClick={() => setSelectedFloor('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur ${
                  selectedFloor === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-bg-card/80 text-gray-400 hover:text-white border border-bg-border'
                }`}
              >
                全部
              </button>
            </div>
          </div>

          <div className="w-96 space-y-6 flex-shrink-0">
            {allocationResult && (
              <div className="rounded-2xl bg-gradient-to-br from-success/15 to-primary/15 border border-success/40 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-success">分配完成</h3>
                    <p className="text-xs text-gray-400">智能排课结果</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-bg-card/60">
                    <div className="font-orbitron text-xl font-bold text-success">{allocationResult.allocatedCourses}</div>
                    <div className="text-xs text-gray-500">已分配</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-bg-card/60">
                    <div className="font-orbitron text-xl font-bold text-warning">{allocationResult.autoAdjusted}</div>
                    <div className="text-xs text-gray-500">自动调整</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-bg-card/60">
                    <div className={`font-orbitron text-xl font-bold ${allocationResult.conflicts.length > 0 ? 'text-danger' : 'text-success'}`}>
                      {allocationResult.conflicts.length}
                    </div>
                    <div className="text-xs text-gray-500">待处理冲突</div>
                  </div>
                </div>
                {allocationResult.conflicts.length > 0 && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/30">
                    <div className="flex items-center gap-2 text-danger text-sm font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      检测到排课冲突
                    </div>
                    {allocationResult.conflicts.map((c) => (
                      <div key={c.id} className="text-xs text-gray-300 mb-1">
                        • {c.classroomNumber} {c.timeSlot}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {displayClassroom && (
              <div className="rounded-2xl bg-bg-card border border-success/30 p-5 shadow-lg shadow-success/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-success flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    选中教室详情
                  </h3>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <OccupancyRing value={occupancy} />
                  <div className="flex-1">
                    <div className="text-xl font-bold">{displayClassroom.roomNumber}</div>
                    <div className="text-sm text-gray-500">{displayClassroom.floor}楼 · {displayClassroom.capacity}人容量</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {displayClassroom.occupiedSeats} 人使用中
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-3 rounded-xl bg-bg-light/50">
                    <Thermometer className="w-5 h-5 text-danger mx-auto mb-1" />
                    <div className="text-sm font-bold">{displayClassroom.sensors.temperature}°</div>
                    <div className="text-xs text-gray-500">温度</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-bg-light/50">
                    <Droplets className="w-5 h-5 text-primary-300 mx-auto mb-1" />
                    <div className="text-sm font-bold">{displayClassroom.sensors.humidity}%</div>
                    <div className="text-xs text-gray-500">湿度</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-bg-light/50">
                    <Lightbulb className="w-5 h-5 text-warning mx-auto mb-1" />
                    <div className="text-sm font-bold">{displayClassroom.sensors.illuminance}</div>
                    <div className="text-xs text-gray-500">照度</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-gray-500">当前课程</div>
                  {mockCourses.filter(c => c.classroomId === displayClassroom.id).length > 0 ? (
                    mockCourses.filter(c => c.classroomId === displayClassroom.id).map((course) => (
                      <div key={course.id} className="p-3 rounded-xl bg-bg-light/50 border border-bg-border">
                        <div className="font-medium text-sm mb-1">{course.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Users className="w-3 h-3" />
                          {course.teacherName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" />
                          {course.startTime} - {course.endTime}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-bg-light/30 border border-bg-border/50 text-center text-gray-500 text-sm">
                      暂无课程安排
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-bg-card border border-bg-border overflow-hidden">
              <div className="p-5 border-b border-bg-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">教室列表</h3>
                    <p className="text-xs text-gray-500">{filteredClassrooms.length} 间教室</p>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[320px]">
                <table className="w-full">
                  <thead className="bg-bg-lighter/50 sticky top-0 z-10 backdrop-blur">
                    <tr className="text-xs text-gray-500">
                      <th className="text-left py-3 px-4 font-medium">教室</th>
                      <th className="text-left py-3 px-4 font-medium">容量</th>
                      <th className="text-left py-3 px-4 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bg-border">
                    {filteredClassrooms.map((room) => {
                      const usage = Math.round((room.occupiedSeats / room.capacity) * 100);
                      const isSelected = selectedClassroom?.id === room.id;
                      return (
                        <tr
                          key={room.id}
                          onClick={() => setSelectedClassroom(room)}
                          className={`table-row cursor-pointer ${
                            isSelected ? 'bg-success/10' : 'hover:bg-success/5'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium">{room.roomNumber}</div>
                            <div className="text-xs text-gray-500">{room.floor}F · {room.equipment.length}个设备</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">{room.occupiedSeats}/{room.capacity}</div>
                            <div className="w-20 h-1.5 rounded-full bg-bg-lighter mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  usage >= 90 ? 'bg-danger' : usage >= 70 ? 'bg-warning' : 'bg-success'
                                }`}
                                style={{ width: `${usage}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`badge ${
                              usage === 0 ? 'badge-primary' :
                              usage >= 90 ? 'badge-danger' :
                              usage >= 70 ? 'badge-warning' : 'badge-success'
                            }`}>
                              {usage === 0 ? '空闲' : usage >= 90 ? '爆满' : usage >= 70 ? '紧张' : '正常'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
