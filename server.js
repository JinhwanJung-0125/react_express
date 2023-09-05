import express from 'express'
import session from 'express-session'
import { default as sessionStore } from 'session-file-store'
import cookieParser from 'cookie-parser'
import path from 'path'
import morgan from 'morgan'
import dotenv from 'dotenv'
import cors from 'cors'
import { router as authRouter } from './router/login/auth.js'
import { router as postRouter } from './router/post/post.js'
import pkg_create_bid from './router/create_bid/create_bid.cjs';
const { router: createBidRouter } = pkg_create_bid;
import { router as dataRouter } from './router/data/data.js'
import { router as bidListRouter } from './router/created_bid_list/created_bid_list.js'
import { router as bidInfoRouter } from './router/bidInfo.js'
const __dirname = path.resolve()    // current working directory path

const app = express()
dotenv.config() // load environment file
app.set('port', process.env.PORT || 8080)
const FileStore = sessionStore(session)

app.use(morgan('dev'));

// env 파일 설정에 따라 CORS 설정 변경
if (process.env.CORS_ENV == 'development') {
    app.use(cors({ origin: true, credentials: true }));
}
else if (process.env.CORS_ENV == 'production') {
    app.use(cors({ origin: false, credentials: false }));
}
else {
    app.use(cors({ origin: true, credentials: true }));
}

app.use(express.static(path.join(__dirname, process.env.STATIC_PATH))) //react 프로젝트의 build를 static으로 사용하게 함
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(
    session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.COOKIE_SECRET,
        cookie: {
            httpOnly: true,
            secure: false,
        },
        store: new FileStore({ retries: 0 }),
    })
)

//===============서버에 대한 기본 세팅=====================

app.use('/auth', authRouter) //로그인, 회원 가입 등 인증 관련 처리 라우터

app.use('/post', postRouter) //공고 리스트 처리 라우터

app.use('/createBid', createBidRouter) //입찰서 작성 처리 라우터s

app.use('/data', dataRouter) //입찰서 데이터 관련 처리 라우터

app.use('/bidInfo', bidInfoRouter)

app.use('/createdBidList', bidListRouter) //사용자가 작성한 입찰서 내역 처리 라우터

app.get('*', (req, res) => {
    //어떤 접속이 오든 접속 시 index.html을 보내준다.
    res.sendFile(path.join(__dirname, '../../React-Project/build/index.html')) //react 프로젝트의 index.html을 root로 사용함
})

// app.use((req, res) => {
//     res.status(404).send('404 Not Found') //404 에러 처리 미들웨어
// })

app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).send(err.message) //에러 처리 미들웨어
})

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번에서 대기중...')
})
