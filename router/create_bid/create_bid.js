import express from 'express'
// import pkg from '../../../BidHandling_CalculatePrice-1/execute.js';
// const { execute } = pkg;
// import { db } from '../../lib/db.js';
import fs from 'fs'
import path from 'path'

/**입찰서 작성과 관련된 router */
export const router = express.Router()

router.post('/revised_test', (req, res, next) => {
    //간이종심제 Bid 만들기
    let RadioDecimal = req.body.RadioDecimal_Check
    let StandardPrice = req.body.CheckStandardPrice
    let WeightValue = req.body.CheckWeightValue
    let CAD_Click = req.body.CheckCAD_Click
    let Ceiling_Click = req.body.CheckCeiling_Click
    let LaborCost_Click = req.body.CheckLaborCost_Click
    let CompanyName = req.body.CompanyRegistrationName
    let CompanyNum = req.body.CompanyRegistrationNum
    let BalancedRate = req.body.BalancedRateNum
    let PersonalRate = req.body.PersonalRateNum
    // 클라이언트로부터 받아야 할 정보들
    console.log(req.body)

    let bidName = req.body.bidName //어떤 입찰 건에 대한 BID인지 판단하기 위한 bidName (우선 사용자로부터 직접 파일 이름을 입력받음 추후 입력받지 않게 만들 예정 => 프론트의 url /:id 값을 bidID로 구분해 받으면서 )

    db.query('select bidPath from emptybid where bidID = ?', [bidName], (err, result, field) => {
        //DB로부터 bidName에 대한 서버에 저장되어 있는 공내역서의 path를 조회
        if (err) next(err)

        if (result.length > 0) {
            //찾았다면
            //공내역서를 복사해 작업 폴더로 옳김
            fs.copyFileSync(
                folder_path + '\\' + result[0].bidPath,
                revised_test_EmptyBid + '\\' + bidName + '.BID'
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

            if (!fs.existsSync(folder_path + '\\' + req.session.nickname + '\\' + bidName)) {
                //사용자가 만든 입찰서는 사용자 전용 폴더로 따로 관리하기
                fs.mkdirSync(folder_path + '\\' + req.session.nickname + '\\' + bidName) //사용자 전용 폴더가 없으면 새롭게 만든다.
            }

            // let date = new Date();  //날짜 객체

            // let makeDate = date.toISOString().replace('T', ' ').substring(0, 19);   //입찰서 작성 시간을 저장한다.(서버 설정 시간 기준)

            //console.log(makeDate)

            //아까 만든 입찰서를 사용자 전용 폴더에 옳긴다.
            fs.renameSync(
                revised_test_EmptyBid + '\\' + bidName + '.BID',
                folder_path +
                    '\\' +
                    req.session.nickname +
                    '\\' +
                    bidName +
                    '\\' +
                    CompanyName +
                    '_' +
                    bidName +
                    '_업평_' +
                    BalancedRate +
                    '_내사정율_' +
                    PersonalRate +
                    '.BID'
            )

            db.query(
                'insert into userBidFiles (userID, bidID, bidPath, balancedRate, personalRate) value (?, ?, ?, ?, ?)',
                [
                    req.session.nickname,
                    bidName,
                    bidName +
                        '\\' +
                        CompanyName +
                        '_' +
                        bidName +
                        '_업평_' +
                        BalancedRate +
                        '_내사정율_' +
                        PersonalRate +
                        '.BID',
                    BalancedRate,
                    PersonalRate,
                ],
                (err2, result, field) => {
                    if (err2) next(err2)

                    console.log(result)

                    return res.send(true)
                }
            )
        } else {
            //못찾았다면
            return res.send(false) //false를 응답함
        }
    })
})

router.post('/qualification', (req, res) => {
    //적격심사 Bid 만들기
})
