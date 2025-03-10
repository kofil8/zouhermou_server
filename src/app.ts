import express, { Application, NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import bodyParser from 'body-parser';
import router from './app/routes';
import GlobalErrorHandler from './app/middlewares/globalErrorHandler';
import morgan from 'morgan';
import logger from './app/utils/logger';

const app: Application = express();
const morganFormat = ':method :url :status :response-time ms';

export const corsOptions = {
  origin: ['*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware setup
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(' ')[0],
          url: message.split(' ')[1],
          status: message.split(' ')[2],
          responseTime: message.split(' ')[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  }),
);

app.use(morgan('dev'));

// app.use("/uploads", express.static(path.join("/var/www/uploads")));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))); // Serve static files from the "uploads" directory
// Route handler for the root endpoint
app.get('/', (req: Request, res: Response) => {
  res.send({
    message: 'Welcome to the API!',
  });
});

// Setup API routes
app.use('/api/v1', router);

// Error handling middleware
app.use(GlobalErrorHandler);

// 404 Not Found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API NOT FOUND!',
    error: {
      path: req.originalUrl,
      message: 'Your requested path is not found!',
    },
  });
  next();
});

export default app;
