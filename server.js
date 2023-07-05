const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const { Collection } = require('mongodb');
app.use(express.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
const { ObjectId } = require('mongodb');
app.use(methodOverride('_method'))
require('dotenv').config()

app.use(express.json());




app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

app.use('/img', express.static('img'));

// var db;

// MongoClient.connect('mongodb+srv://xylon:qowlghd98@cluster0.damld.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(error, client){
//     db = client.db('todoapp');

//     app.listen(8080, function(){
//         console.log('listening on 8080');
//     });
// })


//환경변수 .env 사용코드
var db;

MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) return console.log(err)
  db = client.db('todoapp');
  app.listen(process.env.PORT, function () {
    console.log('listening on ' + process.env.PORT)
  })
})




app.get('/write', function (req, res) {
  res.render('write.ejs');
});

app.get('/', function (req, res) {
  res.render('index.ejs');
})


app.get('/list', function (req, res) {
  db.collection('post').find().toArray(function (err, rst) {
    console.log(rst);
    res.render('list.ejs', { posts: rst });
  });
});



// /detail로 접속하면 detail.ejs로 보내준다
app.get('/detail/:id', function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    console.log(결과);
    응답.render('detail.ejs', { data: 결과 });
  })

})

app.put('/edit', function (req, res) {
  db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { 제목: req.body.title, 날짜: req.body.date } }, function (err, rst) {
    console.log('수정완료')
    res.redirect('/list')
  });
});


//npm으로 설치한 3개의 라이브러리를 선언한다.
//session 방식의 회원인증
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

//app.use (미들웨어)
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', function (req, res) {
  res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/fail'
}), function (req, res) {
  res.redirect('/');
})

app.get('/fail', function (req, res) {
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

passport.serializeUser(function (user, done) {
  done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
  db.collection('login').findOne({ id: 아이디 }, function (err, rst) {
    done(null, rst);
  })
});


app.post('/register', function (req, res) {
  db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw }, function (err, rst) {
    res.redirect('/')
  })
})

//write페이지에서 디비로 전송을 하게 되면 어떤 메세지를 썼는지 알려준다.
app.post('/add', function (요청, 응답) {

  //응답.send('전송이 완료되었습니다.');
  응답.redirect('/list');

  db.collection('counter').findOne({ name: "총게시물갯수" }, function (에러, 결과) {
    var 게시물갯수 = 결과.totalPost;

    var post = { _id: 게시물갯수 + 1, 작성자: 요청.user._id, 제목: 요청.body.title, 날짜: 요청.body.date }

    db.collection('post').insertOne(post, function (err, rst) {
      console.log('저장완료');
      //counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜야 한다.
      db.collection('counter').updateOne({ name: "총게시물갯수" }, { $inc: { totalPost: 1 } }, function (err, rst) {
        if (err) { return console.log("전송에 실패하였습니다..") }
      });
    });
  });
});

app.get('/mypage', 로그인했니, function (req, res) {
  console.log(req.user);
  res.render('mypage.ejs', { 사용자: req.user })
})

function 로그인했니(req, res, next) {
  if (req.user) {
    next()
  } else {
    res.send('로그인정보가 없습니다.')
  }
}



app.delete('/delete', function (요청, 응답) {
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);
  var delData = { _id: 요청.body._id, 작성자: 요청.user._id }


  db.collection('post').deleteOne(delData, function (에러, 결과) {
    console.log('삭제완료')
    if (결과) { console.log(결과) }
    응답.status(200).send({ message: '성공했습니다.' });
  })
});
//이거 왜안되냐 짜증나게 요청은 다해둠 A) 변수 선언안했잖아 멍청아

app.get('/edit/:id', 로그인했니, function (req, res) {

  var parseIdParams = { _id: parseInt(req.params.id) }
  var editData = { parseIdParams, 작성자: req.user._id }

  db.collection('post').findOne(parseIdParams, { 작성자: req.user._id }, function (err, rst) {
    if (rst) { console.log(rst) }
    res.render('edit.ejs', { post: rst }); //찾은 결과를 edit.ejs로 보내라

  })
})

// app.get('/edit/:id', function (req, res) {
//   db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (err, rst) {
//     res.render('edit.ejs', { post: rst }); //찾은 결과를 edit.ejs로 보내라
//   })
// })


app.get('/search', (req, res) => {
  console.log(req.query.value)
  var 검색조건 = [
    {
      $search: {
        index: 'titleSearch',
        text: {
          query: req.query.value,
          path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        }
      }
    },
    { $sort: { _id: 1 } }, // 아이디 순서로 정렬 -1은 역순으로정렬
    { $limit: 10 },
    { $project: { 제목: 1, _id: 1, 날짜: 1, score: { $meta: "searchScore" } } }
  ]
  db.collection('post').aggregate(검색조건).toArray((err, rst) => {
    console.log(rst);
    res.render('search.ejs', { posts: rst });
  })
})

app.use('/shop', require('./routes/shop.js'))

app.use('/board/sub', require('./routes/board.js'))



//multer을 이용한 이미지 하드에 저장하기
let multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/image')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) //파일 이름 정하기
  },
  filefilter: function (req, res, cb) { //원하는 확장자 파일만 업로드하기
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return callback(new Error('PNG, JPG만 업로드하세요'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024
  }
});

var upload = multer({ storage: storage });

app.get('/upload', function (req, res) {
  res.render('upload.ejs')
});

app.post('/upload', upload.array('profile', 10), function (req, res) {
  res.send('업로드 완료');
})           //npm install multer

app.get('/image/:imageName', function (req, res) {
  res.sendFile(__dirname + '/public/image/' + req.params.imageName)
})

app.get('/imageShow', function (req, res) {
  res.render('imageShow.ejs');
})


app.post('/chatRoom', 로그인했니, function (req, res) {

  var saveInfo = {
    title: '채팅방01',
    member: [ObjectId(req.body.당한사람id), req.user._id],   //채팅건사람, 채팅당한사람
    date: new Date()
  }

  db.collection('chatroom').insertOne(saveInfo).then((rst) => {
    res.send('채팅 저장완료')
  })
})

app.get('/chat', 로그인했니, function (req, res) {

  db.collection('chatroom').find({ member: req.user._id }).toArray().then((rst) => {
    res.render('chat.ejs', { data: rst });
  })
})

app.post('/message', 로그인했니, function (req, res) {

  var 저장할거 = {
    parent: req.body.parent,
    chatTitle: req.body.chatTitle,
    content: req.body.content,
    userid: req.user._id,
    date: new Date(),
  }

  db.collection('message').insertOne(저장할거).then(() => {
    console.log('디비저장 성공');
    res.send('디비저장 성공');
  })//.catch(()=>{
  //   디비 전송에 실패했을때 코드
  // })
});


//app.get('/message/:parentid', 로그인했니, function (req, res) {
  app.get('/message/:id', 로그인했니, function (req, res) {

  res.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection('message').find({ parent : req.params.id }).toArray().then((rst)=>{
    res.write('event: test\n');
    res.write('data:' + JSON.stringify(rst) + '\n\n'); //서버에서 실시간전송할때 문자자료만 전송가능
  })

  //changeStream 설정법

  const pipeline = [ //컬렉션 안의 document만 감시하고 싶다면 이 안에 쿼리문 작성하기
    { $match: { 'fullDocument.parent' : req.params.id } } //fullDocument 꼭 붙여야 한단다
  ];
  const collection = db.collection('message');
  const changeStream = collection.watch(pipeline);
  changeStream.on('change', (result) => {
    //result.fullDocumnet
    //console.log(result.fullDocumnet);
    res.write('event: test\n');
    res.write('data:' + JSON.stringify([result.fullDocumnet]) + '\n\n');
  });
});

