import fs from 'fs';
import path from 'path';
import express, { type NextFunction, type Request, type Response } from 'express';
import cookieParser from 'cookie-parser';
import { bot } from './bot/index';
import { apiRouter } from './routes';
import { AppError } from './utils/AppError';

const app = express();

app.use(cookieParser());
app.use(express.json());

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRouter);

app.post('/bot/webhook', express.json(), (req, res) => {
  void bot.handleUpdate(req.body, res);
});

app.use((_request, _response, next) => {
  next(new AppError('Route not found', 404));
});

app.use((error: Error | AppError, _request: Request, response: Response, _next: NextFunction) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error.message || 'Internal server error';

  response.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
});

export { app };
