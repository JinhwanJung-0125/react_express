import express from 'express';
import { db } from '../../lib/db.js';
import fs from 'fs';

export const router = express.Router();

router.all('/download', (req, res) => {
    if(!fs.existsSync('C:/Users/joung/Visual Studio Code Workspace/repos/react_express/' + req.session.nickname)){
        console.log('Fail')
        res.send(false);
    }
    else{
        const file = 'C:/Users/joung/Visual Studio Code Workspace/repos/react_express/' + req.session.nickname + '/2023013040800-01_공내역.BID' // 이 부분은 id로 유추할 수 있도록 추후 변경 예정
        console.log('Success')
        res.download(file, '2023013040800-01_공내역.BID')
    }
})