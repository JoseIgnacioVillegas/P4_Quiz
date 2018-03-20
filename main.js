const readline = require('readline');


const model = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');
const cmds = require("./cmds");
const net = require("net");

var socket = new net.Socket();





net.createServer (socket =>{
  
console.log("Nuevo cliente en "+ socket.remoteAddress);

biglog('CORE Quiz',socket, 'green');

const rl = readline.createInterface({
    input: socket,
    output: socket,
    prompt: colorize('quiz> ', 'blue'),
    completer: (line) => {
        const completions = 'h help add delete edit list test p play credits q quit'.split(' ');
        const hits = completions.filter((c) => c.startsWith(line));
        // show all completions if none found
        return [hits.length ? hits : completions, line];
    }
});


socket.on("error", ()=>{
    rl.close();
  })
  socket.on("end", ()=>{
    rl.close();
  })



rl.prompt();

rl.on('line', (line) => {

    let args = line.split(" ");
    let cmd = args [0].toLocaleLowerCase().trim();

    switch (cmd) {
        case "":
            rl.prompt(rl);
            break;

        case 'help':
        case 'h':
            cmds.helpCmd(rl, socket);
            break;

        case 'quit':
        case 'q':
            cmds.quitCmd(rl);
            break;

        case 'add':
            cmds.addCmd(rl, socket);
            break;


        case 'list':
            cmds.listCmd(rl, socket);
            break;


        case 'show':
            cmds.showCmd(rl, args[1], socket);
            break;


        case 'test':
            cmds.testCmd(rl, args[1],socket);
            break;


        case 'p':
        case 'play':
            cmds.playCmd(rl, socket);
            break;

        case 'delete':
            cmds.deleteCmd(rl, args[1], socket);
            break;

        case 'edit':
            cmds.editCmd(rl, args[1], socket);
            break;

        case 'credits':
            cmds.creditsCmd(rl,socket);
            break;

        default:
            log(`Comando desconocido: '${colorize(cmd, 'red')}'`, socket);
            log(`Use ${colorize('help', 'green')} para ver todos los comandos disponibles.`, socket);
            rl.prompt();
            break;
    }

})
.on('close', () => {
    log('Adios!', socket);
    socket.end();
});

}).listen(3030);
