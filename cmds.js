const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');
const Sequelize = require('sequelize');

//FUNCIONA
/**
 * Muestra la ayuda
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */

exports.helpCmd = (rl, socket) => {
    log("Comandos:",socket);
    log("   h|help - Muestra esta ayuda.",socket);
    log("   list - Listar los quizzes existentes.",socket);
    log("   show <id> - Muestra la pregunta y la respuesta el quiz indicado.",socket);
    log("   add - Añadir un nuevo quiz interactivamente.",socket);
    log("   delete <id> - Borrar el quiz indicado.",socket);
    log("   edit <id> - Editar el quiz indicado.",socket);
    log("   test <id> - Probar el quiz indicado.",socket);
    log("   p|play - Jugar a preguntar aleatoriamente todos los quizzes.",socket);
    log("   credits - Créditos.",socket);
    log("   q|quit - Salir del programa.",socket);
    rl.prompt();
};

//FUNCIONA
/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.listCmd = (rl, socket) => {
    models.quiz.findAll()
    .each(quiz => {
			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`, socket);
    })
    .catch(error => {
    	errorlog(error.message, socket);
    })
    .then(() => {
    	rl.prompt();
    });
};

//FUNCIONA
/**
* Esta función devuelve una promesa que:
*	-Valida que se ha introducido un valor para el parámetro. 
*	-Convierte el parámetro en un número entero.
* Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
*
* @param id Parametro con el índice a validar.
*/
const validateId = id =>{
	return new Promise ((resolve, reject) => {
		if(typeof id === "undefined"){
			reject(new Error(`Falta el parámetro <id>.`));
		} else {
			id = parseInt(id); // Coge la parte entera y descarta lo demás.
			if(Number.isNaN(id)){
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};


//FUNCIONA
/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id, socket) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz =>{
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id= ${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`, socket);
	})
	.catch(error => {
		errorlog(error.message, socket);
	})
	.then(() => {
		rl.prompt();
	});
};
 

 //FUNCIONA PERO IMPRIME DOS VECES LA PREGUNTA
// OJO HAY QUE ARREGLARLO
/**
* Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido
* Entonces cuando se hace la llamada a then, la promesa que devuelve será:
*		.then(answer => {...})
*
* También colore en rojo el texto de la pregunta, elimina espacios al principio y al final
*
* @param rl Objeto readline usado para implementar el CLI
* @param text Pregunta que hay que hacerle al usuario.
*/

const makeQuestion = (rl, text) => {
	return new Promise((resolve, reject) => {
		rl.question(colorize(text+"\n",'red'), answer => {
			resolve(answer.trim());
		});
	});
};




//FUNCIONA PERO PONE LAS NUEVAS IDs MAL
//vamos que NO FUNCIONA
/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.addCmd = (rl, socket) => {
	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca una respuesta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`, socket);
	})
	.catch(new Sequelize.ValidationError(), error => {
		errorlog('El quiz es erroneo: ', socket);
		error.errors.forEach(({message}) => errorlog(message, socket));
	})
	.catch(error => {
		errorlog(error.message, socket);
	})
	.then(() => {
		rl.prompt();
	});
};



//FUNCIONA
/**
 * Borra un quiz del modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id, socket) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		log(`${colorize('El quiz', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} ${colorize('Ha sido borrado satisfactoriamente', 'green')}`, socket);
		models.quiz.destroy({where: {id}})
	})
	.catch(error => {
		errorlog(error.message, socket);
	})
	.then(() => {
		rl.prompt();
	});
};

//FUNCIONA
//FUNCIONA, LO QUE FALLA ES EL MAKE QUESTION, QUE DUPLICA LAS COSAS
/**
 * Edita un quiz del modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl,id, socket) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id= ${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a => {
				log(`Se ha cambiado el quiz'[${colorize(id, 'magenta')}] ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}' `,socket);
				log(`'[${colorize(id, 'magenta')}] ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}' `,socket);
				console.log("primera: "+a)
				console.log("segunda: "+quiz.answer)
				quiz.question = q;
				quiz.answer = a;
				console.log("tercera: "+quiz.answer)
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log("por el quiz", socket);
		log(`'[${colorize(id, 'magenta')}] ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}'`, socket);
	})
	.catch(new Sequelize.ValidationError(), error => {
		errorlog('EL quiz es erroneo: ', socket);
		error.errors.forEach(({message}) => errorlog(message, socket));
	})
	.catch(error => {
		errorlog(error.message, socket);
	})
	.then(() => {
		rl.prompt();
	});
};



//FUNCIONA
/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a probar
 */
exports.testCmd = (rl,id, socket) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		pregunta = quiz.question;
		makeQuestion(rl, pregunta + '?')
		.then(a => {
			if ( a.toLocaleLowerCase() === quiz.answer.toLocaleLowerCase()){
					log("La respuesta es correcta.",socket, 'green');
					biglog('Correcta',socket, 'green');
					rl.prompt();
				}else{
					log("La respuesta es incorrecta.",socket, 'green');
					biglog('Incorrecta',socket, 'red');
					rl.prompt();
				}
		});
	})
	.catch(error => {
		errorlog(error.message,socket);
	})
	.then(() => {
		rl.prompt();
	});
};



//FUNCIONA
/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 * @param rl	Objeto readline usado para implementar el CLI
 */

exports.playCmd = (rl,socket) => {
	var cuenta = 1;
	var toBeResolved = [];
	var score = 0;
	models.quiz.findAll()
    .each(quiz => {
		toBeResolved[cuenta-1] = quiz.id;
		cuenta = cuenta +1 ;
    })
    .then(() => {
	    const playOne = ()=> {
			if ( toBeResolved.length == 0){
				log("No hay nada más que preguntar.",socket);
				log("Fin del examen. Aciertos: ",socket);
				biglog(score, socket,'red');
				rl.prompt();
			}else{
				let rand = Math.trunc(Math.random()*toBeResolved.length);
				let id = toBeResolved[rand];
				validateId(id)
				.then(id => models.quiz.findById(id))
				.then(quiz => {
					pregunta = quiz.question;
					makeQuestion(rl, pregunta + '?')
					.then(a => {
						if ( a.toLocaleLowerCase() === quiz.answer.toLocaleLowerCase()){
							score++;
							log("CORRECTO - Lleva "+ score + "aciertos.",socket) 
							toBeResolved.splice(rand,1);
							playOne();
						}else{
							log("INCORRECTO",socket);
							log("Fin del examen. Aciertos: ",socket);
							biglog(score,socket,'yellow');
							rl.prompt();
						}
					});
				})
				.catch(error => {
					errorlog(error.message,socket);
				})
				.then(() => {
					rl.prompt();
				});
			}
	    }
	    playOne();
    });    
};




//FUNCIONA
/**
 * Muestra los nombre de los autores de la práctica.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.creditsCmd = (rl,socket) => {
    log('Autores de la práctica: ',socket);
    log('   Jose Ignacio Villegas Villegas',socket);
    log('   Raul Luengo Ximenez-Cruz',socket);
    rl.prompt();
};


//FUNCIONA
/**
 * Terminar el programa.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.quitCmd = (rl) => {
    rl.close();
    socket.end();
};