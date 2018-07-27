exports.up = function(knex, Promise) {
  return knex.schema.alterTable("users", t => {
    t.string("password_digest");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("users", t => {
    t.dropColumn("password_digest");
  });
};
