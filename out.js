const chalk = require('chalk');
const figlet = require('figlet');

/**
* Dar color a un string
*
* @param msg    Es string al que hay que dar color
* @param color  El color con el que pintar el msg
* @param {string}   DEvuelve el string msg con el color indicado
*/
const colorize = (msg, color) => {
    if (typeof color !== "undefined") {
        msg = chalk[color].bold(msg);
    }
    return msg ;
};

/**
* Escribe un mensaje de log.
*
* @param msg    El string a escribir.
* @param color  Color del texto.
*/

const log = (msg, socket, color) => {
	mens = msg + "\n";
    socket.write(colorize(mens, color));
};

/**
* Escribe un mensaje de log grande.
*
* @param msg    Texto a escribir.
* @param color  Color del texto.
*/
const biglog = (msg, socket, color) => {
    log(figlet.textSync(msg,{horizontalLayout: 'full'}),socket, color);
};

/**
* Escribe el mensaje de error emsg.
*
* @param emsg   Texto del mensaje de eror.
*/
const errorlog = (emsg, socket) => {
    socket.write(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}\n`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog,
};