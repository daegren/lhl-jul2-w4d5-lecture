exports.up = function(knex, Promise) {
  return knex.schema.createTable("users", t => {
    t.increments();
    t.string("username").unique();
    t.string("token");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable("users");
};
