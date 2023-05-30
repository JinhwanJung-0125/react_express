import express from 'express'
import { db } from '../../lib/db.js';

/**사용자가 작성한 입찰서 리스트와 관련된 router */
export const router = express.Router()

router.get('/:id', (req, res, next) => {    //사용자가 만든 해당 입찰 건의 입찰서 리스트를 보여줌
    db.query('select bidPath, bidID from userBidFiles_revised_test where userID = ? and bidID = ?', [req.session.nickname, req.params.id], (err, data, field) => {
        if (err) next(err)

        if (data > 0) {
            return res.send(data);
        }
        else {
            db.query("select bidPath, bidID from userBidFiles_eligible_audit where userID = ? and bidID = ?", [req.session.nickname, req.params.id], (err2, data, field) => {
                if (err2) next(err2)

                return res.send(data);
            })
        }
    })
})
