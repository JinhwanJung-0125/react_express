import express from 'express';
import { db } from '../../lib/db.js'
import { isManager } from '../login/authCheck.js'

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

router.post('/add_post', (req, res) => {
    if(isManager(req, res)){
        //post에 새로운 입찰 건을 추가하는 method
    }
    else{
        res.send(`<script type="text/javascript">alert("권한이 없습니다."); 
        document.location.href="/post";</script>`);
    }
});

