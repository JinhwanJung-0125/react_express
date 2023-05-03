import express from 'express';
import { db } from '../../lib/db.js';

/**입찰서 작성과 관련된 router */
export const router = express.Router();

router.post('/revised_test', (req, res) => {    //간이종심제 Bid 만들기
    
});

router.post('/qualification', (req, res) => {   //적격심사 Bid 만들기

});