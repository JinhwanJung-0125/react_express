import express from 'express'
import bcrypt from 'bcrypt'
import { db } from '../../lib/db.js'

/**로그인, 로그아웃, 회원가입 등과 관련된 router */
export const router = express.Router()

router.post('/login_process', (req, res, next) => {
    //로그인 프로세스
    console.log('로그인 프로세스 실행' + req.body.ID + req.body.password)
    let username = req.body.ID
    let password = req.body.password

    if (username !== undefined && password !== undefined) {
        //id, password 둘 다 제대로 받았으면 유저 정보에서 찾기
        db.query('select * from users where id = ?', [username], (err, result, field) => {
            //db에 유저 검색
            if (err) next(err) //db 오류

            if (result.length > 0) {
                //결과를 찾았다면

                bcrypt.compare(password, result[0].password, (err, isCorrect) => {
                    //password가 맞는지 학인
                    if (isCorrect === true) {
                        //password도 맞으면
                        req.session.is_logined = true
                        req.session.nickname = username
                        req.session.save(() => {
                            //맞으면 세션 정보 수정 후 저장
                            return res.send({ isSuccess: true });
                        })
                    } else {
                        return res.send({ isSuccess: false }); //password가 안맞으면 false
                    }
                })
            } else {
                return res.send({ isSuccess: false }); //id가 없으면 false
            }
        })

        // // 결과가 없다면 관리자 정보에 있는지 확인
        // db.query('select * from managers where id = ?', [username], (errM, result, field) => {
        //     //db에 관리자 검색
        //     if (errM) throw errM //db 오류

        //     if (result.length > 0) {
        //         //결과를 찾았다면

        //         bcrypt.compare(password, result[0].password_hashed, (err, isCorrect) => {
        //             //password가 맞는지 학인
        //             if (isCorrect === true) {
        //                 req.session.is_logined = true
        //                 req.session.nickname = username
        //                 req.session.is_manager = true
        //                 req.session.save(() => {
        //                     //맞으면 세션 정보 수정(관리자 전용으로) 후 저장
        //                     res.send(true) //수정?
        //                 })
        //             }
        //         })
        //     }
        // })

        //결과를 찾지 못했다면
    } else {
        //id, password 둘 중 하나라도 빠졌다면
        return res.send({ isSuccess: false, value: "누락된 정보 있음" });
    }
})

router.get('/logout', (req, res) => {
    //로그아웃 시 세션 삭제
    req.session.destroy((err) => {
        res.clearCookie('connected.sid')
        res.send(true)
    })
})

router.post('/register_process', (req, res, next) => {
    //회원가입 프로세스
    let username = req.body.id
    let password = req.body.password

    console.log(username, password, '회원가입')

    if (username !== undefined && password !== undefined) {
        //id, password 다 작성했다면
        db.query('select * from users where id = ?', [username], (err, result, field) => {
            //같은 id를 가진 유저가 있는지 db에서 찾기
            if (err) next(err);

            if (result.length <= 0) {
                //같은 id가 없으면
                const hashed_password = bcrypt.hashSync(password, 10) //password를 암호화하고

                db.query('insert into users (id, password) value (?, ?)', [username, hashed_password], (err2, data) => {
                    //db에 저장 회원가입 완료
                    if (err2) next(err2);

                    return res.send({ isSuccess: true });
                }
                )
            } else {
                //중복되는 id가 있으면
                return res.send({ isSuccess: false, value: "중복된 ID가 있음" });
            }
        })
    } else {
        //누락된 정보가 있다면
        return res.send({ isSuccess: false, value: "누락된 정보 있음" });
    }
})

router.get('/authCheck', (req, res) => {
    //세션으로 로그인 여부 확인
    if (req.session.is_logined !== undefined && req.session.is_logined) {
        console.log('로그인중')
        return res.send(true)
    } else {
        console.log('로그인중 아님')
        console.log(req.session.is_logined)
        return res.send(false)
    }
})
