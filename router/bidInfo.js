import express, { response } from 'express'
import axios from 'axios'
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
    console.log(res.data.response.body.pageNo)
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

const getBidList = async (request) => {
    let bidList = []
    let row = '100'
    let pageNum = '1'
    let today = '20230512'
    let due = '20230701'
    let bidList_url =
        'https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoCnstwkPPSSrch01?numOfRows=' +
        row +
        '&pageNo=' +
        pageNum +
        '&ServiceKey=2IkKF%2BDSdBvTw48wVks8riCqt%2FnTI2k3QbZoaEgCk%2FR05ZfMeDI%2FJiRA8FmGy6q30rCLNKmCRYMBWiY9Xm6aXQ%3D%3D&inqryDiv=2&inqryBgnDt=20230516&inqryEndDt=20230716&presmptPrceBgn=10000000000&presmptPrceEnd=30000000000&type=json'
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
            '&ServiceKey=2IkKF%2BDSdBvTw48wVks8riCqt%2FnTI2k3QbZoaEgCk%2FR05ZfMeDI%2FJiRA8FmGy6q30rCLNKmCRYMBWiY9Xm6aXQ%3D%3D&inqryDiv=2&inqryBgnDt=20230516&inqryEndDt=20230716&presmptPrceBgn=10000000000&presmptPrceEnd=30000000000&type=json'

        let res2 = await getBidData(bidList_url)

        bidList = await concatBidList(bidList, res2)
    }
    const sortedBidList = await sortBidList(bidList)

    return sortedBidList
}

router.get('/', (req, res) => {
    getBidList(req).then((response) => {
        // console.log(response)
        res.send(response)
    })
})

router.get('/:bidId', (req, res) => {
    getBidList(req).then((response) => {
        let bidInfo = res.data.response.body.items.filter(
            (bid) => bid.bidNtceNo === req.params.bidId
        )
        res.send(response)
    })
})