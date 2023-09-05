const express = require('express');

// load environment file and set environment variables (CommonJS style)
require('dotenv').config();

const pkg_revised = require(process.env.REVISED_TEST_PATH + 'execute.js');
const { execute: execute_revised } = pkg_revised;
const pkg_eligible = require(process.env.ELIGIBLE_AUDIT_PATH + 'excute.js');
const { execute: execute_eligible } = pkg_eligible;
const db = require(process.env.DB_PATH);
const fs = require('fs');
const path = require('path');

const folder_path = path.resolve('') // current working directory path
const revised_test_EmptyBid = path.resolve('../', process.env.REVISED_TEST_EMPTYBID_PATH) //간이종심제 입찰서 작성 EmptyBid 폴더 위치
const eligible_audit_EmptyBid = path.resolve('../', process.env.ELIGIBLE_AUDIT_EMPTYBID_PATH) //적격심사 입찰서 작성 EmptyBid 폴더 위치

/**입찰서 작성과 관련된 router */
const router = express.Router()

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
    let BalancedRate = Number(req.body.BalancedRateNum)
    let PersonalRate = Number(req.body.PersonalRateNum)
    // 클라이언트로부터 받아야 할 정보들

    let bidName = req.body.bidName //어떤 입찰 건에 대한 BID인지 판단하기 위한 bidName (우선 사용자로부터 직접 파일 이름을 입력받음 추후 입력받지 않게 만들 예정 => 프론트의 url /:id 값을 bidID로 구분해 받으면서 )

    db.query('select bidPath from emptybid where bidID = ?', [bidName], (err, result, field) => {
        //DB로부터 bidName에 대한 서버에 저장되어 있는 공내역서의 path를 조회
        if (err) next(err)
        if (result.length > 0) {
            //찾았다면
            //공내역서를 복사해 작업 폴더로 옳김
            fs.copyFileSync(folder_path + '\\' + result[0].bidPath, revised_test_EmptyBid + '\\' + bidName + '.BID')

            console.log('-----------------------------------')

            try {
                //사용자가 입력한 대로 입찰서 작성
                execute_revised(
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
            } catch (err) {
                return res.send({
                    isSuccess: false,
                    value: '간이종심제 입찰서 모듈 오류',
                    error: err,
                }) //입찰서 작성 도중 문제 발생
            }

            if (!fs.existsSync(folder_path + '\\' + req.session.nickname)) {
                //사용자가 만든 입찰서는 사용자 전용 폴더로 따로 관리하기
                fs.mkdirSync(folder_path + '\\' + req.session.nickname) //사용자 전용 폴더가 없으면 새롭게 만든다.
            }
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
                'insert into userBidFiles_revised_test (userID, bidID, bidPath, balancedRate, personalRate) value (?, ?, ?, ?, ?)',
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
                    if (err2) return next(err2)

                    return res.send({ isSuccess: true })
                }
            ) //사용자가 만든 입찰서의 위치를 DB에 저장한다.
        } else {
            //못찾았다면
            return res.send({ isSuccess: false, value: 'DB에 공내역서가 없음' }) //false를 응답함
        }
    })
})

router.post('/eligible_audit', (req, res, next) => {
    //적격심사 Bid 만들기
    let laborRate = Number(req.body.laborRate)
    let expenseRate = Number(req.body.expenseRate)
    let genMngRate = Number(req.body.genMngRate)
    let profitRate = Number(req.body.profitRate)
    let difficultyRate = Number(req.body.difficultyRate)
    let CompanyName = req.body.CompanyRegistrationName
    let CompanyNum = req.body.CompanyRegistrationNum
    let basePrice = Number(req.body.basePrice)
    let estimateRating = Number(req.body.estimateRating)
    // 클라이언트로부터 받아야 할 정보들

    let bidName = req.body.bidName //어떤 입찰 건에 대한 BID인지 판단하기 위한 bidName (우선 사용자로부터 직접 파일 이름을 입력받음 추후 입력받지 않게 만들 예정 => 프론트의 url /:id 값을 bidID로 구분해 받으면서 )
    let resultPrice = undefined //도급비계
    db.query('select bidPath from emptybid where bidID = ?', [bidName], (err, result, field) => {
        //DB로부터 bidName에 대한 서버에 저장되어 있는 공내역서의 path를 조회
        if (err) return next(err)

        if (result.length > 0) {
            //찾았다면
            //공내역서를 복사해 작업 폴더로 옳김
            fs.copyFileSync(
                folder_path + '\\' + result[0].bidPath,
                eligible_audit_EmptyBid + '\\' + bidName + '.BID'
            )

            try {
                //사용자가 입력한 대로 입찰서 작성
                resultPrice = execute_eligible(
                    laborRate,
                    expenseRate,
                    genMngRate,
                    profitRate,
                    difficultyRate,
                    CompanyName,
                    CompanyNum,
                    basePrice,
                    estimateRating
                )
            } catch (err) {
                return res.send({
                    isSuccess: false,
                    value: '적격 심사 입찰서 모듈 오류',
                    error: err,
                })
            }

            if (!fs.existsSync(folder_path + '\\' + req.session.nickname)) {
                //사용자가 만든 입찰서는 사용자 전용 폴더로 따로 관리하기
                fs.mkdirSync(folder_path + '\\' + req.session.nickname) //사용자 전용 폴더가 없으면 새롭게 만든다.
            }
            if (!fs.existsSync(folder_path + '\\' + req.session.nickname + '\\' + bidName)) {
                //사용자가 만든 입찰서는 사용자 전용 폴더로 따로 관리하기
                fs.mkdirSync(folder_path + '\\' + req.session.nickname + '\\' + bidName) //사용자 전용 폴더가 없으면 새롭게 만든다.
            }

            // let date = new Date();  //날짜 객체

            // let makeDate = date.toISOString().replace('T', ' ').substring(0, 19);   //입찰서 작성 시간을 저장한다.(서버 설정 시간 기준)

            //console.log(makeDate)

            //아까 만든 입찰서를 사용자 전용 폴더에 옳긴다.
            fs.renameSync(
                eligible_audit_EmptyBid + '\\' + bidName + '.BID',
                folder_path +
                '\\' +
                req.session.nickname +
                '\\' +
                bidName +
                '\\' +
                CompanyName +
                '_' +
                bidName +
                '_예가사정율_' +
                estimateRating +
                '.BID'
            )

            db.query(
                'insert into userBidFiles_eligible_audit (userID, bidID, bidPath, basePrice, estimateRating) value (?, ?, ?, ?, ?)',
                [
                    req.session.nickname,
                    bidName,
                    bidName +
                    '\\' +
                    CompanyName +
                    '_' +
                    bidName +
                    '_예가사정율_' +
                    estimateRating +
                    '.BID',
                    basePrice,
                    estimateRating,
                ],
                (err2, result, field) => {
                    if (err2) {
                        next(err2)
                        return
                    }
                    return res.send({ isSuccess: true, value: resultPrice })
                }
            ) //사용자가 만든 입찰서의 위치를 DB에 저장한다.
        } else {
            //못찾았다면
            return res.send({ isSuccess: false, value: 'DB에 공내역서가 없음' }) //false를 응답함
        }
    })
})

module.exports = { router: router };