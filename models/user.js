// This file contains all of our database functions for the Users model. This
// allows us to keep things focused on database queries.

// Require the modules we need for this model
// UUID for tokens
const uuid = require("uuid/v4");
// bcrypt for password hashing
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

// We're exporting a function here so that the knex db can be closured into the
// model functions

module.exports = db => {
  /**
   * This object represents a user which isn't logged in.
   * We mock out all the fields that would be expected by our views so we don't
   * have to write as many conditionals
   * @type {Object}
   */
  const nullUser = {
    id: -1,
    username: "anon",
    token: null
  };

  /**
   * Finds a user in our database by token
   * @param  {String} token The token to look up.
   * @return {Promise<User>} A promise which will resolve with a user.
   */
  const getToken = token => {
    return db("users")
      .select(["id", "username", "token"])
      .where({ token })
      .limit(1)
      .then(([user]) => {
        if (user) {
          return user;
        } else {
          return Promise.reject(`Cannot find user with token ${token}`);
        }
      });
  };

  /**
   * Try to login a user
   * @param  {String} username The user's username
   * @param  {String} password The user's password
   * @return {Promise<User>} A promise which resolves to the user if the username and password match
   */
  const login = (username, password) => {
    return db("users")
      .select(["id", "username", "token", "password_digest"])
      .where({ username })
      .limit(1)
      .then(([user]) => {
        if (user) {
          return user;
        } else {
          return Promise.reject(`Cannot find user with username ${username}`);
        }
      })
      .then(user =>
        bcrypt
          .compare(password, user.password_digest)
          .then(res => (res ? user : Promise.reject("Invalid password")))
      );
  };

  /**
   * Register a user
   * @param  {String} username The user's username
   * @param  {String} password The user's password
   * @return {Promise<User>} A promise which resolves to the user which was created in the database
   */
  const register = (username, password) =>
    bcrypt
      .hash(password, SALT_ROUNDS)
      .then(password_digest => ({
        username,
        token: uuid(),
        password_digest
      }))
      .then(user =>
        db("users")
          .insert(user)
          .then(id => {
            user.id = id;

            return user;
          })
      );

  // Return an object with the above items
  return { nullUser, getToken, login, register };
};
