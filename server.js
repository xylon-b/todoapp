const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const { Collection } = require('mongodb');
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
app.use(methodOverride('_method'))



app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

app.use('/img', express.static('img'));

var db;

MongoClient.connect('mongodb+srv://xylon:qowlghd98@cluster0.damld.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(error, client){
    db = client.db('todoapp');

    app.listen(8080, function(){
        console.log('listening on 8080');
    });
    
})


//write페이지에서 디비로 전송을 하게 되면 어떤 메세지를 썼는지 알려준다.
app.post('/add', function(요청, 응답){
    //응답.send('전송이 완료되었습니다.');
    응답.redirect('/list');
    
    db.collection('counter').findOne({name : "총게시물갯수"}, function(에러, 결과){
      var 게시물갯수 = 결과.totalPost;

      //counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜야 한다.
      db.collection('counter').updateOne({name : "총게시물갯수"}, { $inc : { totalPost : 1 }}, function(err, rst){
        if(err){return console.log("전송에 실패하였습니다..")}
        console.log('totalPost가 1 증가하였습니다.');
    });
    
      db.collection('post').insertOne( { _id : (게시물갯수 + 1), 제목 : 요청.body.title, 날짜 : 요청.body.date } , function(){
        console.log('저장완료');
      });
    });
  });

app.get('/write', function(req, res){
  res.render('write.ejs');
});

app.get('/', function(req, res){
  res.render('index.ejs');
})

app.get('/edit/:id', function(req, res){
  db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, rst){
    res.render('edit.ejs', {post : rst}); //찾은 결과를 edit.ejs로 보내라
  })
})

app.get('/list', function(req, res){
    db.collection('post').find().toArray(function(err, rst){
        console.log(rst);
        res.render('list.ejs', {posts : rst});
    });
});

app.delete('/delete', function(요청, 응답){
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id)
  db.collection('post').deleteOne(요청.body, function(에러, 결과){
    console.log('삭제완료')
    응답.status(200).send({message : '성공했습니다.'});
  })
});
//이거 왜안되냐 짜증나게 요청은 다해둠 A) 변수 선언안했잖아 멍청아


// /detail로 접속하면 detail.ejs로 보내준다
app.get('/detail/:id', function(요청, 응답){
  db.collection('post').findOne({_id : parseInt(요청.params.id) }, function(에러, 결과){
    console.log(결과);
    응답.render('detail.ejs', { data : 결과 });
  })
  
})

app.put('/edit', function(req, res){
  db.collection('post').updateOne( {_id : parseInt(req.body.id) }, {$set : { 제목 : req.body.title, 날짜 : req.body.date }}, function(err, rst){
    console.log('수정완료')
    res.redirect('/list')
  });
});


//npm으로 설치한 3개의 라이브러리를 선언한다.
//session 방식의 회원인증
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session  =  require('express-session');

//app.use (미들웨어)
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', function(req, res){
  res.render('login.ejs');
})

app.post('/login', passport.authenticate('local',{
    failureRedirect : '/fail'
}), function(req, res){
  res.redirect('/');
})

app.get('/fail', function(req, res){
  res.send('로그인에 실패하였습니다.');
})

//local strategy = 인증하는 방법... 어떻게 인증시킬건지
passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true, //세팅하는 부분  // 로그인 후 세션을 저장할 것인지
  passReqToCallback: false, //true로 바꾸면 function에 req파라이터 추가 가능.. 아이디 비번말고도 다른거 검증할때
}, function (입력한아이디, 입력한비번, done) {
  //console.log(입력한아이디, 입력한비번);
  db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
    if (에러) return done(에러)

    if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
    if (입력한비번 == 결과.pw) {
      return done(null, 결과)
    } else {
      return done(null, false, { message: '비번틀렸어요' })
    }
  })
}));

passport.serializeUser(function(user, done){
  done(null, user.id)
});

passport.deserializeUser(function(아이디, done){
  done(null, {})
});