import dayjs from 'dayjs';
import {
  classroomRepository,
  courseRepository,
  scheduleConflictRepository,
  userRepository,
} from '../dataSource/index.js';
import type {
  Course,
  Classroom,
  ScheduleConflict,
  AllocationResult,
  EquipmentType,
} from '../../shared/types.js';

const GRADE_SIZE: Record<number, number> = {
  7: 45,
  8: 46,
  9: 48,
  10: 50,
  11: 52,
  12: 55,
};

type TimetableKey = `${string}-${string}-${string}`;

export class AllocationService {
  private static makeKey(classroomId: string, weekday: number, startTime: string, endTime: string): TimetableKey {
    return `${classroomId}-${weekday}-${startTime}-${endTime}`;
  }

  private static equipmentSatisfies(roomEquip: EquipmentType[], required: EquipmentType[] = []): boolean {
    if (required.length === 0) return true;
    return required.every((eq) => roomEquip.includes(eq));
  }

  private static timeOverlap(
    wd1: number, s1: string, e1: string,
    wd2: number, s2: string, e2: string,
  ): boolean {
    if (wd1 !== wd2) return false;
    return !(e1 <= s2 || e2 <= s1);
  }

  private static calcDistance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2));
  }

  static allocateClassrooms(): AllocationResult {
    const courses = courseRepository.findAll();
    const classrooms = classroomRepository.findAll();
    const timetable: Course[] = [];
    const conflicts: ScheduleConflict[] = [];
    let allocatedCount = 0;
    let autoAdjusted = 0;

    const roomOccupancy = new Map<TimetableKey, Course[]>();

    const sortedCourses = [...courses].sort((a, b) => {
      if (b.grade !== a.grade) return b.grade - a.grade;
      return b.priority - a.priority;
    });

    const getClassStudents = (grade: number): number => GRADE_SIZE[grade] || 45;

    for (const course of sortedCourses) {
      const requiredStudents = getClassStudents(course.grade);
      const weekday = course.weekday;
      const startTime = course.startTime;
      const endTime = course.endTime;

      const candidateRooms = classrooms.filter((room) => {
        if (room.capacity < requiredStudents) return false;
        if (!this.equipmentSatisfies(room.equipment, course.requiredEquipment)) return false;
        const existing = roomOccupancy.get(this.makeKey(room.id, weekday, startTime, endTime));
        if (existing) {
          return !existing.some((c) =>
            this.timeOverlap(
              c.weekday, c.startTime, c.endTime,
              weekday, startTime, endTime,
            ),
          );
        }
        return true;
      });

      if (candidateRooms.length === 0) {
        const potentialRooms = classrooms.filter(
          (r) =>
            r.capacity >= requiredStudents &&
            this.equipmentSatisfies(r.equipment, course.requiredEquipment),
        );

        const conflictRoom = potentialRooms[0];
        if (conflictRoom) {
          const conflictingCourses = this.findConflictingCourses(
          conflictRoom, weekday, startTime, endTime, roomOccupancy,
        );

          const lowerPriorityCourses = conflictingCourses.filter(
            (c) => c.grade < course.grade ||
              (c.grade === course.grade && c.priority < course.priority)
          );

          if (lowerPriorityCourses.length > 0) {
            const toRemove = lowerPriorityCourses[0];
            const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const allCoursesInConflict = [toRemove, course];

            this.removeFromOccupancy(roomOccupancy, conflictRoom.id, weekday, toRemove.startTime, toRemove.endTime, toRemove.id);

            const reassigned = this.reassignCourse(toRemove, classrooms, roomOccupancy, conflictRoom.id);
            if (reassigned) {
              autoAdjusted++;
              const idx = timetable.findIndex(c => c.id === toRemove.id);
              if (idx >= 0) {
                timetable[idx] = reassigned;
              } else {
                timetable.push(reassigned);
              }
            } else {
              const idx = timetable.findIndex(c => c.id === toRemove.id);
              if (idx >= 0) {
                timetable.splice(idx, 1);
              }
              courseRepository.update(toRemove.id, { classroomId: undefined });
            }

            const assigned = this.assignCourseToRoom(course, conflictRoom);
            timetable.push(assigned);
            allocatedCount++;
            this.recordOccupancy(roomOccupancy, conflictRoom.id, weekday, startTime, endTime, course);
            courseRepository.update(course.id, { classroomId: conflictRoom.id });

            const newRoom = reassigned ? classrooms.find(r => r.id === reassigned.classroomId) : undefined;
            const notifiedTeachers = [
              course.teacherName,
              toRemove.teacherName,
            ].filter(Boolean) as string[];

            conflicts.push({
              id: conflictId,
              classroomId: conflictRoom.id,
              classroomNumber: conflictRoom.roomNumber,
              timeSlot: `周${['一','二','三','四','五','六','日'][weekday - 1]} ${startTime}-${endTime}`,
              courses: allCoursesInConflict.map((c) => ({
                courseId: c.id,
                courseName: c.name,
                grade: c.grade,
                className: this.getClassName(c.classId),
                teacherName: c.teacherName,
                priority: c.priority,
              })),
              resolved: true,
              resolvedBy: course.id,
              autoAdjusted: true,
              adjustmentNote: `因${course.grade}年级${course.name}（优先级${course.priority}）高于${toRemove.grade}年级${toRemove.name}（优先级${toRemove.priority}），已自动调整低优先级课程`,
              retainedCourse: {
                courseId: course.id,
                courseName: course.name,
                grade: course.grade,
                teacherName: course.teacherName,
                classroomId: conflictRoom.id,
                classroomNumber: conflictRoom.roomNumber,
              },
              adjustedCourse: {
                courseId: toRemove.id,
                courseName: toRemove.name,
                grade: toRemove.grade,
                teacherName: toRemove.teacherName,
                fromClassroomId: conflictRoom.id,
                fromClassroomNumber: conflictRoom.roomNumber,
                toClassroomId: reassigned ? reassigned.classroomId : undefined,
                toClassroomNumber: newRoom ? newRoom.roomNumber : undefined,
                success: !!reassigned,
              },
              notifiedTeachers,
            });
          } else {
            const conflictId = `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const allCoursesInConflict = [...conflictingCourses, course];

            const notifiedTeachers = allCoursesInConflict
              .map(c => c.teacherName)
              .filter(Boolean) as string[];

            conflicts.push({
              id: conflictId,
              classroomId: conflictRoom.id,
              classroomNumber: conflictRoom.roomNumber,
              timeSlot: `周${['一','二','三','四','五','六','日'][weekday - 1]} ${startTime}-${endTime}`,
              courses: allCoursesInConflict.map((c) => ({
                courseId: c.id,
                courseName: c.name,
                grade: c.grade,
                className: this.getClassName(c.classId),
                teacherName: c.teacherName,
                priority: c.priority,
              })),
              resolved: false,
              autoAdjusted: false,
              adjustmentNote: '课程优先级相同或均为低优先级，需手动处理，请选择保留哪门课程',
              notifiedTeachers,
            });
          }
        }
        continue;
      }

      let bestRoom: Classroom | undefined;
      let bestDist = Infinity;

      for (const room of candidateRooms) {
        const refPoint = { x: 0, y: course.grade * 0.5, z: 0 };
        const dist = this.calcDistance(room.position3D, refPoint);
        if (dist < bestDist) {
          bestDist = dist;
          bestRoom = room;
        }
      }

      if (bestRoom) {
        const assigned = this.assignCourseToRoom(course, bestRoom);
        timetable.push(assigned);
        allocatedCount++;
        this.recordOccupancy(roomOccupancy, bestRoom.id, weekday, startTime, endTime, course);
      }
    }

    for (const c of timetable) {
      courseRepository.update(c.id, { classroomId: c.classroomId });
    }

    scheduleConflictRepository.clear();
    for (const conf of conflicts) {
      scheduleConflictRepository.create(conf);
    }

    return {
      totalCourses: courses.length,
      allocatedCourses: allocatedCount,
      conflicts,
      autoAdjusted,
      timetable,
    };
  }

  private static findConflictingCourses(
    room: Classroom,
    weekday: number,
    startTime: string,
    endTime: string,
    occupancy: Map<TimetableKey, Course[]>,
  ): Course[] {
    const result: Course[] = [];
    for (const [, courses] of occupancy.entries()) {
      for (const c of courses) {
        if (
          c.classroomId === room.id &&
          this.timeOverlap(c.weekday, c.startTime, c.endTime, weekday, startTime, endTime)
        ) {
          result.push(c);
        }
      }
    }
    return result;
  }

  private static assignCourseToRoom(course: Course, room: Classroom): Course {
    return {
      ...course,
      classroomId: room.id,
    };
  }

  private static recordOccupancy(
    occupancy: Map<TimetableKey, Course[]>,
    roomId: string,
    weekday: number,
    startTime: string,
    endTime: string,
    course: Course,
  ): void {
    const key = this.makeKey(roomId, weekday, startTime, endTime);
    if (!occupancy.has(key)) {
      occupancy.set(key, []);
    }
    occupancy.get(key)!.push({ ...course, classroomId: roomId });
  }

  private static removeFromOccupancy(
    occupancy: Map<TimetableKey, Course[]>,
    roomId: string,
    weekday: number,
    startTime: string,
    endTime: string,
    courseId: string,
  ): void {
    for (const [key, courses] of occupancy.entries()) {
      const idx = courses.findIndex(c => c.id === courseId);
      if (idx >= 0) {
        courses.splice(idx, 1);
        if (courses.length === 0) {
          occupancy.delete(key);
        }
        break;
      }
    }
  }

  private static reassignCourse(
    course: Course,
    classrooms: Classroom[],
    occupancy: Map<TimetableKey, Course[]>,
    excludeRoomId?: string,
  ): Course | null {
    const requiredStudents = GRADE_SIZE[course.grade] || 45;

    const availableRooms = classrooms.filter((room) => {
      if (excludeRoomId && room.id === excludeRoomId) return false;

      if (room.capacity < requiredStudents) return false;
      if (!this.equipmentSatisfies(room.equipment, course.requiredEquipment)) return false;

      const existing = occupancy.get(this.makeKey(room.id, course.weekday, course.startTime, course.endTime));
      if (existing && existing.length > 0) {
        return !existing.some((c) =>
          this.timeOverlap(
            c.weekday, c.startTime, c.endTime,
            course.weekday, course.startTime, course.endTime,
          ),
        );
      }
      return true;
    });

    if (availableRooms.length === 0) return null;

    let bestRoom: Classroom | undefined;
    let bestDist = Infinity;

    for (const room of availableRooms) {
      const refPoint = { x: 0, y: course.grade * 0.5, z: 0 };
      const dist = this.calcDistance(room.position3D, refPoint);
      if (dist < bestDist) {
        bestDist = dist;
        bestRoom = room;
      }
    }

    if (!bestRoom) return null;

    const assigned = this.assignCourseToRoom(course, bestRoom);
    this.recordOccupancy(occupancy, bestRoom.id, course.weekday, course.startTime, course.endTime, course);
    courseRepository.update(course.id, { classroomId: bestRoom.id });
    return assigned;
  }

  private static getClassName(classId: string): string {
    const parts = classId.replace('cls_', '').split('_');
    if (parts.length >= 2) {
      const grade = parseInt(parts[0]);
      const classNum = parseInt(parts[1]);
      const gradeMap: Record<number, string> = {
        7: '初一', 8: '初二', 9: '初三', 10: '高一', 11: '高二', 12: '高三',
      };
      return `${gradeMap[grade] || grade}${classNum}班`;
    }
    return classId;
  }

  static resolveConflict(conflictId: string, keepCourseId: string): ScheduleConflict | null {
    const conflict = scheduleConflictRepository.findById(conflictId);
    if (!conflict) return null;

    const keptCourseInfo = conflict.courses.find((c) => c.courseId === keepCourseId);
    if (!keptCourseInfo) return null;

    const removedCourseIds = conflict.courses
      .filter((c) => c.courseId !== keepCourseId)
      .map((c) => c.courseId);

    for (const removedId of removedCourseIds) {
      const course = courseRepository.findById(removedId);
      if (course) {
        const allCourses = courseRepository.findAll();
        const otherClassrooms = classroomRepository.filter(
          (r) => r.id !== conflict.classroomId,
        );

        let reassigned = false;
        for (const room of otherClassrooms) {
          const roomCourses = allCourses.filter(
            (c) =>
              c.classroomId === room.id &&
              c.id !== removedId,
          );
          const hasConflict = roomCourses.some((c) =>
            this.timeOverlap(
              c.weekday, c.startTime, c.endTime,
              course.weekday, course.startTime, course.endTime,
            ),
          );
          if (!hasConflict && room.capacity >= (GRADE_SIZE[course.grade] || 45)) {
            courseRepository.update(removedId, { classroomId: room.id });
            reassigned = true;
            break;
          }
        }

        if (!reassigned) {
          courseRepository.update(removedId, { classroomId: undefined });
        }
      }
    }

    const updated = scheduleConflictRepository.update(conflictId, {
      resolved: true,
      resolvedBy: keepCourseId,
    });

    return updated || null;
  }

  static getTimetable(): AllocationResult {
    const courses = courseRepository.findAll();
    const conflicts = scheduleConflictRepository.findAll();
    const allocated = courses.filter((c) => c.classroomId);

    return {
      totalCourses: courses.length,
      allocatedCourses: allocated.length,
      conflicts,
      autoAdjusted: 0,
      timetable: courses,
    };
  }
}
