import express, { response } from 'express'
import axios from 'axios'
import { db } from '../lib/db.js'
import fs from 'fs'
import path from 'path'
import iconv from 'iconv-lite';
export const router = express.Router()
const __dirname = path.resolve();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'

//데이터 베이스에 저장? 혹은 json파일로 저장 후 요청시마다 전달?
const getBidData = async (url) => {
    let res
    try {
        res = await axios.get(url)
    } catch (e) {
        console.log(e)
    }
    return res
}

const getTotalPage = async (res) => {
    return Math.ceil(res.data.response.body.totalCount / 100)
}

const concatBidList = async (baseList, res) => {
    let targetBidList = res.data.response.body.items.filter(
        (bid) =>
            bid.sucsfbidMthdNm ===
                '추정가격 300억원미만 100억원 이상(종합심사, 간이형공사 *별표1-5)' ||
            bid.sucsfbidMthdNm === '적격심사-추정가격 300억원미만 100억원이상'
    )
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
        let bidList = fs.readFileSync(
            path.resolve(path.resolve(), './bidList') + '\\' + today + '_bidList',
            'utf-8'
            //오늘자 bidList 데이터가 있다면 바로 res
        )
        bidList = JSON.parse(bidList)
        res.send(bidList)
    } catch (e) {
        if (e.code === 'ENOENT') {
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

const getBidFile = async (bidInfo) => {     //특정 공종의 정보가 담겨있는 bidInfo에서 공 내역서가 있다면 공 내역서 파일을 뽑아내는 메소드 (23.07.08 추가)
    let ntceSpecDocUrl = 'ntceSpecDocUrl';  //공종 정보 중 파일 다운로드 링크
    let ntceSpecFileNm = 'ntceSpecFileNm';  //공종 정보 중 파일 이름
    let isFindBid = false;                  //공종 정보에 공 내역서가 있는지 확인
    let DocUrl = '';                        //공 내역서 다운로드 링크
    let FileName = '';                      //공 내역서 파일 이름

    for(let i = 1; i < 11; i++){            //공 내역서 다운로드 링크가 있는지 확인한다.
        DocUrl = bidInfo[ntceSpecDocUrl + String(i)];
        FileName = bidInfo[ntceSpecFileNm + String(i)];

        let numOfFileType = DocUrl.slice(DocUrl.length - 4, DocUrl.length - 3);
        if(numOfFileType === '4')   isFindBid = true;

        if(isFindBid)   break;
    }

    if(isFindBid){      //공 내역서 다운로드 링크를 찾았다면
        db.query("select * from emptybid where bidID = ?", [FileName.slice(0, FileName.length - 4)], async (err, result, field) => {        //공 내역서 파일이 이미 있는지 조회한다.
            if (err) return err;

            else if (result.length <= 0) {      //없다면
                try{
                    let res = await axios.request({     //다운로드 링크로 Request를 보낸다.
                        method: 'GET',
                        url: DocUrl,
                        responseType: 'arraybuffer',
                        responseEncoding: 'binary'
                    });
        
                    fs.writeFileSync(path.resolve(__dirname, './Uploads/' + FileName), res.data);       //받은 파일을 Uploads 폴더에 저장한다.

                    db.query("insert into emptybid values (?, ?, ?, ?)", [bidInfo['bidNtceNm'], FileName.slice(0, FileName.length - 4), 'Uploads/' + FileName, res.data.length], (err1, result, field) => {     //DB에 공 내역서 파일 정보를 업데이트한다.
                        if (err1) return err1;
                        else {
                            console.log("공내역서 다운로드 완료");
                        }
                    });
                }
                catch(e){       //다운로드, File Handling, DB Query 작업 중 문제 발생시 catch
                    console.log(e);
                }
            }

            else {      //이미 DB에 공 내역서가 등록된 경우
                console.log("이미 등록된 공내역서입니다.");
            }
        })
    }
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

        getBidFile(bidInfo[0]);     //공 내역서 파일이 있다면 업로드한다.

        getBasePrice(req.params.bidId).then((basePrice) => {
            if (basePrice.data.response.body.items === undefined) {
                console.log('기초금액 데이터 없음')
                res.send({ bidData: bidInfo[0], basePriceData: false })
            } else {
                console.log('기초금액 데이터 있음')

                console.log(basePrice.data.response.body.items[0]);

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
                    res.send({ bidData: bidInfo[0], basePriceData: basePrice })
                })
            })
        }
    }
})
