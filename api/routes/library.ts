import { Router, type Request, type Response } from 'express';
import { SeatService } from '../services/index.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import type { ApiResponse, LibrarySeat, Reservation } from '../../shared/types.js';

const router = Router();

router.get('/library/seats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const zone = req.query.zone as LibrarySeat['zone'] | undefined;
    const seats = SeatService.getSeatStatus(zone);
    const response: ApiResponse<LibrarySeat[]> = {
      code: 0,
      message: '获取座位列表成功',
      data: seats,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取座位列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

router.post('/library/reserve', authenticate, requireRoles('student'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { seatId, startTime, endTime } = req.body as { seatId: string; startTime: string; endTime: string };
    const studentId = req.user!.id;
    const reservation = SeatService.reserveSeat(seatId, studentId, startTime, endTime);
    const response: ApiResponse<Reservation> = {
      code: 0,
      message: '预约成功',
      data: reservation,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '预约失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

router.post('/library/checkin', authenticate, requireRoles('student'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { reservationId } = req.body as { reservationId: string };
    const reservation = SeatService.checkIn(reservationId);
    const response: ApiResponse<Reservation> = {
      code: 0,
      message: '签到成功',
      data: reservation,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '签到失败';
    const response: ApiResponse<null> = { code: 400, message, data: null, timestamp: Date.now() };
    res.status(400).json(response);
  }
});

router.get('/library/reservations', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const reservations = SeatService.getMyReservations(studentId);
    const response: ApiResponse<Reservation[]> = {
      code: 0,
      message: '获取预约列表成功',
      data: reservations,
      timestamp: Date.now(),
    };
    res.status(200).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取预约列表失败';
    const response: ApiResponse<null> = { code: 500, message, data: null, timestamp: Date.now() };
    res.status(500).json(response);
  }
});

export default router;
