import express from 'express';
import { db } from '../../lib/db.js';
import fs from 'fs';
import path from 'path';

const folder_path = path.resolve("");   //현재 파일이 속한 폴더의 상위 폴더 위치

/**입찰서 다운로드와 관련된 router */
export const router = express.Router();

router.all('/download/:bidPath', (req, res, next) => {
    if(!fs.existsSync(folder_path + "\\" + req.session.nickname + "\\" + req.params.bidPath)){  //먼저, 서버에 요구하는 파일이 있는지 확인
        console.log('Fail')
        res.send(false);
    }
    else{
        db.query("select bidPath, bidID from userbidfiles where bidPath = ?", [req.params.bidPath], (err, result, field) => {   //요구하는 파일 위치와 bidID를 DB에서 조회
            if(err) console.error(err);

            if(result.length > 0){
                const file = folder_path + "\\" + req.session.nickname + "\\" + result[0].bidPath;  //요구하는 파일의 위치
                
                console.log('Success')
                res.download(file, result[0].bidID + ".BID");   //다운로드를 보냄
            }
            else{
                res.send(false);
            }
        });
    }
}) 