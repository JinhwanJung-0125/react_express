# CMC Project Express.js API server

입찰서 자동 작성 웹 서비스 프로젝트의 백엔드 서버 파트입니다. <br>
프로젝트 기간: 2023/03 - 2023/06 <br>

## 사용 기술 스텍
![Static Badge](https://img.shields.io/badge/-Javascript-yellow) ![Static Badge](https://img.shields.io/badge/Node.js-v18.15.0-green) ![Static Badge](https://img.shields.io/badge/Express.js-v4.18.2-white) ![Static Badge](https://img.shields.io/badge/MySQL-v8.0.32-blue)
<br> 

## 개발 환경 세팅
    npm install

## 실행 방법
일반 서버 실행 (환경 변수 미적용)

    npm run start_server
배포 환경 서버 실행

    npm run start_server_prd
개발 환경 서버 실행

    npm run start_server_dev

## 디렉토리 구조
````bash
├─bidList                (한달 분의 입찰 공고 내역 파일)
|
├─front                  (프론트엔드 파일 (React.js))
│  └─build
│      └─static
│          ├─css
│          ├─js
│          └─media
├─lib                    (데이터베이스 세팅 (Test DB))
|  └─db.js
|
├─router
│  ├─created_bid_list    (해당 입찰 건의 사용자가 작성한 입찰서 리스트)
│  ├─create_bid          (간이종심제, 적격심사 입찰서 작성)
│  ├─data                (사용자 작성 입찰서 다운로드)
│  ├─login               (로그인, 로그아웃, 회원가입, 로그인 여부 확인)
│  ├─post                (공내역 업로드, 업로드된 공내역 공고 리스트)
|  └─bidInfo.js          (조달청 API를 통해 입찰 정보 출력)
|
├─Server Stress Test     (서버 테스트용 시나리오 스크립트)
├─testId                 (테스트 ID의 작성 입찰서 파일)
└─Uploads                (입찰용 공내역서 파일)
````

## 실행 화면
![123](https://github.com/JinhwanJung-0125/react_express/assets/102853456/3306ff85-a3c9-4233-89a0-f3b369bd8848)
![789](https://github.com/JinhwanJung-0125/react_express/assets/102853456/40fdabb4-998f-451e-ab42-b4f26b2e4a55)
![456](https://github.com/JinhwanJung-0125/react_express/assets/102853456/0bf2f39e-5744-46c8-adf7-cf84cd4dfcd8)


## 서버 구성 및 세부 설명 링크
Notion URL: https://www.notion.so/jinhwanjung-0125/2b080accb999494db09ec56c576addb6

<br>

