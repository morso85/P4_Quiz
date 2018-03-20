const readline = require('readline');
const model = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");
const cmds = require("./cmds");

const net = require("net");


net.createServer(socket => {
	console.log("Se ha conectado un cliente desde" + socket.remoteAddress);


log(socket,'CORE Quiz');


const rl = readline.createInterface({
  input: socket,
  output: socket,
  prompt: 'quiz> ',
  completer:(line) => {
  const completions = 'h help add delete edit list test p play credits q quit'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // show all completions if none found
  return [hits.length ? hits : completions, line];
}
});
socket
.on("end", () => {rl.close();})
.on("error", () => { rl.close(); });
rl.prompt();

rl
.on('line', (line) => {

	let args =line.split(" ");
	let cmd = args[0].toLowerCase().trim();


  switch (cmd) {
  	case "":
  	rl.prompt();
  	break;

    case 'help':
    case 'h':
      cmds.helpCMD(socket, rl);
      break;

	case 'quit':
	case 'q':
		cmds.quitCMD(socket, rl);
		break;

	case 'add':
		cmds.addCMD(socket, rl);
		break;

	case 'list':
		cmds.listCMD(socket, rl);
		break;

	case 'show':
		cmds.showCMD(socket, rl, args[1]);
		break;

	case 'test':
		cmds.testCMD(socket, rl, args[1]);
		break;	

	case 'play':
	case 'p':
		cmds.playCMD(socket, rl);
		break;	

	case 'delete':
		cmds.deleteCMD(socket, rl, args[1]);		
		break;	

	case 'edit':
		cmds.editCMD(socket, rl, args[1]);		
		break;	

	case 'credits':
		cmds.creditsCMD(socket, rl);		
		break;	
 
 
    default:
      console.log(socket, `Comando desconocido:'${cmd}'`);
      console.log(socket, 'Use  "help"  para ver todos los comandos disponibles. ')
      rl.prompt();
      break;
  }
})
.on('close', () => {
  console.log(socket, 'Ten un buen día');

});
})
.listen(3030);

