import dayjs from 'dayjs';
import {
  librarySeatRepository,
  reservationRepository,
  userRepository,
} from '../dataSource/index.js';
import type { Reservation, LibrarySeat } from '../../shared/types.js';

const CHECK_IN_TIMEOUT_MINUTES = 15;
const MAX_RESERVATION_DURATION_HOURS = 4;

let checkerInterval: NodeJS.Timeout | null = null;

export class SeatService {
  static reserveSeat(
    seatId: string,
    studentId: string,
    startTime: string,
    endTime: string,
  ): Reservation {
    const seat = librarySeatRepository.findById(seatId);
    if (!seat) {
      throw new Error('座位不存在');
    }

    if (seat.status === 'MAINTENANCE') {
      throw new Error('该座位正在维护中，无法预约');
    }

    const student = userRepository.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('学生不存在或身份无效');
    }

    const startDt = dayjs(startTime);
    const endDt = dayjs(endTime);

    if (!startDt.isValid() || !endDt.isValid()) {
      throw new Error('时间格式无效');
    }

    if (startDt.isBefore(dayjs())) {
      throw new Error('开始时间不能早于当前时间');
    }

    if (endDt.isBefore(startDt)) {
      throw new Error('结束时间不能早于开始时间');
    }

    if (endDt.diff(startDt, 'hour') > MAX_RESERVATION_DURATION_HOURS) {
      throw new Error(`预约时长不能超过${MAX_RESERVATION_DURATION_HOURS}小时`);
    }

    const existingReservations = reservationRepository.filter(
      (r) => r.seatId === seatId && r.checkInStatus !== 'CANCELLED' && r.checkInStatus !== 'EXPIRED',
    );

    for (const existing of existingReservations) {
      const existingStart = dayjs(existing.startTime);
      const existingEnd = dayjs(existing.endTime);
      if (startDt.isBefore(existingEnd) && endDt.isAfter(existingStart)) {
        throw new Error('该时段座位已被预约');
      }
    }

    const studentReservations = reservationRepository.filter(
      (r) => r.studentId === studentId && r.checkInStatus !== 'CANCELLED' && r.checkInStatus !== 'EXPIRED',
    );
    if (studentReservations.length >= 2) {
      throw new Error('每位学生最多同时预约2个座位');
    }

    const reservation = reservationRepository.create({
      seatId,
      seatNumber: seat.seatNumber,
      studentId,
      studentName: student.name,
      startTime: startDt.toISOString(),
      endTime: endDt.toISOString(),
      checkInStatus: 'PENDING',
      createdAt: dayjs().toISOString(),
    });

    librarySeatRepository.update(seatId, {
      status: 'RESERVED',
      currentStudentId: studentId,
      currentStudentName: student.name,
      reservedUntil: endDt.toISOString(),
    });

    this.ensureCheckerRunning();
    return reservation;
  }

  static checkIn(reservationId: string): Reservation {
    const reservation = reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.checkInStatus === 'EXPIRED') {
      throw new Error('预约已过期，无法签到');
    }

    if (reservation.checkInStatus === 'CANCELLED') {
      throw new Error('预约已取消');
    }

    if (reservation.checkInStatus === 'CHECKED_IN') {
      throw new Error('已签到，请勿重复操作');
    }

    const startDt = dayjs(reservation.startTime);
    const now = dayjs();
    const deadline = startDt.add(CHECK_IN_TIMEOUT_MINUTES, 'minute');

    if (now.isAfter(deadline)) {
      reservationRepository.update(reservationId, { checkInStatus: 'EXPIRED' });
      const seat = librarySeatRepository.findById(reservation.seatId);
      if (seat) {
        librarySeatRepository.update(reservation.seatId, {
          status: 'AVAILABLE',
          currentStudentId: undefined,
          currentStudentName: undefined,
          reservedUntil: undefined,
        });
      }
      throw new Error(`超过预约时间${CHECK_IN_TIMEOUT_MINUTES}分钟未签到，预约已失效`);
    }

    const checkedIn = reservationRepository.update(reservationId, {
      checkInStatus: 'CHECKED_IN',
    });

    librarySeatRepository.update(reservation.seatId, {
      status: 'IN_USE',
      checkedInAt: now.toISOString(),
    });

    return checkedIn!;
  }

  static checkExpiredReservations(): { released: number; expired: string[] } {
    const now = dayjs();
    const released: string[] = [];

    const pendingReservations = reservationRepository.filter(
      (r) => r.checkInStatus === 'PENDING',
    );

    for (const reservation of pendingReservations) {
      const startDt = dayjs(reservation.startTime);
      const deadline = startDt.add(CHECK_IN_TIMEOUT_MINUTES, 'minute');
      if (now.isAfter(deadline)) {
        reservationRepository.update(reservation.id, { checkInStatus: 'EXPIRED' });
        const seat = librarySeatRepository.findById(reservation.seatId);
        if (seat && seat.status === 'RESERVED' && seat.currentStudentId === reservation.studentId) {
          librarySeatRepository.update(reservation.seatId, {
            status: 'AVAILABLE',
            currentStudentId: undefined,
            currentStudentName: undefined,
            reservedUntil: undefined,
          });
        }
        released.push(reservation.id);
      }
    }

    const activeReservations = reservationRepository.filter(
      (r) => r.checkInStatus === 'CHECKED_IN',
    );
    for (const reservation of activeReservations) {
      const endDt = dayjs(reservation.endTime);
      if (now.isAfter(endDt)) {
        const seat = librarySeatRepository.findById(reservation.seatId);
        if (seat) {
          const checkedInAt = seat.checkedInAt ? dayjs(seat.checkedInAt) : now;
          const usedMinutes = Math.min(now.diff(checkedInAt, 'minute'), 480);
          librarySeatRepository.update(reservation.seatId, {
            status: 'AVAILABLE',
            currentStudentId: undefined,
            currentStudentName: undefined,
            reservedUntil: undefined,
            checkedInAt: undefined,
            usedMinutesToday: seat.usedMinutesToday + usedMinutes,
          });
        }
        released.push(reservation.id);
      }
    }

    return {
      released: released.length,
      expired: released,
    };
  }

  static cancelReservation(reservationId: string, studentId: string): Reservation {
    const reservation = reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.studentId !== studentId) {
      throw new Error('无权取消他人预约');
    }

    if (reservation.checkInStatus === 'CHECKED_IN') {
      throw new Error('已签到的预约不能取消，请联系管理员');
    }

    if (reservation.checkInStatus !== 'PENDING') {
      throw new Error('当前状态无法取消');
    }

    const cancelled = reservationRepository.update(reservationId, {
      checkInStatus: 'CANCELLED',
    });

    const seat = librarySeatRepository.findById(reservation.seatId);
    if (seat && seat.status === 'RESERVED' && seat.currentStudentId === studentId) {
      librarySeatRepository.update(reservation.seatId, {
        status: 'AVAILABLE',
        currentStudentId: undefined,
        currentStudentName: undefined,
        reservedUntil: undefined,
      });
    }

    return cancelled!;
  }

  static getMyReservations(studentId: string): Reservation[] {
    return reservationRepository.filter((r) => r.studentId === studentId);
  }

  static getSeatStatus(zone?: LibrarySeat['zone']): LibrarySeat[] {
    const seats = librarySeatRepository.findAll();
    if (zone) {
      return seats.filter((s) => s.zone === zone);
    }
    return seats;
  }

  private static ensureCheckerRunning(): void {
    if (checkerInterval) return;
    checkerInterval = setInterval(() => {
      try {
        this.checkExpiredReservations();
      } catch (err) {
        console.error('[SeatService] 超时检查失败:', err);
      }
    }, 30 * 1000);
    checkerInterval.unref();
  }

  static startAutoCheck(): void {
    this.ensureCheckerRunning();
  }

  static stopAutoCheck(): void {
    if (checkerInterval) {
      clearInterval(checkerInterval);
      checkerInterval = null;
    }
  }
}
