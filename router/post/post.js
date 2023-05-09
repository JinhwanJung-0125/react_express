import express from 'express';
import { db } from '../../lib/db.js'
import { isManager } from '../login/authCheck.js'
import path from 'path';
import multer from 'multer';

const FILE_PATH = 'Uploads/';   //파일 업로드 경로
const upload = multer({ //파일 업로드를 위한 multer 설정
    storage: multer.diskStorage({
        destination(req, file, done){
            done(null, FILE_PATH);
        },
        filename(req, file, done){
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + ext);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

/**입찰 정보를 보여주는 부분과 관련된 router */
export const router = express.Router();

router.get('/', (req, res) => { //등록된 입찰 정보를 보내줌
    db.query('select * from board order by ready created_date desc', (err, data, field) => {
        if(err) throw err;

        res.send(data);
    });
});

router.get('/:id', (req, res) => {  //특정 입찰의 코드 (id)를 받아 그 공사에 대한 디테일을 보여줌
    if(req.body.is_logined){
        db.query('select * from board where id = ?', [req.params.id], (err, result, field) => {
            if(err) throw err;
            //세부 입찰 정보 페이지로 이동           
        });
    }
    else{
        res.send(`<script type="text/javascript">alert("로그인 후 이용이 가능합니다."); 
        document.location.href="/post";</script>`);
    }
});

router.post('/add_post', upload.single('bid'), (req, res) => {  //공내역서를 업로드하는 미들웨어
    console.log(req.file);

    db.query('insert into biddata values (?, ?, ?)', [req.file.originalname, req.file.path, req.file.size], (err, data) => {    //DB에는 공내역서의 이름과 경로, 크기만 저장됨
        if(err) console.error(err);

        console.log(data);

        return res.send(true);
    });

    }, 
    // (req, res) => {
    // if(true){
    //     //post에 새로운 입찰 건을 추가하는 method
    //     console.log(req);
    // }
    // else{
    //     return res.send(`<script type="text/javascript">alert("권한이 없습니다."); 
    //     document.location.href="/post";</script>`);
    // }}
);