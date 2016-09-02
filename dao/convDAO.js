
/* Util para encriptar el password del usuario */
var bcrypt = require('bcrypt-nodejs');

/**
 * Data Access Object (DAO) para 'users',
 * Debe ser construido con un objeto conectado a la
 * base de datos
 */
function convDAO(db) {
  
  /**
   * Si el constructor es llamado sin el operador 'new',
   * muestra una advertencia y lo llama correctamente.
   */
  if (false == (this instanceof convDAO)) {
    console.log('WARNING: convDAO constructor called without "new" operator');
    return new convDAO(db);
  }
  
  /* Colección 'users' en la base de datos */
  var convs = db.collection('conv');
  
  
  this.traerConv = function (Tconvs, callback) {
    convs.find({ Tconv: Tconvs } ).toArray(function (err, rconver) {
      if (err) return callback(err, null);
      return callback(null, rconver);
    });
  }
  
}
module.exports.convDAO = convDAO;