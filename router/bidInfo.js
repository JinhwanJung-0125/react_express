import express, { response } from 'express'
import axios from 'axios'
export const router = express.Router()

const getBidData = async (url) => {
    let res
    try {
        res = await axios.get(url)
    } catch (e) {
        console.log(e)
    }
    return res
}
const getBidList = async (request) => {
    let bidList = []
    let row = '1'
    let pageNum = '1'
    let today = '20230512'
    let due = '20230701'
    let bidList_url =
        'https://apis.data.go.kr/1230000/BidPublicInfoService04/getBidPblancListInfoCnstwkPPSSrch01?numOfRows=' +
        row +
        '&pageNo=' +
        pageNum +
        '&ServiceKey=2IkKF%2BDSdBvTw48wVks8riCqt%2FnTI2k3QbZoaEgCk%2FR05ZfMeDI%2FJiRA8FmGy6q30rCLNKmCRYMBWiY9Xm6aXQ%3D%3D&inqryDiv=2&inqryBgnDt=20220512&inqryEndDt=20220701&ntceInsttNm=%EC%A1%B0%EB%8B%AC%EC%B2%AD&type=json'
    // let res
    // try {
    //     // console.log(bidList_url)
    //     res = await axios.get(bidList_url)
    // } catch (e) {
    //     console.log(e)
    // }
    let res = await getBidData(bidList_url)
    let totalPage = await Math.round(res.data.response.body.totalCount / 100)
    row = 100
    for (let i = 1; i <= totalPage; i++) {
        pageNum = i
        // try {
        //     res = await axios.get(bidList_url)
        // } catch (e) {
        //     console.log(e)
        // }
        res = await getBidData(bidList_url)
        console.log(typeof res.data.body)

        console.log(typeof res.data.body.items)
        console.log(typeof res.data.body)

        bidList = bidList.concat(res.data.body.items)
        // var works = Setting.eleBID['T3'].map(function (work) {
        //     return new Data()
        // })
        console.log(res.data.response.body.totalCount, pageNum)
    }

    return res
}
router.get('/', (req, res) => {
    getBidList(req).then((response) => {
        console.log(response === undefined)
        // res.send(response.addTrailers.response.body)
    })
})
