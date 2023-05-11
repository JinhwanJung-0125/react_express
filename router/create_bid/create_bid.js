import express from 'express'
import pkg from '../../../BidHandling_CalculatePrice-1/execute.js'
const { execute } = pkg
import { db } from '../../lib/db.js'
import fs from 'fs'
import path from 'path'

/**입찰서 작성과 관련된 router */
export const router = express.Router()

router.post('/revised_test', (req, res) => {
    //간이종심제 Bid 만들기
    // let RadioDecimal = req.body.RadioDecimal_Check;
    // let StandardPrice = req.body.CheckStandardPrice;
    // let WeightValue = req.body.CheckWeightValue;
    // let CAD_Click = req.body.CheckCAD_Click;
    // let Ceiling_Click = req.body.CheckCeiling_Click;
    // let LaborCost_Click = req.body.CheckLaborCost_Click;
    // let CompanyName = req.body.CompanyRegistrationName;
    // let CompanyNum = req.body.CompanyRegistrationNum;
    // let BalancedRate = req.body.BalancedRateNum;
    // let PersonalRate = req.body.PersonalRateNum;
    // 클라이언트로부터 받아야 할 정보들

    let RadioDecimal = '1'
    let StandardPrice = '1'
    let WeightValue = '1'
    let CAD_Click = '1'
    let Ceiling_Click = '2'
    let LaborCost_Click = '1'
    let CompanyName = 'Test'
    let CompanyNum = '123456778990'
    let BalancedRate = 0.1
    let PersonalRate = 0.2

    let bidName = req.body.bidName //어떤 입찰 건에 대한 BID인지 판단하기 위한 bidName (우선 사용자로부터 직접 파일 이름을 입력받음 추후 입력받지 않게 만들 예정)

    db.query('select bid_path from biddata where name = ?', [bidName], (err, result, field) => {
        //DB로부터 bidName에 대한 서버에 저장되어 있는 공내역서의 path를 조회
        if (err) throw err

        if (result.length > 0) {
            //찾았다면
            //공내역서를 복사해 작업 폴더로 옳김
            fs.copyFileSync(
                'C:/Users/joung/Visual Studio Code Workspace/repos/react_express/' +
                    result[0].bid_path,
                'C:/Users/joung/Visual Studio Code Workspace/repos/BidHandling_CalculatePrice-1/AutoBid/EmptyBid/' +
                    bidName
            )

            //사용자가 입력한 대로 입찰서 작성
            execute(
                RadioDecimal,
                StandardPrice,
                WeightValue,
                CAD_Click,
                Ceiling_Click,
                LaborCost_Click,
                CompanyName,
                CompanyNum,
                BalancedRate,
                PersonalRate
            )

            if (
                !fs.existsSync(
                    'C:/Users/joung/Visual Studio Code Workspace/repos/react_express/' +
                        req.session.nickname
                )
            ) {
                //사용자가 만든 입찰서는 사용자 전용 폴더로 따로 관리하기
                fs.mkdirSync(
                    'C:/Users/joung/Visual Studio Code Workspace/repos/react_express/' +
                        req.session.nickname
                ) //사용자 전용 폴더가 없으면 새롭게 만든다.
            }

            //아까 만든 입찰서를 사용자 전용 폴더에 옳긴다.
            fs.copyFileSync(
                'C:/Users/joung/Visual Studio Code Workspace/repos/BidHandling_CalculatePrice-1/AutoBid/EmptyBid/' +
                    bidName,
                'C:/Users/joung/Visual Studio Code Workspace/repos/react_express/' +
                    req.session.nickname +
                    '/' +
                    bidName
            )
            //작업폴더에 남아있는 입찰서는 삭제한다.
            fs.rmSync(
                'C:/Users/joung/Visual Studio Code Workspace/repos/BidHandling_CalculatePrice-1/AutoBid/EmptyBid/' +
                    bidName
            )

            return res.send(true)
        } else {
            //못찾았다면
            return res.send(false) //false를 응답함
        }
    })
})

router.post('/qualification', (req, res) => {
    //적격심사 Bid 만들기
})
