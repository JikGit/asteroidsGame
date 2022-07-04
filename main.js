const FRAME_RATE = 40;
//possono cambiare se resize della window
let winWidth = window.innerWidth;
let winHeight = window.innerHeight;

const SPAN_WIDTH = 200;
const SPAN_HEIGHT = 200;

const PLAYER_COLOR = "#0000ff";
const ENEMY_COLOR = "#ff0000";
const BULLET_COLOR = "#ffffff";
const PARTICLES_COLOR = "#ff00ff";

const START_X = 500;
const START_Y = 500;
const LEN_BASE = 80;
const LEN_ALTEZZA = LEN_BASE*1.15;
const PLAYER_VEL = 10;

const ENEMY_RADIUS= 25;
const ENEMY_SPAWNING_TIME = 1; //secondi per far spownare enemy
const ENEMY_VEL = 5;

const BULLET_RADIUS = 5;
const BULLET_VEL = 15;
const BULLET_RELOAD = 0.2; //secondi dallo spawn di un bullet all'altro

const PARTICLES_MAX = 5;
const PARTICLES_MIN = 2;
const PARTICLES_MIN_RADIUS = 5;
const PARTICLES_MAX_RADIUS = 15;
const PARTICLES_MAX_DURATION = 1; //secondi massimi
const PARTICLES_MIN_DURATION = 0.5; //secondi minimi
const PARTICLES_MIN_VEL = 5; //velocita' minima
const PARTICLES_MAX_VEL = 10; //velocita' massima

let bulletArr = [];
let enemyArr = [];
let particlesArr = [];
let enemyCountTime = 0; //conta i secondi dallo spawn di un enemy all'altro
let bulletSpawnTime = 0; //conta fino al bullet_reload e dopo si puo' risparare
let delayStart = false;

let player = {
	x1: START_X,
	y1: START_Y,
	x2: START_X + LEN_BASE,
	y2: START_Y,
	x3: START_X + LEN_BASE / 2,
	y3: START_Y - LEN_ALTEZZA,
	centerX: NaN,
	centerY: NaN,
	lifeHeart: 5,
}

function setup(){
	frameRate(FRAME_RATE);
	createCanvas(winWidth, winHeight);
}

function draw(){
	//player
	rotatePlayer(player);
	isPlayerMoving(player);
	isPlayerShooting(player, bulletArr);
	checkForEnemyHit(player, enemyArr);
	checkForBulletHit(bulletArr, enemyArr, particlesArr);
	moveBullet(bulletArr)

	//enemy
	checkSpawnEnemy(enemyArr);
	moveEnemy(enemyArr, player);

	//particles
	moveParticles(particlesArr);
	checkParticlesDeath(particlesArr);

	//draw
	background("#191919");
	noStroke();
	drawEnemy(enemyArr);
	drawBullet(bulletArr);
	drawTriangle(player);
	drawParticles(particlesArr);
}

function rotatePlayer(player){
	let {x1,y1, x2,y2, x3,y3} = player;

	let centerX = (x1 + x2 + x3)/3;
	let centerY = (y1 + y2 + y3)/3;
	player.centerX = centerX;
	player.centerY = centerY;

	let s = Math.atan2(mouseY - centerY, mouseX - centerX) - Math.atan2(y3-centerY, x3-centerX);

	player.x1 = centerX + Math.cos(s) * (x1-centerX) - Math.sin(s) * (y1 - centerY)
	player.y1 = centerY + Math.sin(s) * (x1-centerX) + Math.cos(s) * (y1 - centerY)

	player.x2 = centerX + Math.cos(s) * (x2-centerX) - Math.sin(s) * (y2 - centerY)
	player.y2 = centerY + Math.sin(s) * (x2-centerX) + Math.cos(s) * (y2 - centerY)

	player.x3 = centerX + Math.cos(s) * (x3-centerX) - Math.sin(s) * (y3 - centerY)
	player.y3 = centerY + Math.sin(s) * (x3-centerX) + Math.cos(s) * (y3 - centerY)

}


function isPlayerMoving(player){
	// Destra, se premo d
	if (keyIsDown(68)) updatePlayerPos(player, PLAYER_VEL, 0);
	// Sinistra, se premo a
	if (keyIsDown(65)) updatePlayerPos(player, -PLAYER_VEL, 0);
	// Indietro, se premo s
	if (keyIsDown(83)) updatePlayerPos(player, 0, PLAYER_VEL);
	// Avanti, se premo w
	if (keyIsDown(87)) updatePlayerPos(player, 0, -PLAYER_VEL);
}

function isPlayerShooting(player, bulletArr){
	// Se premo tasto sinistro
	if (mouseIsPressed === true) {
		if (mouseButton === LEFT && bulletSpawnTime == 0){
			delayStart = true;
			spawnBullet(player.x3, player.y3, mouseX, mouseY, bulletArr);
		}
	}
	if (delayStart){
		bulletSpawnTime++;
		if (bulletSpawnTime == FRAME_RATE * BULLET_RELOAD){
			delayStart = false;
			bulletSpawnTime = 0;
		}
	}
}

function updatePlayerPos(player, addX, addY){
	player.x1 += addX;
	player.x2 += addX;
	player.x3 += addX;

	player.y1 += addY;
	player.y2 += addY;
	player.y3 += addY;
}

function spawnBullet(x, y, dirX, dirY, bulletArr){
	let bullet = {
		x: x,
		y: y,
		dirX: dirX,
		dirY: dirY,
		angle: Math.atan2(dirX - x, dirY - y),
	}
	bulletArr.push(bullet);
}

//copied from geeksforgeeks
function circleCollide(x1, y1, x2, y2, r1, r2){
		let distSq = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
		let radSumSq = (r1 + r2) * (r1 + r2);
		if (distSq <= radSumSq)
			return 1;
		else
			return 0;
}

function checkForEnemyHit(player, enemyArr){
	enemyArr.forEach(enemy => {
		let indexEnemy = 0;
		if (circleCollide(player.centerX, player.centerY, enemy.x, enemy.y, LEN_BASE/2, ENEMY_RADIUS)){
			enemyArr.splice(indexEnemy, 1);
		}
		indexEnemy++;
	})

}

function checkForBulletHit(bulletArr, enemyArr, particlesArr){
	let indexBull = 0
	bulletArr.forEach(bullet => {
		let indexEnemy = 0;
		enemyArr.forEach(enemy => {
			//se bullet colpiscono gli enemy
			if (circleCollide(bullet.x , bullet.y , enemy.x, enemy.y, BULLET_RADIUS, ENEMY_RADIUS)){
				enemyArr.splice(indexEnemy, 1);
				makeParticles(enemy.x, enemy.y, particlesArr);
			}
			indexEnemy++;
		})
		indexBull++;
	})

}

function moveBullet(bulletArr){
	bulletArr.forEach(bullet => {
		bullet.x += Math.sin(bullet.angle) * BULLET_VEL;
		bullet.y += Math.cos(bullet.angle) * BULLET_VEL;
		//se bullet fuori mappa
		if (bullet.x > winWidth || bullet.x < 0 || bullet.y > winHeight || bullet.y < 0) bulletArr.splice(bulletArr.indexOf(bullet), 1);
	})
}

function addEnemy(enemyArr){
	let x,y;
	//se vero lo metto a destra o sinistra
	if (Math.random() > 0.5){
		x = Math.random() * SPAN_WIDTH;
		//destra
		if (Math.random() > 0.5) x+= winWidth;
		//sinistra
		else x -= SPAN_WIDTH;
		y = (Math.random() * winHeight + SPAN_HEIGHT * 2) - SPAN_HEIGHT;
	//altrimenti su o giu'
	}else{
		y = Math.random() * SPAN_HEIGHT;
		//giu'
		if (Math.random() > 0.5) y+= winHeight;
		//su
		else y -= SPAN_HEIGHT;
		x = (Math.random() * winWidth + SPAN_WIDTH * 2) - SPAN_WIDTH;
	}

	let enemy = {
		x: x,
		y: y,
	}
	enemyArr.push(enemy);
}

function checkSpawnEnemy(enemyArr){
	enemyCountTime++;
	if (enemyCountTime == ENEMY_SPAWNING_TIME * FRAME_RATE) {
		enemyCountTime = 0;
		addEnemy(enemyArr);
	}
}


function moveEnemy(enemyArr, player){
	enemyArr.forEach(enemy => {
		let angle = Math.atan2(player.centerX - enemy.x, player.centerY - enemy.y);
		enemy.x += Math.sin(angle) * ENEMY_VEL;
		enemy.y += Math.cos(angle) * ENEMY_VEL;
	});
}

function makeParticles(x, y, particlesArr){
	let nBalls = Math.random() * (PARTICLES_MAX - PARTICLES_MIN) + PARTICLES_MIN;
	for (let i = 0; i < nBalls; i++){
		let node = {
			x: x,
			y: y,
			radius: Math.random() * (PARTICLES_MAX_RADIUS - PARTICLES_MIN_RADIUS) + PARTICLES_MIN_RADIUS,
			vel: Math.random() * (PARTICLES_MAX_VEL - PARTICLES_MIN_VEL) + PARTICLES_MIN_VEL,
			duration: Math.random() * (PARTICLES_MAX_DURATION - PARTICLES_MIN_DURATION) + PARTICLES_MIN_DURATION, //secondi
			lifeDuration: 0,
			angle: Math.random() * 360,
			color: PARTICLES_COLOR,
			trasparency: "00",
		}
		particlesArr.push(node);
	}
}

function moveParticles(particlesArr){
	particlesArr.forEach(particle => {
		particle.x += Math.sin(particle.angle) * particle.vel;
		particle.y += Math.cos(particle.angle) * particle.vel;
		particle.trasparency = int(255 * (particle.duration - particle.lifeDuration / FRAME_RATE) / particle.duration).toString(16);
		//se trasparency e' un numero solo (ne servono due) aggiungo uno zero prima del numero stesso
		particle.trasparency.length === 1 ? particle.trasparency = "0" + particle.trasparency : NaN;
	})
}


function checkParticlesDeath(particlesArr){
	let index = 0; particlesArr.forEach(particle => { 
		particle.lifeDuration++;
		if (particle.lifeDuration > particle.duration * FRAME_RATE){
			particlesArr.splice(index, 1);
		}
		index++;
	})
}


//draw functions
function drawTriangle(player){
	fill(PLAYER_COLOR);
	triangle(player.x1, player.y1, player.x2, player.y2, player.x3, player.y3);
}

function drawEnemy(enemyArr){
	fill(ENEMY_COLOR);
	enemyArr.forEach(enemy => {
		circle(enemy.x, enemy.y, ENEMY_RADIUS*2);
	})
}

function drawBullet(bulletArr){
	bulletArr.forEach(bullet => {
		fill(BULLET_COLOR);
		circle(bullet.x, bullet.y, BULLET_RADIUS*2);
	})

}

function drawParticles(particlesArr){
	particlesArr.forEach(particle => {
		fill(particle.color + particle.trasparency);
		circle(particle.x, particle.y, particle.radius * 2);
	})
}



//se resizo cambio la width/height
window.addEventListener("resize", () => {
	winWidth = window.innerWidth;
	winHeight = window.innerHeight;
	setup();
});
