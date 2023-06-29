import express from 'express'
import { db } from '../../lib/db.js'
import { isManager } from '../login/authCheck.js'
import path from 'path'
import multer from 'multer'
import fs from 'fs'

const FILE_PATH = 'Uploads/' //파일 업로드 경로
const upload = multer({
    //파일 업로드를 위한 multer 설정
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, FILE_PATH)
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname)
            done(null, path.basename(file.originalname, ext) + ext)
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
})

/**입찰 정보를 보여주는 부분과 관련된 router */
export const router = express.Router()

router.get('/', (req, res) => {
    //등록된 입찰 정보를 보내줌
    db.query('select constName, bidID from emptybid', (err, data, field) => {
        if (err) throw err

        res.send(data)
    })
})

// router.get('/:id', (req, res) => {  //특정 입찰의 코드 (id)를 받아 그 공사에 대한 디테일을 보여줌
//     if(req.body.is_logined){
//         db.query('select * from board where id = ?', [req.params.id], (err, result, field) => {
//             if(err) throw err;
//             //세부 입찰 정보 페이지로 이동
//         });
//     }
//     else{
//         res.send(`<script type="text/javascript">alert("로그인 후 이용이 가능합니다.");
//         document.location.href="/post";</script>`);
//     }
// });

router.post(
    '/add_file',
    upload.fields([{ name: 'file' }, { name: 'data' }]),
    (req, res, next) => {
        //공내역서를 업로드하는 미들웨어
        let constName = fs.readFileSync(req.files.data[0].path)

        constName = JSON.parse(constName.toString())[0].constName //blob 파일로부터 공사 명 추출

        let bidId = req.files.file[0].originalname.replace(/[^0-9 | -]+/, '') //파일 이름에서 bid id 추출

        db.query(
            'select * from emptybid where constName = ? and bidID = ?',
            [constName, bidId],
            (err, data) => {
                //DB에 이미 공내역서가 저장되어 있는지 확인
                if (err) next(err)

                if (data.length !== 0) {
                    //이미 저장되어 있다면

                    fs.rmSync(req.files.data[0].path) //blob파일 삭제
                    return res.send({ isSuccess: true })
                } else {
                    //저장되어있지 않다면
                    db.query(
                        'insert into emptybid values (?, ?, ?, ?)',
                        [constName, bidId, req.files.file[0].path, req.files.file[0].size],
                        (err, data) => {
                            //DB에는 공사명, 공내역서의 id와 경로, 크기만 저장됨
                            if (err) {
                                next(err)
                                return
                            } //db에러

                            fs.rmSync(req.files.data[0].path) //blob파일 삭제

                            if (data.affectedRows === 1) {
                                //db에 저장이 됬다면
                                return res.send({ isSuccess: true })
                            } else {
                                //저장이 안됬다면
                                return res.send({ isSuccess: false, value: 'DB에 저장되지 않음' })
                            }
                        }
                    )
                }
            }
        )
    }
    // (req, res) => {
    // if(true){
    //     //post에 새로운 입찰 건을 추가하는 method
    //     console.log(req);
    // }
    // else{
    //     return res.send(`<script type="text/javascript">alert("권한이 없습니다.");
    //     document.location.href="/post";</script>`);
    // }}
)
