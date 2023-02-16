/**
 *
 *
 * @param {*} user
 * @returns
 */
module.exports.serializeUser = (user) => {
  return {
    firstName: user.firstName,
    id: user._id,
    image: user.image,
    middleName: user.middleName,
    permission: user.permission,
    surName: user.surName,
    username: user.userName,
  }
}

module.exports.serializeListUsers = (listUsers) => {
  let listUsersArray = []
  for (let i=0; i<listUsers.length; i++) {
    listUsersArray.push(this.serializeUser(listUsers[i])    )
  }
  return listUsersArray
}

module.exports.serializeNews = (news) => {
  return {
    id: news._id,
    title: news.title,
    text: news.text,
    created_at: news.created_at,
    user: news.user,
  }
}

module.exports.serializeListNews = (listNews) => {
  let listNewsArray = []
  for (let i=0; i<listNews.length; i++) {
    listNewsArray.push(this.serializeNews(listNews[i])    )
  }
  return listNewsArray
}

