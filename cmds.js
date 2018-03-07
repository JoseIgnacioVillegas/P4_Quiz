const {models} = require('./model');
const {log, biglog, errorlog, colorize} = require('./out');

/**
 * Muestra la ayuda
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */

exports.helpCmd = rl => {
    log("Comandos:");
    log("   h|help - Muestra esta ayuda.");
    log("   list - Listar los quizzes existentes.");
    log("   show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
    log("   add - Añadir un nuevo quiz interactivamente.");
    log("   delete <id> - Borrar el quiz indicado.");
    log("   edit <id> - Editar el quiz indicado.");
    log("   test <id> - Probar el quiz indicado.");
    log("   p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("   credits - Créditos.");
    log("   q|quit - Salir del programa.");
    rl.prompt();
};


/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.listCmd = rl => {
    models.quiz.findAll()
    .each(quiz => {
			log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
    })
    .catch(error => {
    	errorlog(error.message);
    })
    .then(() => {
    	rl.prompt();
    });
};


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



/**
 * Muestra el quiz indicado en el parámetro: la pregunta y la respuesta
 *
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a mostrar
 */
exports.showCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz =>{
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id= ${id}.`);
		}
		log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};
 
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
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};


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
exports.addCmd = rl => {
	makeQuestion(rl, 'Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, 'Introduzca una pregunta: ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then(quiz => {
		return models.quiz.create(quiz);
	})
	.then((quiz) => {
		log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('EL quiz es erroneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/**
 * Borra un quiz del modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};


/**
 * Edita un quiz del modelo.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl,id) => {
	const quiz1 = models.quiz.findById(id);
	const pregunta = quiz1.question;
	const respuesta = quiz1.answer;

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if(!quiz) {
			throw new Error(`No existe un quiz asociado al id= ${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
			return makeQuestion(rl, 'Introduzca la respuesta ')
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
		log(`Se ha cambiado el quiz '[${colorize(quiz.id, 'magenta')}] ${pregunta} ${colorize('=>', 'magenta')} ${respuesta}' por: '[${colorize(id, 'magenta')}] ${question} ${colorize('=>', 'magenta')} ${answer}'`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('EL quiz es erroneo: ');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};



// SIN HACER
/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 * @param id Clave del quiz a probar
 */
exports.testCmd = (rl,id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		pregunta = quiz.question;
		makeQuestion(rl, pregunta + '?')
		.then(a => {
			if ( a.toLocaleLowerCase() === quiz.answer.toLocaleLowerCase()){
					log("La respuesta es correcta.", 'green');
					biglog('Correcta', 'green');
					rl.prompt();
				}else{
					log("La respuesta es incorrecta.", 'green');
					biglog('Incorrecta', 'red');
					rl.prompt();
				}
		});
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});

/*


	if (typeof id === "undefined") {
		errorlog("Falta el parámetro id.");
		rl.prompt();
	}else{	
		try{
			const quiz = model.getByIndex(id);
			const pregunta = quiz.question;
			rl.question(colorize(pregunta + '?', 'red'), answer =>{
				const resp = answer.toLocaleLowerCase().trim();
				
				if ( resp === quiz.answer.toLocaleLowerCase()){
					log("La respues es correcta.", 'green');
					biglog('Correcta', 'green');
					rl.prompt();
				}else{
					log("La respues es incorrecta.", 'green');
					biglog('Incorrecta', 'red');
					rl.prompt();
				}
			});

		}catch(error){
			errorlog(error.message);
			rl.prompt();
		}
	}
	*/


};






//SIN HACER
/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 * @param rl	Objeto readline usado para implementar el CLI
 */


exports.playCmd = rl => {
	var cuenta = 1;
	var toBeResolved = [];
	var score = 0;
	models.quiz.findAll()
    .each(quiz => {
		toBeResolved[cuenta-1] = cuenta;
		cuenta = cuenta +1 ;
    })
    .then(() => {
	    const playOne = ()=> {
			if ( toBeResolved.length == 0){
				console.log("No hay nada más que preguntar.");
				console.log("Fin del examen. Aciertos: ");
				biglog(score, 'red');
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
						console.log(a);
						if ( a.toLocaleLowerCase() === quiz.answer.toLocaleLowerCase()){
							score++;
							console.log("CORRECTO - Lleva "+ score + "aciertos.") 
							toBeResolved.splice(rand,1);
							playOne();
						}else{
							console.log("INCORRECTO");
							console.log("Fin del examen. Aciertos: ");
							biglog(score,'yellow');
							rl.prompt();
						}
					});
				})
				.catch(error => {
					errorlog(error.message);
				})
				.then(() => {
					rl.prompt();
				});
			}
	    }
	    playOne();
    });
/*
    .catch(error => {
    	errorlog(error.message);
    }).then(() => {
		rl.prompt();
	});

*/













/*

	let score = 0;
	var toBeResolved = []; // array que guarda ids de todas las preguntas que existen

	var cuenta = 0;


	//console.log(models.quiz.findAll());
	//console.log(models.quiz.findAll().length);
	models.quiz.findAll().each(quiz => {
    	//console.log("Antes: " + cuenta);
		toBeResolved[cuenta] = cuenta;
		cuenta++;
		//console.log("Después: " +cuenta);
		//console.log(toBeResolved);
		//playOne();
    });
    console.log(toBeResolved);
*/

    /*
    .catch(error => {
    	errorlog(error.message);
    });
    console.log(toBeResolved);
*/







/*

	let todos = [models.quiz.findAll()] ; 
	console.log(todos);
	var cuenta = todos.length;
	console.log(cuenta);
	while (cuenta>0) {
    	toBeResolved[cuenta-1] = cuenta-1;
    	cuenta--; 
  	}
*/

  	


    
};





/**
 * Muestra los nombre de los autores de la práctica.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.creditsCmd = rl => {
    log('Autores de la práctica: ');
    log('   Jose Ignacio Villegas Villegas');
    log('   Raul Luengo Ximenez-Cruz');
    rl.prompt();
};



/**
 * Terminar el programa.
 *
 * @param rl	Objeto readline usado para implementar el CLI
 */
exports.quitCmd = rl => {
    rl.close();
};