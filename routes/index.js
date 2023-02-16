const express = require('express')
const router = express.Router()
const tokens = require('../auth/tokens')
const passport = require('passport')
const db = require('../models')
const helper = require('../helpers/serialize')
const fs = require("fs");
const path = require("path");
const formidable = require('formidable')
const User = require("../models/schemas/user");

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (!user || err) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      })
    }
    // TODO: check IP user
    req.user = user
    next()
  })(req, res, next)
}

router.post('/registration', async (req, res) => {
  const { username } = req.body
  const user = await db.getUserByName(username)
  if (user) {
    return res.status(409).json({
      message: `Пользователь ${username} существует`
    }) // TODO:
  }
  try {
    const newUser = await db.createUser(req.body)
    const token = await tokens.createTokens(newUser)
    res.json({
      ...helper.serializeUser(newUser),
      ...token,
    })
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.post('/login', async (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      if (err) {
        return next(err)
      }
      if (!user) {
        return res.status(400).json({ message: 'Не правильный логин/пароль'}) // TODO:
      }
      if (user) {
        const token = await tokens.createTokens(user)
        console.log(token)
        res.json({
          ...helper.serializeUser(user),
          ...token,
        })
      }
    },
  )(req, res, next)
})

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.headers['authorization']
  // TODO: compare token from DB
  const data = await tokens.refreshTokens(refreshToken)
  res.json({ ...data })
})

router
  .get('/profile', auth, async (req, res) => {
    const user = req.user

    res.json({
      ...helper.serializeUser(user),
    })
  })
  .patch('/profile', auth, async (req, res) => {
    try {
      const user = req.user
      const form = new formidable.IncomingForm()
      const upload = path.join('./', 'upload')
      if (!fs.existsSync(upload)) {
        fs.mkdirSync(upload)
      }

      form.uploadDir = path.join(process.cwd(), upload)

      await form.parse(req, (err, fields, files) => {
        if (err) {
          return res.status(500).json({
            message: err.message
          })
        }

        async function validation(fields, files) {
          if (!fields.firstName) {
            return { status: 'Пожалуйста, заполните поле с именем', err: true }
          }
          if (!fields.middleName) {
            return { status: 'Пожалуйста, заполните поле с отчеством', err: true }
          }
          if (!fields.surName) {
            return { status: 'Пожалуйста, заполните поле с фамилией', err: true }
          }

          if (files.avatar && (files.avatar.originalFilename === '' || files.avatar.size === 0)) {
            return { status: 'Картинка не загружена', err: true }
          }

          if (fields.oldPassword || fields.newPassword || fields.confirmPassword) {
            if (!fields.oldPassword) {
              return { status: 'Пожалуйста, заполните поле со старым паролем', err: true }
            }
            if (!fields.newPassword) {
              return { status: 'Пожалуйста, заполните поле с новым паролем', err: true }
            }

            const dbUser = await User.findOne({ userName: user.userName })
            if (dbUser && !dbUser.validPassword(fields.oldPassword)) {
              return { status: 'Неправильно введен старый пароль', err: true }
            }

            if (fields.newPassword !== fields.confirmPassword) {
              return { status: 'Новый пароль не совпадает с подтвержденным', err: true }
            }
          }

          return { status: 'Ok', err: false }
        }

        validation(fields, files).then((valid) => {
          if (valid.err) {
            if (files.avatar) {
              fs.unlinkSync(files.avatar.filepath)
            }

            return res.status(409).json({
              message: valid.status
            })
          }

          let src = user.image

          const myPromise = new Promise((resolve) => {
            if (files.avatar) {
              const newFilePath = path.join(upload, files.avatar.originalFilename)
              fs.rename(files.avatar.filepath, newFilePath,  (err) => {
                if (err) {
                  fs.unlinkSync(files.avatar.filepath)
                  return res.status(500).json({
                    message: err.message
                  })
                }

                src = newFilePath
                resolve()
              })
            } else {
              resolve()
            }
          })

          myPromise.then(() => {
            const updatedData = {
              ...helper.serializeUser(user),
              ...fields,
              image: src
            }

            db.updateUser(updatedData).then(updatedUser => {
              res.json({
                ...helper.serializeUser(updatedUser),
              })
            })
          })
        })
      })
    } catch (e) {
      console.log('Profile error: ', e)
      return res.status(500).json({ message: e.message || e })
    }
  })

router.get('/news', auth, async (req, res, next) => {
  const refreshToken = req.headers['authorization']
  const user = await tokens.getUserByToken(refreshToken)
  const allNews = await db.getAllNews(user.userName)

  res.json(allNews ? [
    ...helper.serializeListNews(allNews),
  ] : {})
})

router.post('/news', auth, async (req, res, next) => {
  const refreshToken = req.headers['authorization']
  const user = await tokens.getUserByToken(refreshToken)

  try {
    const data = {
      ...req.body,
      user: helper.serializeUser(user)
    }
    const newNews = await db.createNews(data)
    const allNews = await db.getAllNews(user.userName)
    res.json(allNews ? [
      ...helper.serializeListNews(allNews),
    ] : {})
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.delete('/news/:id', auth, async (req, res, next) => {
  const refreshToken = req.headers['authorization']
  const user = await tokens.getUserByToken(refreshToken)

  try {
    const deletedNews = await db.deleteNewsById(req.params.id)
    const allNews = await db.getAllNews(user.userName)
    res.json(allNews ? [
      ...helper.serializeListNews(allNews),
    ] : {})
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.patch('/news/:id', auth, async (req, res, next) => {
  const refreshToken = req.headers['authorization']
  const user = await tokens.getUserByToken(refreshToken)

  try {
    const data = {
      id: req.params.id,
      ...req.body
    }
    const updatedNews = await db.updateNewsById(data)
    const allNews = await db.getAllNews(user.userName)
    res.json(allNews ? [
      ...helper.serializeListNews(allNews),
    ] : {})
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.get('/users', auth, async (req, res, next) => {
  const allUsers = await db.getUsers()

  res.json(allUsers ? [
    ...helper.serializeListUsers(allUsers),
  ] : {})
})

router.patch('/users/:id/permission', auth, async (req, res, next) => {
  try {
    const user = await db.getUserById(req.params.id)

    const updatedData = {
      username: user.userName,
      ...req.body
    }

    db.updateUserPermission(updatedData).then(async () => {
      const allUsers = await db.getUsers()

      res.json(allUsers ? [
        ...helper.serializeListUsers(allUsers),
      ] : {})
    })
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.delete('/users/:id', auth, async (req, res, next) => {
  try {
    const deletedUser = await db.deleteUserById(req.params.id)
    const allUsers = await db.getUsers()
    res.json(allUsers ? [
      ...helper.serializeListUsers(allUsers),
    ] : {})
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

module.exports = router
