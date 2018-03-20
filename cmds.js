const Sequelize = require('sequelize');
const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require("./out");



exports.helpCMD = (socket, rl) => {
	  log(socket, 'Commandos:');
      log(socket, '  h|help - Muestra la ayuda.');
      log(socket, '  list - Listar los quizzes existentes.');
      log(socket, '  show <id> - Muestra la pregunta y la respuesta del quiz indicado');
      log(socket, '  add - Añadir un nuevo quiz interactivamente');
      log(socket, '  delete <id> - Borrar el quiz indicado.');
      log(socket, '  test <id> - Probar el quiz indicado.');
      log(socket, '  p|play - Jugar con las preguntas aleatorias de todos los quizzes.');
      log(socket, '  credits - Créditos.');
      log(socket, '  q|quit - Salir del programa.');
      rl.prompt();
};

exports.listCMD = (socket, rl) => {

models.quiz.findAll()
.each(quiz => {
		log(socket, ` [${quiz.id}]: ${quiz.question}`);
	
	})
.catch(error => {
	errorlog(socket, error.message);
})
.then(() => {
	rl.prompt();
});};



const makeQuestion = (rl, text) => {
	return new Sequelize.Promise( (resolve, reject) => {
		rl.question(text, answer=> {
			resolve(answer.trim());

		});
	});
};


exports.addCMD = (socket, rl) => {

	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, "Introduzcala la  respuesta")
		.then(a => {
			return{question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
		log(socket, ` Se ha añadido: ${quiz.question} => ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket, 'El quiz es erroneo: ');
		error.errors.forEach(({message}) => errorlog(socket, message));

	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

exports.testCMD =(socket, rl, id)=> {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error (`No existe un quiz asociado al id=${id}.`);
		}

		return makeQuestion(rl, quiz.question)
		.then(respuesta => {
			if ( respuesta.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
				log(socket, "/\bcorrect/gim")
				log(socket, 'CORRECTO');
				log(socket, 'CORRECT');
				log(socket, 'correct');
				log(socket, 'correcto');
				rl.prompt();
			}else{
				log(socket, "/\bincorrect/gim")
				log(socket, 'INCORRECTO');
				log(socket, 'INCORRECT');
				log(socket, 'incorrect');
				log(socket, 'incorrecto');
				rl.prompt();	
			}

		})
	})
	 .catch(error => {
			errorlog(socket, error.message);
			rl.prompt();
	 });
	
};

const validateId = (id) => {
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined"){
			reject(new Error(`Falta el parametro <id>. `));
		}else{
			id = parseInt(id);
			if (Number.isNaN(id)){
				reject(new Error(`El valor del parametro <id> no es un numero`));
			}else{
				resolve(id);
			}
		}
	});
};

exports.showCMD = (socket, rl, id) => {
validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error (`No existe un quiz asociado al id=${id}.`);
		}

		log(socket, ` [${quiz.id}]: ${quiz.question} => ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(socket, error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


exports.playCMD = (socket, rl) => {
	let score = 0;
	let arrayIds = [];

	models.quiz.findAll()
	.then(quizzes => {
		quizzes.forEach((quiz, id) => {
  		arrayIds[id] = quiz;
		});

		const preguntica = () => {
			if( arrayIds.length === 0){
			log(socket, `No quedan preguntas. Tu puntuación ha sido: `);
			//log(` Tu puntuación ha sido: `, 'yelllow');
			biglog(socket, score);

			rl.prompt();
			} else{ 

				var preguntaAleatoria= Math.floor(Math.random() * arrayIds.length);

				var quiz = arrayIds[preguntaAleatoria];

				log(socket,  quiz.question);

				arrayIds.splice(preguntaAleatoria,1);

				makeQuestion(rl,'Introduzca una respuesta')
				.then(a => {
					if(a.toLowerCase().trim() === quiz.answer.toLowerCase()){
					score = score +1;
					log(socket, ` Correcto. Tu puntuación es de: score `);
					log(socket, 'CORRECTO');
					log(socket, 'CORRECT');
					log(socket, 'correct');
					log(socket, 'correcto');
					preguntica();
					}else{
					
						log(socket, 'INCORRECTO');
						log(socket, 'INCORRECT');
						log(socket, 'incorrect');
						log(socket, 'incorrecto');
						log(socket, ' Tu puntuación ha sido: ');
						log(socket, score);
						log(socket, ' Fin ');
						rl.prompt();
					}
				})
				.catch((error) => {
					errorlog(socket, error.message);
				});
			}
		};


		preguntica();
	})
	.catch((error) => {
		errorlog(socket, error.message);
	});

};
	


exports.deleteCMD = (socket, rl, id) => {
	
validateId(id)
.then(id => models.quiz.destroy({where: {id}}))
.catch(error => {
	errorlog(socket, error.message);
})
.then(()=> {
	rl.prompt();
});
};


exports.editCMD = (socket, rl, id)=> {
	
validateId(id)
.then(id => models.quiz.findById(id))
.then(quiz => {
	if (!quiz){
		throw new Error(`No existe un quiz asociado al id <id>.`);
	}

	process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question)},0);
	return makeQuestion(rl, 'Introduzca la pregunta: ')
	.then(q => {
		process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer)},0);
		return makeQuestion(rl, 'Introduzca la respuesta: ')
		.then(a => {
			quiz.question = q;
			quiz.answer = a;
			return quiz;
		});
	});
})
.then(quiz => {
	return quiz.save();
})
.then(quiz => {
log(socket, ` Se ha cambiado el quiz ${id} por : ${quiz.question} => ${quiz.answer}`);
})
.catch(Sequelize.ValidationError, error => {
	errorlog(socket, "El quiz es erroneo: ");
	error.errors.forEach(({message}) => errorlog(socket, message));
})
.catch(error => {
	errorlog(socket, error.message);
})
.then(() => {
	rl.prompt();
});
};


exports.quitCMD = (socket, rl) => {
	rl.close();
	socket.end();

};

exports.creditsCMD = (socket,rl) => {
        log(socket, 'Autores de la práctica:');
		log(socket, 'ALVARO CEPEDA ZAMORANO');
		log(socket, 'ALVARO MORSO GRANERO');
		rl.prompt();
	};
