import express, { response } from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
export const router = express.Router()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
//데이터 베이스에 저장? 혹은 json파일로 저장 후 요청시마다 전달?
const getBidData = async (url) => {
    console.log(url)

    let res
    try {
        res = await axios.get(url)
    } catch (e) {
        console.log(e)
    }
    return res
}

const getTotalPage = async (res) => {
    console.log(res.data.response.body.totalCount, 'totalN')

    return Math.ceil(res.data.response.body.totalCount / 100)
}

const concatBidList = async (baseList, res) => {
    let targetBidList = res.data.response.body.items.filter(
        (bid) =>
            bid.sucsfbidMthdNm ===
            '추정가격 300억원미만 100억원 이상(종합심사, 간이형공사 *별표1-5)' ||
            bid.sucsfbidMthdNm === '적격심사-추정가격 300억원미만 100억원이상'
    )
    console.log(targetBidList.length)
    baseList = baseList.concat(targetBidList)

    return baseList
}

const sortBidList = async (bidList) => {
    const sorted_list = bidList.sort(function (a, b) {
        return new Date(a.opengDt).getTime() - new Date(b.opengDt).getTime()
    })
    return sorted_list
}

//오늘 날짜, 30일 뒤 날짜 yyyymmdd 형식으로 반환
const getDate = () => {
    let date = new Date()
    let today = date.toISOString().substring(0, 10).replace(/-/g, '')

    let endDate = new Date(date.setDate(date.getDate() + 30))
    let endDay = endDate.toISOString().substring(0, 10).replace(/-/g, '')
    console.log(today, endDay)
    return { today, endDay }
}

const getBidList = async (request) => {
    let bidList = []
    let row = '100'
    let pageNum = '1'
    let { today, endDay } = getDate()
    let bidList_url =
        'https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoCnstwkPPSSrch01?numOfRows=' +
        row +
        '&pageNo=' +
        pageNum +
        '&ServiceKey=2IkKF%2BDSdBvTw48wVks8riCqt%2FnTI2k3QbZoaEgCk%2FR05ZfMeDI%2FJiRA8FmGy6q30rCLNKmCRYMBWiY9Xm6aXQ%3D%3D&inqryDiv=2&inqryBgnDt=' +
        today +
        '&inqryEndDt=' +
        endDay +
        '&presmptPrceBgn=10000000000&presmptPrceEnd=30000000000&type=json'
    let res = await getBidData(bidList_url)
    bidList = await concatBidList(bidList, res)
    let totalPage = await getTotalPage(res)
    row = '100'
    console.log(totalPage, 'total')
    for (let i = 2; i <= totalPage; i++) {
        pageNum = i
        let bidList_url =
            'https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoCnstwkPPSSrch01?numOfRows=' +
            row +
            '&pageNo=' +
            pageNum +
            '&ServiceKey=2IkKF%2BDSdBvTw48wVks8riCqt%2FnTI2k3QbZoaEgCk%2FR05ZfMeDI%2FJiRA8FmGy6q30rCLNKmCRYMBWiY9Xm6aXQ%3D%3D&inqryDiv=2&inqryBgnDt=' +
            today +
            '&inqryEndDt=' +
            endDay +
            '&presmptPrceBgn=10000000000&presmptPrceEnd=30000000000&type=json'

        let res2 = await getBidData(bidList_url)

        bidList = await concatBidList(bidList, res2)
    }
    const sortedBidList = await sortBidList(bidList)

    //bidList JSON 파일로 저장
    let folder = path.resolve(path.resolve(), './bidList')
    fs.writeFileSync(folder + '\\' + today + '_bidList', JSON.stringify(sortedBidList))

    return sortedBidList
}

router.get('/', (req, res) => {
    console.log(path.resolve(path.resolve(), './bidList'))
    let { today, endDay } = getDate()

    try {
        let bidList = fs.readFileSync(
            path.resolve(path.resolve(), './bidList') + '\\' + today + '_bidList'
        );

        return res.send(bidList)
    }
    catch (err) {
        getBidList(req).then((response) => {
            return res.send(response)
        })
    }
    // if (bidList == undefined) {
    //     //오늘자 bidList 데이터가 없다면 새로 req
    //     getBidList(req).then((response) => {
    //         return res.send(response)
    //     })
    // } else {
    //오늘자 bidList 데이터가 있다면 바로 res
    // return res.send(bidList)
    // }
})

router.get('/:bidId', (req, res) => {
    getBidList(req).then((response) => {
        let bidInfo = response.filter(
            (bid) => bid.bidNtceNo === req.params.bidId
        )
        res.send(bidInfo)
    })
})
