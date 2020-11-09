const express = require("express");
const bodyParser = require("body-parser");
const VkBot = require("node-vk-bot-api");
const app = express();
const needle = require('needle');
const cheerio = require("cheerio");
const mongoose = require('mongoose');

//require('dotenv').config()
const token =
  "8be28a50391b6767ceb08d70b41689f19062fc90cf8d4a29aa01a54f56d66e5f9d432616d52e330db37de";

const bot = new VkBot({
  token: token,
  group_id: "190347441",
  execute_timeout: 50, // in ms   (50 by default)
  polling_timeout: 25, // in secs (25 by default)
  confirmation: "7c9b6e99"
});


mongoose.connect('mongodb+srv://Praecantat1O:7595187412@bru.q94zm.mongodb.net/base', {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
})

mongoose.Promise = global.Promise;

let DB = mongoose.connection;
DB.on('error', console.error.bind(console, 'MongoDB connection error:'));


let Schema = mongoose.Schema;

let User = new Schema({
  name: String,
  VkId: String,
  Number: String,
  MissesCount: {
    type: Number,
    default: 0,
    min: [0, 'Нельзя!']
  }
});
let SomeUser = mongoose.model('SomeUser', User)


const timeTable = [
  "1. 8:30 - 10:05",
  "2. 10:25 - 12:00",
  "3. 12:30 - 14:05",
  "4. 14:20 - 15:55",
  "5. 16:05 - 17:40"
];


// ОБЪЯВЛЕННЫЕ ПЕРЕМЕННЫЕ ---------------------
const help = [
  "Доступные команды бота (можно без пробела или с пробелом после '!') : \n",
  "!зачетка {номер зачетки} -- запись зачетки в базу данных. Строго после пробела. Пожалуйста, не ошибайтесь, иначе могут возникнуть проблемы. (первое, что нужно сделать!) \n",
  "!рейтинг -- показывает ваш рейтинг и прочую информацию\n",
  "!звонки -- показывает расписание звонков\n",
  "!пропуск физры -- +1 к счетчику пропущенных пар физры (посмотреть можно в !рейтинг)\n",
  "!отработка физры -- -1 к счетчику пропущенных пар физры",
  "\nПо всем вопросам, исправлениям ошибок, предложениям -- https://vk.com/praecantat1o"
];


class SubjectInfo {

  constructor(name, point1, point2) {
    this.name = name;

    if (point1 != '') {
      this.point1 = point1;
    } else {
      this.point1 = '**';
    }

    if (point2 != '') {
      this.point2 = point2;
    } else {
      this.point2 = '**';
    }

  }
}
// ФУНКЦИИ ----------------------------
// ПОКАЗАТЬ ПОМОЩЬ



// ПОМОЩЬ ----------------------------
bot.command(/(!help|! help)/, function (ctx) {
  let replyMsg = ''
  help.forEach(element => {
    replyMsg += element + '\n';
  });

  ctx.reply(replyMsg);
});

// РАСПИСАНИЕ ЗВОНКОВ
bot.command(/(!звонки|! звонки)/, function (ctx) {
  let replyMsg = '';
  for (let i = 0; i < timeTable.length; i++) {
    replyMsg += timeTable[i] + "\n"
  }
  ctx.reply(replyMsg);
});


// РЕЙТИНГ
bot.command(/(!рейтинг|! рейтинг)/, function (ctx) {
  console.log("ID:", ctx.message.from_id, ' ', ctx.message.text);
  let ID = ctx.message.from_id;

  let GetInfoAboutUser = new Promise((resolve, reject) => {
    SomeUser.findOne().where('VkId').equals(ID).select('Number MissesCount').exec(function (err, resp) {
      if (resp != null) {
        resolve([resp.Number, resp.MissesCount]);
      } else {
        reject('Error!')
      }

    });
  }, 300);

  GetInfoAboutUser.then((value) => {

    let url = `http://vuz2.bru.by/rate/${value[0]}/`
    let GetData = new Promise((resolve, reject) => {
      needle.get(url, function (err, res) {
        if (err) {
          reject('Error!');
        } else {
          // парсим DOM
          let $ = cheerio.load(res.body);
          const dataSubject = [];
          const dataFirstModule = [];
          const dataSecondModule = [];

          let A = [];

          $('.data h1:nth-child(1)').each((i, elem) => {
            A.push($(elem).text());
          });

          $('.box h2:contains("Пропусков")').each((i, elem) => {
            A.push($(elem).text());
          });

          $('#user tr:nth-child(1) th').each((i, elem) => {
            dataSubject.push($(elem).text());
          });

          $('#user tr:contains("1-ый модуль") td').each((i, elem) => {
            dataFirstModule.push($(elem).text());
          });

          $('#user tr:contains("2-ой модуль") td').each((i, elem) => {
            dataSecondModule.push($(elem).text());
          });



          for (let i = 1; i < dataSubject.length - 1; i++) {
            let Subject = new SubjectInfo(dataSubject[i], dataFirstModule[i], dataSecondModule[i]);
            A.push(Subject);
          }
          resolve(A);
        }


      }, 300);

    });

    GetData.then((val) => {
      let replyMsg = val[0] + "\n" + `Номер зачетки: ${value[0]}` + '\n' + `Количество пропусков физры: ${value[1]}` + "\n\n"
      for (let i = 2; i < val.length; i++) {
        replyMsg += val[i].name.slice(0, 33) + "... | " + val[i].point1 + " | " + val[i].point2 + " |" + "\n";
      }
      replyMsg += '\n' + val[1];
      ctx.reply(replyMsg);

    }).catch(() => ctx.reply('Что-то не так, но я не знаю, что'));

  }).catch(() => ctx.reply('Зачетки нет в базе данных. Введите !help для получения инструкции'));

});






// ДОБАВЛЕНИЕ ЗАЧЕТКИ В БАЗУ ДАННЫХ
bot.command("!зачетка", async function (ctx) {
  console.log('WORKING');
  console.log("ID:", ctx.message.from_id, ' ', ctx.message.text);
  let msg = ctx.message.text;
  let msgs = msg.split(' ');
  let ID = ctx.message.from_id;
  let GetInfoAboutUser = new Promise((resolve, reject) => {
    SomeUser.findOne().where('VkId').equals(ID).select('Number').exec(function (err, resp) {
      if (resp != null) {
        reject('Error!')
      } else {
        resolve('Works!')
      }
    });
  }, 300);
  GetInfoAboutUser.then(
    async () => {

      let toTest = msgs[1]
      if (/^\d+$/.test(toTest)) {

        const response = await bot.execute('users.get', {
          user_ids: ID,
        });

        // Создать экземпляр модели SomeModel
        let person = new SomeUser({
          name: response[0].first_name + " " + response[0].last_name,
          VkId: ID,
          Number: msgs[1]
        });

        // Сохранить новый экземпляр, передав callback
        person.save(function (err) {
          if (err) return handleError(err);
        });

        ctx.reply(response[0].first_name + " " + response[0].last_name + " " + msgs[1] + " ✓")

      } else {
        ctx.reply('Некорректные данные');
      }

    }).catch(() => ctx.reply('Ваша зачетка уже есть в базе данных.'));


});




// ОБНОВЛЕНИЕ РАСПИСАНИЯ
// let lastDate = '2020-09-14';
// let timerId = setInterval(() => UpdateChecker(), 1440000); 

// function UpdateChecker() {
//   let UpdUrl = 'http://e.biblio.bru.by/handle/1212121212/10305'
//   let UpdCheck = new Promise((resolve, reject) => {
//     needle.get(UpdUrl, function (err, res) {
//       if (err) throw err;

//       let $ = cheerio.load(res.body);
//       let A = [];

//       $('.ds-artifact-list .ds-artifact-item a:contains("Осенний семестр 2 курс")').each((i, el) => {
//         console.log(i);
//         $(`.ds-artifact-list .ds-artifact-item:nth-child(${i+1}) .date`).each((a, elem) => {
//           A.push($(elem).text());

//         });
//       });

//       resolve(A);
//       reject("Something is wrong");
//       console.log(A);
//     }, 300);


//   });

//   UpdCheck.then((val) => {
//     if (lastDate != val[0]) {
//       let updMsg = 'В РАСПИСАНИЕ БЫЛИ ВНЕСЕНЫ ИЗМЕНЕНИЯ!' + '\n' + UpdUrl;
//       bot.sendMessage(2000000002, updMsg);
//       lastDate = val[0];

//     }
//   });

// };

// СЧЕТЧИК ПРОПУСКОВ ФИЗРЫ
bot.command(/(!пропуск физры|! пропуск физры)/, async function (ctx) {

  let ID = ctx.message.from_id;

  await SomeUser.findOneAndUpdate({
    'VkId': ID
  }, {
    $inc: {
      'MissesCount': 1
    }
  });

  let GetInfoAboutUser = new Promise((resolve, reject) => {
    SomeUser.findOne().where('VkId').equals(ID).select('MissesCount').exec(function (err, resp) {
      if (resp != null) {
        resolve(resp.MissesCount);
      } else {
        reject('Error!')

      }

    });
  }, 300);

  GetInfoAboutUser.then((value) => {
      ctx.reply(`ОБНОВЛЕНО. \n Количество пропусков физры: ${value}`);

    },
    () => ctx.reply('Зачетки нет в базе данных. Введите !help для получения инструкции'));



});

bot.command(/(!отработка физры|! отработка физры)/, async function (ctx) {

  let ID = ctx.message.from_id;

  await SomeUser.findOneAndUpdate({
    'VkId': ID
  }, {
    $inc: {
      'MissesCount': -1
    }
  });

  let GetInfoAboutUser = new Promise((resolve) => {
    SomeUser.findOne().where('VkId').equals(ID).select('MissesCount').exec(function (err, resp) {
      if (resp != null) {
        resolve(resp.MissesCount);
      } else {
        reject('Error!')
      }
    });
  }, 300);

  GetInfoAboutUser.then(async (value) => {
      if (value >= '0') {
        ctx.reply(`ОБНОВЛЕНО. \n Количество пропусков физры: ${value}`);
      } else {
        await SomeUser.findOneAndUpdate({
          'VkId': ID
        }, {
          $inc: {
            'MissesCount': +1
          }
        });
        ctx.reply(`У вас 0 пропусков`);
      }

    },
    () => ctx.reply('Зачетки нет в базе данных. Введите !help для получения инструкции'));



});

bot.command("tost", function (ctx) {
  bot.sendMessage(2000000002, 'TOSTED');
  console.log(ctx.message);
});


// РОФЛЫ ------------------------------
bot.command("Стас лох", function (ctx) {
  ctx.reply(
    "Разойдись, свинопасы, или Господин Бот вам за это таких пиздюлей отвесит, вовек не забудете! Где тут дрын какой-нибудь?!"
  );
});
bot.command("Стас пидорас", function (ctx) {
  ctx.reply(
    "Разойдись, свинопасы, или Господин Бот вам за это таких пиздюлей отвесит, вовек не забудете! Где тут дрын какой-нибудь?!"
  );
});
bot.command("Стас пидор", function (ctx) {
  ctx.reply(
    "Разойдись, свинопасы, или Господин Бот вам за это таких пиздюлей отвесит, вовек не забудете! Где тут дрын какой-нибудь?!"
  );
});

bot.command(/(Стас скинь|Стас, скинь)/, function (ctx) {
  ctx.reply(
    "Ты пришел и говоришь: Стас, мне нужна помощь. Но ты просишь без уважения, ты не предлагаешь дружбу, ты даже не назвал меня крестным отцом"
  );
});
bot.command("Бот хуй", function (ctx) {
  ctx.reply(
    "Ублюдок, мать твою, а ну иди сюда говно собачье, решил ко мне лезть? Ты, засранец вонючий, мать твою, а? Ну иди сюда, попробуй меня трахнуть, я тебя сам трахну ублюдок, онанист чертов, будь ты проклят, иди идиот, трахать тебя и всю семью, говно собачье, жлоб вонючий, дерьмо, сука, падла, иди сюда, мерзавец, негодяй, гад, иди сюда ты - говно, ЖОПА!"
  );
});
bot.command("Бот лох", function (ctx) {
  ctx.reply(
    "Ублюдок, мать твою, а ну иди сюда говно собачье, решил ко мне лезть? Ты, засранец вонючий, мать твою, а? Ну иди сюда, попробуй меня трахнуть, я тебя сам трахну ублюдок, онанист чертов, будь ты проклят, иди идиот, трахать тебя и всю семью, говно собачье, жлоб вонючий, дерьмо, сука, падла, иди сюда, мерзавец, негодяй, гад, иди сюда ты - говно, ЖОПА!"
  );
});
bot.command("замолчи", function (ctx) {
  ctx.reply("замалчииии");
});
bot.command("успокойся", function (ctx) {
  ctx.reply("охлади свое траханье");
});
bot.command("что думае", function (ctx) {
  ctx.reply("Я далёк от мысли…");
});
bot.command("что у вас было", function (ctx) {
  ctx.reply(
    "У нас было 2 пакетика травы, 75 ампул мескалина, 5 пакетиков диэтиламид лизергиновой кислоты, или ЛСД, солонка, на половину заполненая кокаином и целое море разноцветных амфитаминов, барбитуратов и транквилизаторов, а так же бутылка текилы, бутылка рома, ящик пива, пинта чистого эфира и две дюжины пузырьков амил нитрита...Чёртов Эфир после него вас развозит так ,что вы похожи на пьяницу из старой Ирландской новеллы, полная утрата опорно двигательных навыков, галюцинации, потеря равновесия, немеет язык, начинаются бояки, отказывает позвоночник"
  );
});



// bot.startPolling((err) => {
//   if (err) {
//     console.error(err);
//   }
// });
//console.log('----------- BOT STARTED -----------');


app.use(bodyParser.json());
app.post("/", bot.webhookCallback);
// app.post('/bot', (req, res) => {
//   if (req.body.type == 'confirmation') return res.send('7c9b6e99');

//   res.sendStatus(200);
// });
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log('----------- BOT STARTED -----------');
  console.log("App is running on port " + port);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('SOME ERROR I DONT KNOW WHAT HAPPENED', reason, promise);
});