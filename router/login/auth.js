import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../../lib/db.js';

/**로그인, 로그아웃, 회원가입 등과 관련된 router */
export const router = express.Router();

router.get('/login', (req, res) => {    //로그인 화면으로 이동
    //로그인 페이지로 이동
});

router.post('/login_process', (req, res) => {   //로그인 프로세스
    let username = req.body.username;
    let password = req.body.pwd;

    if(username && password){   

        //id, password 둘 다 제대로 받았으면 유저 정보에서 찾기
        db.query('select * from users where username = ?', [username], (err, result, field) => {    //db에 유저 검색
            if(err) throw err;  //db 오류

            if(result.length > 0){  //결과를 찾았다면

                bcrypt.compare(password, result[0].password_hashed, (err, isCorrect) => {   //password가 맞는지 학인
                    if(isCorrect === true){
                        req.session.is_logined = true;
                        req.session.nickname = username;
                        req.session.save(() => {    //맞으면 세션 정보 수정 후 저장
                            res.redirect('/');  //수정?
                        });
                    }
                });
            }
        });

        //결과가 없다면 관리자 정보에 있는지 확인
        db.query('select * from managers where username = ?', [username], (errM, result, field) => {    //db에 관리자 검색
            if(errM) throw errM;    //db 오류

            if(result.length > 0){  //결과를 찾았다면

                bcrypt.compare(password, result[0].password_hashed, (err, isCorrect) => {   //password가 맞는지 학인
                    if(isCorrect === true){
                        req.session.is_logined = true;
                        req.session.nickname = username;
                        req.session.is_manager = true;
                        req.session.save(() => {    //맞으면 세션 정보 수정(관리자 전용으로) 후 저장
                            res.redirect('/');  //수정?
                        });
                    }
                });
            }
        });

        //결과를 찾지 못했다면
        res.send(`<script type="text/javascript">alert("로그인 정보가 일치하지 않습니다."); 
                document.location.href="/auth/login";</script>`);
    }
    else{   //id, password 둘 중 하나라도 빠졌다면
        res.send(`<script type="text/javascript">alert("아이디와 비밀번호를 입력하세요!"); 
                document.location.href="/auth/login";</script>`);
    }
});

router.get('/logout', (req, res) => {   //로그아웃 시 세션 삭제
    req.session.destroy((err) => {
        res.redirect('/');
    });
});

router.get('/register', (req, res) => { //회원가입 화면으로 이동
    //회윈가입 화면으로 이동
});

router.post('/register_process', (req, res) => {    //회원가입 프로세스
    let username = req.body.username;
    let password = req.body.pwd;
    let password2 = req.body.pwd2;

    if(username && password && password2){  //id, password, 확인용 password까지 다 작성했다면
        db.query('select * from users where username = ?', [username], (err, result, field) => {    //같은 id를 가진 유저가 있는지 db에서 찾기
            if(err) throw err;

            if(result.length <= 0 && password === password2){   //같은 id가 없고, password, 확인용 password가 맞으면
                const hashed_password = bcrypt.hashSync(password, 15);  //password를 암호화하고 

                db.query('insert into users (username, password_hashed) value (?, ?)', [username, hashed_password], (err2, data) => {   //db에 저장 회원가입 완료
                    if(err2) throw err2;

                    res.send(`<script type="text/javascript">alert("회원가입이 완료되었습니다!");
                            document.location.href="/auth/login";</script>`);
                });
            }
            else if(password !== password2){    //password, 확인용 password가 틀리면
                res.send(`<script type="text/javascript">alert("입력된 비밀번호가 서로 다릅니다."); 
                        document.location.href="/auth/register";</script>`);
            }
            else{   //중복되는 id가 있으면
                res.send(`<script type="text/javascript">alert("이미 존재하는 아이디 입니다."); 
                        document.location.href="/auth/register";</script>`);
            }
        });
    }
    else{   //누락된 정보가 있다면
        res.send(`<script type="text/javascript">alert("입력되지 않은 정보가 있습니다."); 
                document.location.href="/auth/register";</script>`);
    }
})