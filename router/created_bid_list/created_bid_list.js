import express from 'express'
import { db } from '../../lib/db.js'

/**사용자가 작성한 입찰서 리스트와 관련된 router */
export const router = express.Router()

router.get('/:id', (req, res, next) => {
    //사용자가 만든 해당 입찰 건의 입찰서 리스트를 보여줌
    db.query(
        'select bidPath, bidID from userBidFiles_revised_test where userID = ? and bidID = ?',
        [req.session.nickname, req.params.id],
        (err, data, field) => {
            //먼저, 간이종심제 테이블에서 찾는다.
            if (err) next(err)
            //data에 요소가 있다면 return /23.06.28
            if (data.length !== 0) {
                return res.send(data) //간이종심제 테이블에서 찾았다면 return
            } else {
                db.query(
                    'select bidPath, bidID from userBidFiles_eligible_audit where userID = ? and bidID = ?',
                    [req.session.nickname, req.params.id],
                    (err2, data, field) => {
                        //없다면 적격심사 테이블에서 찾는다.
                        if (err2) next(err2)
                        return res.send(data) //결과를 return
                    }
                )
            }
        }
    )
})
