var router = require('express').Router();

function 로그인했니(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('로그인정보가 없습니다.')
    }
}

router.use(로그인했니); //여기 있는 모든 url에 적용할 미들웨어

//router.use('/shirts', 로그인했니); // shirts 경로로 접속한 곳에만 함수 적용

router.get('/shirts', 로그인했니, function (req, res) {
    res.send('셔츠파는 페이지 입니다.');
});

router.get('/pants', function (req, res) {
    res.send('바지파는 페이지 입니다.');
});


module.exports = router;