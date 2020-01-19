const express = require('express')
const bodyParser = require('body-parser')
const VkBot = require('node-vk-bot-api')
const app = express()

const token = "..."
const bot = new VkBot({
    token: token,
    group_id: "190347441",
    execute_timeout: 50, // in ms   (50 by default)
    polling_timeout: 25, // in secs (25 by default)
    confirmation: "bb2138f6",
})
// РАСПИСАНИЕ ----------------------------
const schedule1 = ["1. Физкультура", "2. Математика", "3. Математика", "4. КГ (?)"]
const schedule2 = ["1. ОАИП", "2. ОАИП или КГ", "3. История или английский", "4. История (?)"]
const schedule3 = ["1. Математика", "2. Математика", "3. КГ или БЖД", "4. Университетоведение (?)"]
const schedule4 = ["1. ОАИП (?)", "2. Физкультура", "3. Основы экономики", "4. Основы экономики"]
const schedule5 = ["1. БЖД лаба (?)", "2. Английский", "3. Введение в специальность или бел.яз", "4. БЖД(лекция)"]
const timeTable = ["1. 8:30 - 10:05", "2. 10:25 - 12:00", "3. 12:30 - 14:05", "4. 14:20 - 15:55", "5. 16:05 - 17:40"]
// ОБЪЯВЛЕННЫЕ ПЕРЕМЕННЫЕ ---------------------
var dayNum
var h
var m
var help = []
var presentSchedule = []
var nextSchedule = []
var time
var dayName
var lessonNum
var nextDayName
// ФУНКЦИИ ----------------------------
// ПОКАЗАТЬ ПОМОЩЬ
function showHelp() {
    help = ["Доступные команды бота (можно без пробела или с пробелом после '!') : ",
        "!время -- показывает текущее время (почему бы и нет?)",
        "!день -- показывает текущий день (можно использовать как проверку работоспособности)",
        "!расписание -- показывает расписание на сегодняшний день",
        "!пара -- показывает текущую и следующую пару (в конце любой пары лучше не использовать, т.к. могут быть баги, долго объяснять)",
        "!пары завтра -- показывает пары на завтрашний день",
        "!звонки -- показывает расписание звонков"
    ]
}
// ТАЙМЕР
setInterval(function clock() {
    const presentTime = new Date()
    h = presentTime.getHours()
    m = presentTime.getMinutes()
    if (h < 21) {
        h += 3
    } else if (h == 21) {
        h = 0
    } else if (h == 22) {
        h = 1
    } else if (h == 23) {
        h = 2
    }

}, 1000)
// ПОКАЗАТЬ ВРЕМЯ 
function showTime() {
    if (m < 10) {
        time = "Сейчас " + h + ":0" + m
    } else {
        time = "Сейчас " + h + ":" + m
    }
}
// СЛЕДУЮЩИЙ ДЕНЬ
function showNextDayName() {
    const presentDate = new Date()
    dayNum = presentDate.getDay()

    if (dayNum == 0) {
        nextDayName = "Завтра понедельник"
    } else if (dayNum == 1) {
        nextDayName = "Завтра вторник"
    } else if (dayNum == 2) {
        nextDayName = "Завтра среда"
    } else if (dayNum == 3) {
        nextDayName = "Завтра четверг"
    } else if (dayNum == 4) {
        nextDayName = "Завтра пятница"
    } else if (dayNum == 5) {
        nextDayName = "Завтра суббота"
    } else if (dayNum == 6) {
        nextDayName = "Завтра воскресенье"
    }
}
// НАЗВАНИЕ ДНЯ НЕДЕЛИ
function showDayName() {
    const presentDate = new Date()
    dayNum = presentDate.getDay()
    if (dayNum == 0) {
        dayName = "Сегодня воскресенье"
    } else if (dayNum == 1) {
        dayName = "Сегодня понедельник"
    } else if (dayNum == 2) {
        dayName = "Сегодня вторник"
    } else if (dayNum == 3) {
        dayName = "Сегодня среда"
    } else if (dayNum == 4) {
        dayName = "Сегодня четверг"
    } else if (dayNum == 5) {
        dayName = "Сегодня пятница"
    } else if (dayNum == 6) {
        dayName = "Сегодня Суббота"
    }
}
// РАСПИСАНИЕ
function showSchedule() {
    const presentDate = new Date()
    dayNum = presentDate.getDay()

    if (dayNum == 1) {
        presentSchedule = schedule1
    } else if (dayNum == 2) {
        presentSchedule = schedule2
    } else if (dayNum == 3) {
        presentSchedule = schedule3
    } else if (dayNum == 4) {
        presentSchedule = schedule4
    } else if (dayNum == 5) {
        presentSchedule = schedule5
    }
}
// РАСПИСАНИЕ НА СЛЕДУЮЩИЙ ДЕНЬ
function showNextSchedule() {
    const presentDate = new Date()
    dayNum = presentDate.getDay()
    if (dayNum < 5) {
        if (dayNum == 0) {
            nextSchedule = schedule1
        } else if (dayNum == 1) {
            nextSchedule = schedule2
        } else if (dayNum == 2) {
            nextSchedule = schedule3
        } else if (dayNum == 3) {
            nextSchedule = schedule4
        } else if (dayNum == 4) {
            nextSchedule = schedule5
        }
    }
}
// ТЕКУЩАЯ И СЛЕДУЮЩАЯ ПАРА
function showPresentLesson() {
    // ПЕРВАЯ ПАРА ----------------------------
    showTime()
    showSchedule()
    if (h >= 8 && h < 10) {
        lessonNum = "Сейчас первая пара - " + presentSchedule[0] + "\nСледующая пара - " + presentSchedule[1]
    }
    // ВТОРАЯ ПАРА ----------------------------
    else if (h >= 10 && h < 12) {
        lessonNum = "Сейчас вторая пара - " + presentSchedule[1] + "\nСледующая пара - " + presentSchedule[2]
    }
    // ТРЕТЬЯ ПАРА ----------------------------
    else if (h >= 12 && h < 14) {
        lessonNum = "Сейчас третья пара - " + presentSchedule[2] + "\nСледующая пара - " + presentSchedule[3]
    }
    // ЧЕТВЕРТАЯ ПАРА -------------------------
    else if (h >= 14 && h < 16) {
        lessonNum = "Сейчас четвертая пара - " + presentSchedule[3] + "\nСледующей пары нет, иди домой"
    }
    //ОТСУТСТВИЕ ПАР --------------------------
    else {
        lessonNum = "Сейчас нет пар"
    }
}
// РОФЛЫ ------------------------------
bot.command("Стас лох", function (ctx) {
    ctx.reply("Разойдись, свинопасы, или Господин Бот вам за это таких пиздюлей отвесит, вовек не забудете! Где тут дрын какой-нибудь?!")
})
bot.command("Стас пидорас", function (ctx) {
    ctx.reply("Разойдись, свинопасы, или Господин Бот вам за это таких пиздюлей отвесит, вовек не забудете! Где тут дрын какой-нибудь?!")
})
bot.command("Стас пидор", function (ctx) {
    ctx.reply("Разойдись, свинопасы, или Господин Бот вам за это таких пиздюлей отвесит, вовек не забудете! Где тут дрын какой-нибудь?!")
})
bot.command("заплатите", function (ctx) {
    ctx.reply("ЧЕКАННОЙ МОНЕЕЕТОЙ!ЧЕКАННОЙ МОНЕЕЕТОООЙ!ВОООООУ!")
})
bot.command("!пары послезавтра", function (ctx) {
    ctx.reply("дохуя хочешь")
})
bot.command("сколько можно", function (ctx) {
    ctx.reply("Бесконечность не предел!")
})
bot.command("Стас скинь", function (ctx) {
    ctx.reply("Ты пришел и говоришь: Стас, мне нужна помощь. Но ты просишь без уважения, ты не предлагаешь дружбу, ты даже не назвал меня крестным отцом")
})
bot.command("Бот хуй", function (ctx) {
    ctx.reply("Ублюдок, мать твою, а ну иди сюда говно собачье, решил ко мне лезть? Ты, засранец вонючий, мать твою, а? Ну иди сюда, попробуй меня трахнуть, я тебя сам трахну ублюдок, онанист чертов, будь ты проклят, иди идиот, трахать тебя и всю семью, говно собачье, жлоб вонючий, дерьмо, сука, падла, иди сюда, мерзавец, негодяй, гад, иди сюда ты - говно, ЖОПА!")
})
bot.command("замалчи", function (ctx) {
    ctx.reply("сама замалчи")
})
bot.command("успокойся", function (ctx) {
    ctx.reply("охлади свое траханье")
})
bot.command("что думае", function (ctx) {
    ctx.reply("Я далёк от мысли…")
})
bot.command("что у вас было", function (ctx) {
    ctx.reply("У нас было 2 пакетика травы, 75 ампул мескалина, 5 пакетиков диэтиламид лизергиновой кислоты, или ЛСД, солонка, на половину заполненая кокаином и целое море разноцветных амфитаминов, барбитуратов и транквилизаторов, а так же бутылка текилы, бутылка рома, ящик пива, пинта чистого эфира и две дюжины пузырьков амил нитрита...Чёртов Эфир после него вас развозит так ,что вы похожи на пьяницу из старой Ирландской новеллы, полная утрата опорно двигательных навыков, галюцинации, потеря равновесия, немеет язык, начинаются бояки, отказывает позвоночник")
})
bot.command("Данила", function (ctx) {
    ctx.reply("Ты что, крейзи?")
})
// ПОМОЩЬ ----------------------------
bot.command(/(!help|! help)/, function (ctx) {
    console.log(ctx.message.text)
    showHelp()
    ctx.reply(help[0] + "\n" + help[1] + "\n" + help[2] + "\n" + help[3] + "\n" + help[4] + "\n" + help[5] + "\n")
})
// ДЕНЬ НЕДЕЛИ ----------------------------
bot.command(/(!день|! день)/, function (ctx) {
    console.log(ctx.message.text)
    showDayName()
    ctx.reply(dayName)
})
// ВРЕМЯ ----------------------------
bot.command(/(!время|! время)/, function (ctx) {
    console.log(ctx.message.text)
    showTime()
    ctx.reply(time)
})
// РАСПИСАНИЕ ----------------------------
bot.command(/(!расписание|! расписание)/, function (ctx) {
    console.log(ctx.message.text)
    showSchedule()
    showDayName()
    if (dayNum < 5 && dayNum != 0) {
        ctx.reply(dayName + "\n" + presentSchedule[0] + "\n" + presentSchedule[1] + "\n" + presentSchedule[2] + "\n" + presentSchedule[3])
    } else {
        ctx.reply(dayName)
    }

})
// КАКАЯ СЕЙЧАС ПАРА ----------------------------
bot.command(/(!пара|! пара)/, function (ctx) {
    console.log(ctx.message.text)
    showPresentLesson()
    if (dayNum != 0 && dayNum != 6) {
        ctx.reply(lessonNum)
    } else {
        ctx.reply(dayName)
    }
})
// РАСПИСАНИЕ НА СЛЕДУЮЩИЙ ДЕНЬ
bot.command(/(!пары завтра|! пары завтра)/, function (ctx) {
    console.log(ctx.message.text)
    showNextDayName()
    showNextSchedule()
    if (dayNum < 5) {
        ctx.reply(nextDayName + "\n" + nextSchedule[0] + "\n" + nextSchedule[1] + "\n" + nextSchedule[2] + "\n" + nextSchedule[3])
    } else {
        ctx.reply(nextDayName)
    }
})
// РАСПИСАНИЕ ЗВОНКОВ
bot.command(/(!звонки|! звонки)/, function (ctx) {
    ctx.reply(timeTable[0] + "\n" + timeTable[1] + "\n" + timeTable[2] + "\n" + timeTable[3] + "\n" + timeTable[4])
})

app.use(bodyParser.json())
app.post('/', bot.webhookCallback)
app.listen(process.env.PORT || 80)
console.log("---------------  Bot started  -------------")
