//assignment of clear playing field reference, position 0 in the upper left, and moving left to right, with final position 8 in lower right
const newField = [0, 1, 2, 3, 4, 5, 6, 7, 8];
//assignment of constants for element targeting
const banners = document.querySelector('.banners'); //targets main banner
const table = document.querySelector('table'); //targets entire playing field
const blocks = document.querySelectorAll('td'); //targets all nine playing blocks
const xButton = document.querySelector('#x'); //targets select X button 
const oButton = document.querySelector('#o'); //targets select O button
const h2 = document.querySelector('h2'); //targets final message
const resetButton = document.querySelector('#reset') //targets reset banner
//initializes global variables
let user = '', machine = '', player = 'user', field = [...newField];
//initializes game play on page load 
init();

function init() {
	assign(); //calls assign() when game loads
}
//adds function to letter selection buttons and playing squares
function assign() {
	//adds click event listener to reset button and calls reset() on event
	resetButton.addEventListener('click', function() {reset();});
	//targets Xs and Os selection buttons
	const buttons = document.querySelectorAll('.buttons');
	//adds click event listener to Xs and Os buttons 
	buttons.forEach(function(el) {
		el.addEventListener('click', function() {
			//assigns either X or O to user based on selection
			user = this.value;
			//assigns the machine the other letter for play
			if (user === 'X') {machine = 'O';} else {machine = 'X';}
			//removes letter selection buttons and shows reset button
			xButton.style.display = 'none';
			oButton.style.display = 'none';
			resetButton.style.display = 'inline-block';
			//assigns click event listener to all nine playing squares and passes event to selectBlock when clicked
			blocks.forEach(function(el) {
				el.addEventListener('click', selectBlock);
			});
		});
	});
}
//reset function
function reset() {
	//reinitializes global variables
	user = '', machine = '', player = '', field = [...newField];
	table.style.backgroundColor = '#2a2a2a'; //resets initial board color
	banners.style.display = 'block'; //displays title banner
	resetButton.style.display = 'none'; //hides reset button
	xButton.style.display = 'inline-block'; //displays X selection button
	oButton.style.display = 'inline-block'; //displays O selection button
	h2.style.display = 'none'; ; //hides final results element
	h2.innerText = ''; // clears final results text
	blocks.forEach(function(el) { 
		//clears inner text (playing moves) and removes event listener from each block on board
		el.style.backgroundColor = '#2a2a2a';
		el.innerText = '';
		el.removeEventListener('click', selectBlock);
	});
}
//when user clicks block, receives event information
function selectBlock(event) {
	player = user; //sets player to user
	event.target.innerText = player; //places player move on board
	field[event.target.id] = player; //assigns letter value of move to playing field array
	blocks[event.target.id].removeEventListener('click', selectBlock); //removes event listener on block
	//checks for win, then checks for tie via function call, then calls machinePlays() if no win or tie
	if (!checkWin(field, player, 'user', false) && !checkTie(field, false)) {machinePlays();}
}
//main machine play function
function machinePlays() {
	player = machine; //sets player to machine
	let x; //initializes x for use as block number identifier for machine move
	//gets indices in playing field that have not been played by calling getEmpty function and assigns returned array to to empty variable
	let empty = getEmpty(field);
	//logic to dictate first machine move
	if ((empty.length === 8) && (field[4] === user)) {
		x = 0; // if user has taken the middle block, machine takes the corner
	} 	else if (empty.length === 8) {
		x = 4; //else the machine takes the middle block
		//patch for slight flaw in AI that allows for a set of specific moves that allows user win
	}	else if (empty.length === 6 && field[1] === user && field[3] === user) {
		x = 0;
	} 	else {
		//else calls computeMove(), passing the current field and zero depth level of play being examined 
		x = (computeMove(field, 0).index); //returns move in object and assigns x as the index of this move
		//if the move is not a terminal move (win or tie) calls checkRowsColumns(), and if it returns a number, assigns this as the machine move
		if (!terminal(x) && (typeof checkRowsColumns(field) === 'number')) {
			x = checkRowsColumns(field);
		}
	}
	//assigns move to the field array, adds move to board, removes event listener from block, and checks win and tie
	field[x] = player;
	blocks[x].innerText = player;
	blocks[x].removeEventListener('click', selectBlock);
	if (!checkWin(field, player, 'machine', false)) {checkTie(field, false);}
}
//returns an array of empty field positions
function getEmpty(testField) {
	let task = []; //initializes local variable for returned array
	testField.forEach(function(el, i) { //pushes each field index that is a number (has not been played)
		if (typeof el === 'number') {task.push(i);}
	});
	return(task); //returns array
}
//main function for computing machine move, accepting the current field being examined and the depth level being examined
function computeMove(current, d) {
	let depth = d + 1; //adds one level to the depth of examination, initially set at 0, so it increases for successive recursion
	let subject = ''; //initializes local variable for the player being computed for
	if (depth % 2 !== 0) {subject = machine;} //machine is player for odd numbered depth
	else {subject = user;} //else is user if even number depth
	let empty = getEmpty(current); //gets empty indices 
	let arr = [...empty]; //initializes a test array, using spread operator on global empty variable
	let scores = []; //initializes a local variable to collect score results of analysis
	//loops over current empty indices
	for (let i = 0; i < empty.length; i++) {
		arr[i] = [...current]; //initializes new array for each move using spread operator
		arr[i][empty[i]] = subject; //assigns player examined to move
		let w = checkWin(arr[i], subject, null, true, empty[i], depth); //checks win
		let t = checkTie(arr[i], true, empty[i]); //checks tie
		if (w) {scores.push(w);} //pushes any winning score (-10 or 10) to score array
	    else if (t) {scores.push(t);} //pushes any tie score (0) to array
	}
	if (scores[0] === undefined) { //if no terminal moves, initializes new array
		arr = [...empty];
		//loops over every empty space and assigns move to player in a new array
		for (let i = 0; i < empty.length; i++) {
			arr[i] = [...current];
			arr[i][empty[i]] = subject;
		    scores.push(computeMove(arr[i], depth)); //recursion checking next level of play with preceding theoretical move
		}
	}
	let best = ''; //initialize variable for best score
	if (subject === user) {best = max(scores);} //assigns best score if user is being examined
	else {best = min(scores);} //assigns best score for machine
	return best; //returns object that includes index of best theoretical move
}
//version of minimax algorithm for maximum score
function max(arr) {
	let highScore = -10000; //initializes high score to exponentially low number
	let selection; //initializes selection variable
	for (i = 0; i < arr.length; i++) { //iterates over array of scores
		//selects highest score in array
		if (arr[i].score > highScore) {highScore = arr[i].score, selection = arr[i];}
	}
	return selection; //returns object of high score and move index
}
//version of minimax algorithm for minimum
function min(arr) { 
	let lowScore = 10000; //initializes low score to exponentially high number
	let selection; //initializes selection variable
	//iterates over array of scores
	for (i = 0; i < arr.length; i++) {
		//selects lowest score
		if (arr[i].score < lowScore) {lowScore = arr[i].score; selection = arr[i];}
	}
	return selection; //returns object of low score and move index
}
//checks if a move is a terminal move, accepting move index as argument
function terminal(x) {
	const player = [machine, user];
	let temp = [...field]; //assigns temp using spread operator on global field variable (current board array) 
	for (let i = 0; i < 2; i++) {
		temp[x] = player[i]; //checks if move is a win for each player
		if (checkWin(temp, player[i], null, true, x)) {return true;} //returns true if terminal
	}
	return false //else returns false
}
//check if machine occupies an otherwise empty row or column on it's move in order to maximize aggressive nature of machine play
function checkRowsColumns(testField) {
	//constant for rows and columns
	const rowsColumns = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8]];
	let arr = getMachine(testField); //calls getMachine() to return an array of all indices occupied by machine player
	let move; //initializes move variable
	//iterates over array if machine moves are between one and three in aggregate (number of moves)
	if (arr.length >= 1 && arr.length <= 3) {
		arr.forEach(function(el) {
			//iterates over each array in rowsColumns and checks if that three block field is only occupied by a single machine move 
			for (let i = 0; i < rowsColumns.length; i++) {
				let x = rowsColumns[i].indexOf(el); //checks if machine occupies any of the indices in current row or column
				if (x !== -1) { //if occupied
					let temp = rowsColumns[i]; //assigns temp to be the row or column array determined to be occupied
					temp.splice(x, 1); //removes occupied index
					//checks if index of other two blocks in row or column on the playing field are empty (a number)
					if (typeof testField[temp[0]] === 'number' && typeof testField[temp[1]] === 'number') {move = (temp[1]); return;}
				}
			}
		});
	return move; //if row or column is otherwise empty, returns move index
	}
}
//gets machine moves from playing field, passed in as an argument
function getMachine(testField) {
	let task = []; //initializes array to return indices
	//iterates over current field local variable and pushes those occupied by machine letter to task array
	testField.forEach(function(el, i) {
		if (el === machine) {task.push(i);}
	});
	return(task); //returns results
}
//function to check win, accepting arguments for the current playing field, the player who is being examined, a string of the player examined, true/false for whether it is checking for actual play or predictive win, the index of the move, and the depth of play (unused currently)
function checkWin(testField, subject, who, isAI, move, depth) {
	//constant for winning index combinations
	const wins = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
	let test = []; //initializes an array for player examined current moves
	testField.forEach(function(el, i) {
		//pushes current player positions to array
		if (el === subject) test.push(i); 
	});
	//iterates over every winning combination array in constant
	for (let i = 0; i < wins.length; i++) {
		//iterates over each index of winning array in examination
		for (let j = 0, c = 0; j < wins[i].length; j++) { //also initializes a counter "c"
			if (test.indexOf(wins[i][j]) !== -1) { //if index is present, increments c
				c++;
			}
			//if checking actual game play (not AI) if c === 3 (entire winning combo is occupied by player in question, calls win and passes in string of winner name and the winning array for use in highlighting the winning blocks)
			if (c === 3 && isAI === false) {
				win(who, wins[i]); 
				return true;
			}
			//if AI and a win, returns score object according to whether it is the machine or the player
			else if (c === 3 && isAI === true) {
				//machine win
				if (subject === machine) {return {index: move, score: 10, result: 'terminal'};}
				//user win
				else {return {index: move, score: -10, result: 'terminal'};}
			}
		}
	}
	return false; //else returns false (no win)
}
//checks for a tie (full field and no win) accepting current field, true/false for if it is AI request, and the move index
function checkTie(testField, isAI, move) {
	let empty = getEmpty(testField); //gets empty field indices
	if (empty[0] === undefined && isAI === false) {
		gameTie(); //calls game tie if no empty blocks and is not AI check
		return true;
		//returns object of move and score for AI check
	} 	else if (empty[0] === undefined && isAI === true) {
		return {index: move, score: 0};
	}
	return false; //else returns false if no tie
}
//if win is detected, accepts string of who won, and the winning combination for field highlighting
function win(who, winArr) {
	let text = '', color = ''; //initializes local variables
	resetButton.style.display = 'none'; //hides reset button
	banners.style.display = 'none'; //removes main banners
	//if user win, assigns vars for winning blocks to green, and user win text
	if (who === 'user') {color = '#2ad61d', text = 'YOU WIN!!!';}
	//else if machine wins, assigns red to winning block var and machine win text
	else {color = '#ff2100', text = 'MACHINE WINS!!!';}
	h2.innerText =  text; //sets final message to appropriate winner
	//iterates over winning blocks and colors them as assigned
	winArr.forEach(function(el) {
		blocks[el].style.backgroundColor = color;
	});
	//displays final message
	h2.style.display = 'block';
	//calls reset() on 3.5 sec delay
	setTimeout(function() {
		reset();
	}, 3500);
}
// if game is a tie
function gameTie() {
	resetButton.style.display = 'none'; //hides reset button
	banners.style.display = 'none'; //hides banner
	h2.innerText = 'IT IS A TIE!!!'; // tie final message
	h2.style.display = 'block'; //displays final message
	//iterates over entire field and colors it orange
	blocks.forEach(function(el) {
		el.style.backgroundColor = '#ff7700';
	});
	//calls reset on 3.5 sec delay
	setTimeout(function() {
		reset();
	}, 3500);
}
