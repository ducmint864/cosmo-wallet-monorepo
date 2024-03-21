import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth'

// Check environement
if (!process.env.JWT_SECRET) {
    console.error('Env error: access token secret not configured');
    process.exit(1);
};

if (!process.env.POSTGRES_CONNECTION_STRING) {
    console.error('Env error: refresh token secret not configured');
    process.exit(1);
}

if (!process.env.REFRESH_TOKEN_SECRET) {
    console.error('Env error: refresh token secret not configured');
    process.exit(1);
}

const port = 3000;
const root = '/'
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(root, (req: Request, res: Response) => {
    res.send('Usage: /{api}');
})

app.use('/auth', authRouter);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})