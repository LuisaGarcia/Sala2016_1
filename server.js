/**
 * Server.js
 * @author : DiganmeGiovanni | https://twitter.com/DiganmeGiovanni
 * @Created on: 25 Oct, 2014
 * Updated on: 15 Aug, 2015
* @Editado por: Luisa Fernanda Garcia
 * @Editado el : 11 abril de 2016
 * Actualizado: 18 abril 2016
 */


// ====================================================== //
// == MODULOS REQUERIDOS PARA LA APLICACIÓN
// ====================================================== //
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var http        = require('http').Server(app);
var io          = require('socket.io')(http);
var MongoClient = require('mongodb').MongoClient;
var NanoTimer   = require('nanotimer');
var timer = new NanoTimer();

// ====================================================== //
// == MODULOS PROPIOS DE LA APLICACIÓN
// Ahora con minuscula
// ====================================================== //
var userDAO     = require('./dao/userDAO').userDAO;
var messageDAO  = require('./dao/messageDAO').messageDAO;
var convDAO  = require('./dao/convDAO').convDAO;

// ====================================================== //
// == MONGODB DATOS DE CONEXIÓN
// ====================================================== //
var mdbconf = {
  // host: process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost',
  host: 'localhost',
  port: '27017',
  db: 'chatSS'
};

// ====================================================== // == INICIALIZA LA CONEXIÓN A MONGODB Y EL SERVIDOR
// =====================================================  //
var mongodbURL = 'mongodb://' + mdbconf.host + ':' + mdbconf.port + '/' + mdbconf.db;
// if (process.env.OPENSHIFT_MONGODB_DB_URL) {
//   mongodbURL = process.env.OPENSHIFT_MONGODB_DB_URL
// }
MongoClient.connect(mongodbURL, function (err, db) {
  
  var usersDAO = new userDAO(db);
  var messagesDAO = new messageDAO(db);
  var convsDAO = new convDAO(db);
  var onlineUsers = [{_id: "Cami04"},{_id: "Atenea"},{_id: "AnakinSW"}];
  var fakeUsers = 3;
  var limitConv = false;
  

app.use(bodyParser()); // Para acceder a 'req.body' en peticiones POST
  
  // view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// ====================================================== //
// == CONFIGURACIÓN DE RUTAS
// =====================================================  //
  // app.get('/signup', function (req, res) {
  //   res.render('signup', {nombre: req.body.nombre});
  // });

  app.get('/:nombre', function (req, res) {
    res.render('chat', {nombre: req.params.nombre});
  });
  
  app.post('/signup', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email    = req.body.email;
    
    usersDAO.addUser(username, password, email, function (err, user) {
      if (err) {
        res.send({ 'error': true, 'err': err});
      }
      else {
        //user.password = null;
        res.send({ 'error': false, 'user': user });
      }
    });
  });

  app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var tipo = req.body.tipo;
    var user = {'_id': username, 'password': password, 'tiposala': tipo};
    res.send({'error': false, 'user': user});
    // usersDAO.validateLogin(username, password, function (err, user) {
    //   if (err) {
    //     res.send({'error': false, 'user': user});
    //   }
    //   else {
    //     //user.password = null;
    //     res.send({ 'error': false, 'user': user});
    //   }
    // })
  });
  
  /** css and js static routes */
  app.get('/css/foundation.min.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/foundation.min.css');
  });

  app.get('/css/normalize.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/normalize.css');
  });
  
  app.get('/css/chat.css', function (req, res) {
    res.sendFile(__dirname + '/views/css/chat.css');
  });
  
  app.get('/js/foundation.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.min.js');
  });
  
  app.get('/js/foundation.offcanvas.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/foundation.offcanvas.js');
  });
  
  app.get('/js/chat.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/chat.js');
  });
  
  app.get('/js/moment-with-locales.min.js', function (req, res) {
    res.sendFile(__dirname + '/views/js/moment-with-locales.min.js');
  });
  
  app.get('/img/estrella.png', function (req, res) {
    res.sendFile(__dirname + '/views/img/estrella.png');
  });
  
  app.get('*', function(req, res) {
    res.sendFile( __dirname + '/views/chat.html');
  });


  /** *** *** ***
   *  Configuramos Socket.IO para estar a la escucha de
   *  nuevas conexiones. 
   */
  io.on('connection', function(socket) {
    
    console.log('New user connected');
    
    socket.join('prueba');
    /**
     * Cada nuevo cliente solicita con este evento la lista
     * de usuarios conectados en el momento.
     */
    socket.on('all online users', function () {
      socket.emit('all online users', onlineUsers);
    });
    
    /**
     * Cada nuevo socket debera estar a la escucha
     * del evento 'chat message', el cual se activa
     * cada vez que un usuario envia un mensaje.
     * 
     * @param  msg : Los datos enviados desde el cliente a 
     *               través del socket.
     */
    socket.on('chat message', function(msg) {
      messagesDAO.addMessage(msg.username, msg.date, msg.message, function (err, nmsg) {
        io.emit('chat message', msg);
      });
    });
    
    /**
     * Mostramos en consola cada vez que un usuario
     * se desconecte del sistema.
     */
    socket.on('disconnect', function() {
      onlineUsers.splice(onlineUsers.indexOf(socket.user), 1);
      io.emit('remove user', socket.user);
      if(onlineUsers.lenght <= fakeUsers) limitConv = false;
      console.log('User disconnected');
    });
    
    /**
     * Cada nuevo cliente solicita mediante este evento
     * los ultimos mensajes registrados en el historial
     */
    socket.on('latest messages', function () {
      messagesDAO.getLatest(50, function (err, messages) {
        if (err) console.log('Error getting messages from history');
        socket.emit('latest messages', messages);
      });
    });
    
        /**
     * Cada pra mandar las conversaciones almacenadas
     */
    socket.on('entrada conv', function (Tconvs) {
      if(!limitConv)
      {
        convsDAO.traerConv(Tconvs, function (err, conversacion) {
          if (err) console.log('Error al obtener la conversacion');
          socket.emit('entrada conv', conversacion);
          limitConv=true;
      });
     }
    });
    
    /**
     * Cuando un cliente se conecta, emite este evento
     * para informar al resto de usuarios que se ha conectado.
     * @param  {[type]} nuser El nuevo usuarios
     */
    socket.on('new user', function (nuser) {
      socket.user = nuser;
      onlineUsers.push(nuser);
      io.emit('new user', nuser);
    });
    
  });


  // ====================================================== //
  // == APP STARTUP
  // ====================================================== //
/*  if (process.env.OPENSHIFT_NODEJS_IP && process.env.OPENSHIFT_NODEJS_PORT) {
    http.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function() {
      console.log('Listening at openshift on port: ' + process.env.OPENSHIFT_NODEJS_PORT);
    });
  }
  else {
    http.listen(2000, function () {
      console.log('Listing on port: 2000')
    })
  }*/

    http.listen(2000, function () {
      console.log('Listing on port: 2000');
    });

});