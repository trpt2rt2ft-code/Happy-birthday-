/* Lightweight story + mini-games engine
   - Single-file starter MVP implementing:
     - Story intro (json fallback)
     - Riddle Gate, Potion Mixer, Crystal Cake (Simon), Maze, Birthday Board (mini-Sorry)
   - Customize text in storyIntro var or move to story/intro.json later
*/

// ---------- Data ----------
const storyIntro = {
  id: "intro",
  text: `You awaken in a sunlit glade where candles drift like tiny moons. A parchment flutters at your feet: "To claim your birthday gift, brave heart, collect the five Cake Pieces hidden across the realm."`,
  choices: [
    { id: "enter", text: "Accept the Quest" },
    { id: "later", text: "Not yet — peek around" }
  ]
};

// small riddle set
const riddles = [
  { q: "I speak without a mouth and hear without ears. I have nobody, but I come alive with wind. What am I?", opts:["Echo","Shadow","Fire"], a:0 },
  { q: "The more of this there is, the less you see. What is it?", opts:["Fog","Darkness","Smoke"], a:1 },
  { q: "I’m taken from a mine and shut up in a wooden case, from which I am never released, and yet I am used by almost every person. What am I?", opts:["Coal","Pencil lead","Gold"], a:1 }
];

// potion ingredients & correct recipe (ids)
const ingredients = [
  { id: "moon", name: "Moonflower" },
  { id: "honey", name: "Starlit Honey" },
  { id: "ember", name: "Ember Salt" },
  { id: "mint", name: "Mintleaf" },
  { id: "rose", name: "Rose Dew" }
];
const correctPotion = ["moon","honey","rose"]; // order irrelevant

// game state
const state = {
  cakePieces: 0,
  playerName: "Friend",
  cakePiecesNeeded: 5
};

// ---------- helpers for UI ----------
function show(id){ document.getElementById(id).classList.remove('hidden'); }
function hide(id){ document.getElementById(id).classList.add('hidden'); }
function by(id){ return document.getElementById(id); }
function updateCakeCount(){ by('cakeCount').textContent = state.cakePieces; }

// ---------- App init ----------
document.addEventListener('DOMContentLoaded', ()=> {
  // title buttons
  by('instructionsBtn').onclick = ()=> { show('instructions-screen'); hide('title-screen'); };
  by('backToTitle').onclick = ()=> { show('title-screen'); hide('instructions-screen'); };
  by('startBtn').onclick = startAdventure;
  by('toStory').onclick = ()=> { hide('games-screen'); show('story-screen'); };
  by('playerName').oninput = (e)=> { state.playerName = e.target.value || "Friend"; by('playerLabelName').textContent = state.playerName; };

  // game menu
  document.querySelectorAll('.gameBtn').forEach(b=>{
    b.addEventListener('click', ()=> {
      const g = b.dataset.game;
      openGame(g);
    });
  });

  // initial
  updateCakeCount();
});

// ---------- Story ----------
function startAdventure(){
  state.playerName = by('playerName').value || "Friend";
  by('playerLabelName').textContent = state.playerName;
  hide('title-screen');
  show('story-screen');
  renderStory(storyIntro);
}

function renderStory(node){
  by('storyText').textContent = node.text;
  const choicesEl = by('choices');
  choicesEl.innerHTML = '';
  node.choices.forEach(c=>{
    const btn = document.createElement('button');
    btn.className = 'choiceBtn';
    btn.textContent = c.text;
    btn.onclick = ()=> handleChoice(c.id);
    choicesEl.appendChild(btn);
  });
}

function handleChoice(id){
  if(id === 'enter'){
    hide('story-screen');
    show('games-screen');
  } else {
    renderStory({
      text: `You wander a little and find a glittering path that leads to the Riddle Gate. Seems like the realm nudges you onward.`,
      choices: [{ id:'enter', text:'Proceed to the realm' }]
    });
  }
}

// ---------- Game launcher ----------
function openGame(name){
  const area = by('gameArea');
  area.innerHTML = '';
  if(name === 'riddle') { startRiddle(area); }
  else if(name === 'potion') { startPotion(area); }
  else if(name === 'crystal') { startCrystal(area); }
  else if(name === 'maze') { startMaze(area); }
  else if(name === 'board') { startBoard(area); }
}

// ---------- Riddle Gate ----------
function startRiddle(container){
  let idx = 0, correct = 0;
  const box = document.createElement('div');
  box.className = 'riddle';
  const qEl = document.createElement('div');
  const optsEl = document.createElement('div');
  box.appendChild(qEl); box.appendChild(optsEl);
  container.appendChild(box);
  function showQ(){
    const r = riddles[idx];
    qEl.innerHTML = `<h3>Riddle Gate</h3><p>${r.q}</p>`;
    optsEl.innerHTML = '';
    r.opts.forEach((o,i)=>{
      const b = document.createElement('button');
      b.className = 'option';
      b.textContent = o;
      b.onclick = ()=> {
        if(i === r.a){ correct++; b.style.borderColor = 'lime'; }
        else { b.style.borderColor = 'red'; }
        idx++;
        setTimeout(()=>{
          if(idx < riddles.length) showQ();
          else finish();
        },600);
      };
      optsEl.appendChild(b);
    });
  }
  function finish(){
    const earned = correct >= 2; // easy pass
    const msg = earned ? `You lit a Candle of Wisdom! (+1 Cake Piece)` : `The Gate remains stubborn — try again later.`;
    qEl.innerHTML = `<h3>Riddle Gate</h3><p>${msg}</p>`;
    optsEl.innerHTML = `<div class="small">Correct: ${correct}/${riddles.length}</div>
      <div class="btn-row"><button class="btn" id="rDone">Continue</button></div>`;
    document.getElementById('rDone').onclick = ()=> {
      if(earned) awardCake();
      container.innerHTML = '';
    };
  }
  showQ();
}

// ---------- Potion Mixer ----------
function startPotion(container){
  const box = document.createElement('div');
  box.innerHTML = `<h3>Potion Mixer</h3><p>Drag ingredients into the cauldron. Create the birthday potion!</p>`;
  const grid = document.createElement('div'); grid.className='grid-ingredients';
  ingredients.forEach(it=>{
    const el = document.createElement('div');
    el.draggable = true;
    el.className = 'ingredient';
    el.id = 'ing-' + it.id;
    el.textContent = it.name;
    el.ondragstart = e => { e.dataTransfer.setData('text/plain', it.id); };
    grid.appendChild(el);
  });
  const cauld = document.createElement('div');
  cauld.className = 'cauldron';
  cauld.id = 'cauldron';
  cauld.ondragover = e => e.preventDefault();
  cauld.ondrop = e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    addToCauldron(id);
  };
  const list = document.createElement('div'); list.id='cauldList'; list.className='small';
  box.appendChild(grid); box.appendChild(cauld); box.appendChild(list);
  container.appendChild(box);
  let added = [];
  function addToCauldron(id){
    if(added.includes(id)) return;
    added.push(id);
    document.getElementById('cauldList').textContent = 'In cauldron: ' + added.join(', ');
    if(added.length >= 3){
      checkPotion();
    }
  }
  function checkPotion(){
    const ok = correctPotion.every(k=> added.includes(k)) && added.length === correctPotion.length;
    const res = document.createElement('div');
    res.className = 'small';
    res.textContent = ok ? 'The potion blooms with sparkles — success! (+1 Cake Piece)' : 'The mixture fizzes but fails to form the birthday potion.';
    box.appendChild(res);
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Finish';
    btn.onclick = ()=> { if(ok) awardCake(); container.innerHTML = ''; };
    box.appendChild(btn);
  }
}

// ---------- Crystal Cake (Simon-style) ----------
function startCrystal(container){
  const colors = ['red','green','blue','yellow'];
  let sequence = [], playerIdx = 0, playing = false;
  const box = document.createElement('div');
  box.innerHTML = `<h3>Crystal Cake</h3><p>Watch and repeat the glowing pattern.</p>`;
  const simon = document.createElement('div'); simon.className='simon';
  colors.forEach(c=>{
    const b = document.createElement('button');
    b.className = c;
    b.dataset.color = c;
    b.onclick = ()=> { if(!playing) handlePress(c); };
    simon.appendChild(b);
  });
  const status = document.createElement('div'); status.className='small';
  const start = document.createElement('button'); start.className='btn'; start.textContent='Start Round';
  start.onclick = ()=> { nextRound(); };
  box.appendChild(simon); box.appendChild(status); box.appendChild(start);
  container.appendChild(box);

  function flashButton(col){
    const btn = [...simon.children].find(b=>b.dataset.color===col);
    btn.style.filter = 'brightness(1.5)';
    setTimeout(()=> btn.style.filter='', 400);
  }
  function playSequence(){
    playing = true;
    let i=0;
    const t = setInterval(()=>{
      flashButton(sequence[i]);
      i++;
      if(i>=sequence.length){ clearInterval(t); playing=false; }
    }, 600);
  }
  function nextRound(){
    sequence.push(colors[Math.floor(Math.random()*colors.length)]);
    playerIdx = 0;
    status.textContent = `Sequence length: ${sequence.length}. Repeat it!`;
    playSequence();
  }
  function handlePress(col){
    if(playing) return;
    if(col === sequence[playerIdx]){
      playerIdx++;
      if(playerIdx === sequence.length){
        // player completed
        if(sequence.length >= 4){
          status.textContent = 'You mastered the cake pattern! (+1 Cake Piece)';
          awardCake(); setTimeout(()=> container.innerHTML='', 800);
        } else {
          status.textContent = 'Correct — next round!';
          setTimeout(nextRound, 600);
        }
      } else {
        status.textContent = `Good — progress ${playerIdx}/${sequence.length}`;
      }
    } else {
      status.textContent = 'Pattern failed. Try again from start.';
      sequence = [];
    }
  }
}

// ---------- Maze of Wishes ----------
function startMaze(container){
  const rows = 7, cols = 9;
  let player = { r: 3, c: 2 };
  // place a clue target
  const target = { r: 1, c: 7 };
  const box = document.createElement('div');
  box.innerHTML = `<h3>Maze of Wishes</h3><p>Use arrow keys to reach the glowing letter.</p>`;
  const maze = document.createElement('div'); maze.className = 'maze';
  box.appendChild(maze);
  const hint = document.createElement('div'); hint.className='small'; box.appendChild(hint);
  container.appendChild(box);

  function render(){
    maze.innerHTML = '';
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const cell = document.createElement('div'); cell.className='cell';
        if(r===player.r && c===player.c){ cell.textContent = '★'; cell.classList.add('player'); }
        else if(r===target.r && c===target.c){ cell.textContent='♡'; cell.style.color='#ffd27b'; }
        maze.appendChild(cell);
      }
    }
    hint.textContent = `Position: ${player.r},${player.c}`;
  }
  function move(dr,dc){
    player.r = Math.max(0, Math.min(rows-1, player.r+dr));
    player.c = Math.max(0, Math.min(cols-1, player.c+dc));
    render();
    if(player.r===target.r && player.c===target.c){
      hint.textContent = 'You found the Wish Letter! (+1 Cake Piece)';
      awardCake(); document.removeEventListener('keydown', keyHandler);
      setTimeout(()=> container.innerHTML='', 900);
    }
  }
  function keyHandler(e){
    if(e.key === 'ArrowUp') move(-1,0);
    if(e.key === 'ArrowDown') move(1,0);
    if(e.key === 'ArrowLeft') move(0,-1);
    if(e.key === 'ArrowRight') move(0,1);
  }
  document.addEventListener('keydown', keyHandler);
  render();
}

// ---------- Birthday Board (mini-Sorry) ----------
function startBoard(container){
  // simplified track of 20 spaces + 4 tokens each player; first to finish wins
  const box = document.createElement('div');
  box.innerHTML = `<h3>Birthday Board</h3><p>Roll the die and move your token. Bump others back to start to steal their cake cheer!</p>`;
  const board = document.createElement('div'); board.className='board';
  const boardSize = 20;
  let spaces = new Array(boardSize).fill(null); // store token owner id or null

  // tokens: p = player, a,b,c = bots
  const tokens = {
    p: { pos: -1, home:true, finished:false },
    a: { pos: -1, home:true, finished:false },
    b: { pos: -1, home:true, finished:false },
    c: { pos: -1, home:true, finished:false }
  };
  const order = ['p','a','b','c']; // play order
  let turn = 0;

  // UI
  const boardSpaces = [];
  for(let i=0;i<boardSize;i++){
    const s = document.createElement('div'); s.className='space'; s.dataset.i = i;
    board.appendChild(s); boardSpaces.push(s);
  }
  const status = document.createElement('div'); status.className='small';
  const rollBtn = document.createElement('button'); rollBtn.className='btn'; rollBtn.textContent='Roll Die';
  const finishBtn = document.createElement('button'); finishBtn.className='btn'; finishBtn.textContent='End Game';
  finishBtn.onclick = ()=> { container.innerHTML=''; };

  box.appendChild(board); box.appendChild(status); box.appendChild(rollBtn); box.appendChild(finishBtn);
  container.appendChild(box);

  function render(){
    boardSpaces.forEach((s,i)=>{
      s.innerHTML = '';
      for(const id of ['p','a','b','c']){
        if(tokens[id].pos === i && !tokens[id].home && !tokens[id].finished){
          const t = document.createElement('div');
          t.className = 'token ' + (id==='p'?'p': id==='a'?'a': id==='b'?'b':'c');
          t.textContent = id.toUpperCase();
          s.appendChild(t);
        }
      }
    });
    // show homes as small legend
    status.innerHTML = `Turn: ${order[turn].toUpperCase()} — ${state.playerName === "Friend" ? "Player" : state.playerName}`;
  }

  function rollDie(){ return Math.floor(Math.random()*6) + 1; }

  function moveToken(id,steps){
    // if at home (-1), need a 6 to start
    if(tokens[id].home){
      if(steps === 6){
        tokens[id].home = false;
        tokens[id].pos = 0;
      } else {
        return false;
      }
    } else {
      tokens[id].pos += steps;
      if(tokens[id].pos >= boardSize){
        tokens[id].finished = true;
        tokens[id].pos = -2; // finished off-board
      }
    }
    // bump others
    for(const other in tokens){
      if(other !== id && tokens[other].pos === tokens[id].pos && tokens[other].pos >=0 && !tokens[other].finished){
        // send other to home
        tokens[other].home = true; tokens[other].pos = -1;
      }
    }
    return true;
  }

  rollBtn.onclick = ()=> {
    const current = order[turn];
    const roll = rollDie();
    status.textContent = `${current.toUpperCase()} rolled a ${roll}.`;
    // for bots: simple AI
    if(current !== 'p'){
      const made = moveToken(current, roll);
      setTimeout(()=> {
        render();
        checkFinish();
        nextTurn(roll);
      }, 500);
    } else {
      // player turn
      const moved = moveToken('p', roll);
      render();
      checkFinish();
      nextTurn(roll);
    }
  };

  function checkFinish(){
    if(tokens.p.finished){
      status.textContent = 'You guided your token to the finish! You are celebrated with the final Cake Piece! (+1 Cake Piece)';
      awardCake(); setTimeout(()=> container.innerHTML='', 900);
    }
  }

  function nextTurn(roll){
    // if roll 6, same player goes again; otherwise next
    if(roll !== 6) turn = (turn + 1) % order.length;
    render();
  }

  render();
}

// ---------- award cake piece ----------
function awardCake(){
  if(state.cakePieces >= state.cakePiecesNeeded) return;
  state.cakePieces++;
  updateCakeCount();
  // small celebration animation (text)
  const top = document.createElement('div'); top.className='small'; top.textContent='✨ You collected a Cake Piece! ✨';
  const area = by('gameArea');
  if(area) area.appendChild(top);
  // auto-open board when all pieces collected
  if(state.cakePieces >= state.cakePiecesNeeded){
    setTimeout(()=> {
      alert('All Cake Pieces gathered — the Birthday Board finale is unlocked!');
      // reveal board in UI
      // optionally auto-open
    }, 400);
  }
}
