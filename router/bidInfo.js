import express, { response } from 'express'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
export const router = express.Router()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
//데이터 베이스에 저장? 혹은 json파일로 저장 후 요청시마다 전달?
const getBidData = async (url) => {
    // console.log('a')
    let res
    try {
        res = await axios.get(url)
    } catch (e) {
        console.log(e)
    }
    return res
}

const getTotalPage = async (res) => {
    // console.log('c')
    return Math.ceil(res.data.response.body.totalCount / 100)
}

const concatBidList = async (baseList, res) => {
    let targetBidList = res.data.response.body.items.filter(
        (bid) =>
            bid.sucsfbidMthdNm ===
                '추정가격 300억원미만 100억원 이상(종합심사, 간이형공사 *별표1-5)' ||
            bid.sucsfbidMthdNm === '적격심사-추정가격 300억원미만 100억원이상'
    )
    // console.log('b')

    // console.log(targetBidList.length)
    baseList = baseList.concat(targetBidList)

    return baseList
}

const sortBidList = async (bidList) => {
    const sortedList = bidList.sort(function (a, b) {
        return new Date(a.opengDt).getTime() - new Date(b.opengDt).getTime()
    })
    return sortedList
}

const reverseSortBidList = async (bidList) => {
    const reverseSortedList = bidList
        .sort(function (a, b) {
            return new Date(a.opengDt).getTime() - new Date(b.opengDt).getTime()
        })
        .reverse()
    return reverseSortedList
}

const deleteDuplication = async (bidList) => {
    let resultList = bidList.filter((bid, index) => {
        return (
            bidList.findIndex((e) => {
                // console.log(bid.bidNtceNm, e.bidNtceNm)
                return bid.bidNtceNm === e.bidNtceNm
            }) === index
        )
    })
    return resultList
}

//오늘 날짜, 30일 뒤 날짜 yyyymmdd 형식으로 반환
const getDate = () => {
    let date = new Date()
    let today = date.toISOString().substring(0, 10).replace(/-/g, '')

    let endDate = new Date(date.setDate(date.getDate() + 30))
    let endDay = endDate.toISOString().substring(0, 10).replace(/-/g, '')
    // console.log(today, endDay)
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
    // console.log(totalPage, 'total')
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
    const reverseSortedBidList = await reverseSortBidList(bidList)

    const resultBidList = await deleteDuplication(reverseSortedBidList)

    const sortedBidList = await sortBidList(resultBidList)

    //bidList JSON 파일로 저장
    let folder = path.resolve(path.resolve(), './bidList')
    fs.writeFileSync(folder + '\\' + today + '_bidList', JSON.stringify(sortedBidList))

    return sortedBidList
}

//오늘자 bidList 없을시 오류->try catch 사용하는 것으로 수정-5/22
router.get('/', (req, res) => {
    // console.log(path.resolve(path.resolve(), './bidList'))
    let { today, endDay } = getDate()
    try {
        // console.log('t')

        let bidList = fs.readFileSync(
            path.resolve(path.resolve(), './bidList') + '\\' + today + '_bidList',
            'utf-8'
            //오늘자 bidList 데이터가 있다면 바로 res
        )
        bidList = JSON.parse(bidList)
        res.send(bidList)
    } catch (e) {
        if (e.code === 'ENOENT') {
            // console.log('c')

            //오늘자 bidList 데이터가 없다면 새로 req
            getBidList(req).then((response) => {
                res.send(response)
            })
        }
    }
})

const getBasePrice = async (bidId) => {
    let url =
        'https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoCnstwkBsisAmount01?numOfRows=5&pageNo=1&ServiceKey=2IkKF%2BDSdBvTw48wVks8riCqt%2FnTI2k3QbZoaEgCk%2FR05ZfMeDI%2FJiRA8FmGy6q30rCLNKmCRYMBWiY9Xm6aXQ%3D%3D&inqryDiv=2&bidNtceNo=' +
        bidId +
        '&type=json'
    let res = await getBidData(url)
    return res
}
//오늘자 bidList 없을시 오류->try catch 사용하는 것으로 수정-5/22
router.get('/:bidId', (req, res) => {
    let { today, endDay } = getDate()

    try {
        //오늘자 bidList 데이터가 있다면 바로 res
        let bidList = fs.readFileSync(
            path.resolve(path.resolve(), './bidList') + '\\' + today + '_bidList',
            'utf-8'
        )
        bidList = JSON.parse(bidList)
        let bidInfo = bidList.filter((bid) => bid.bidNtceNo === req.params.bidId)
        getBasePrice(req.params.bidId).then((basePrice) => {
            if (basePrice.data.response.body.items === undefined) {
                // console.log()
                res.send({ bidData: bidInfo[0], basePriceData: false })
            } else {
                // console.log(basePrice.data.response.body.items)
                res.send({
                    bidData: bidInfo[0],
                    basePriceData: basePrice.data.response.body.items[0],
                })
            }
        })
    } catch (e) {
        //오늘자 bidList 데이터가 없다면 새로 req
        if (e.code === 'ENOENT') {
            getBidList(req).then((response) => {
                let bidInfo = response.filter((bid) => bid.bidNtceNo === req.params.bidId)
                getBasePrice(req.params.bidId).then((basePrice) => {
                    // console.log(basePrice, '기초 금액 데이터')
                    res.send({ bidData: bidInfo[0], basePriceData: basePrice })
                })
            })
        }
    }
})
