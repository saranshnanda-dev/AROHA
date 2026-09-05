import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

const EMOJIS = ['🍎','🐶','🚗','⭐','🌸','🐟','🎈','🌻','🚀','💎','🔔','🧩','🍉','🦋','🎸','⚽','🌞','🌙'];
const COLORS = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-400'];

export default function Games({ token, gameId, initialDiff = 'Easy', onBack, t, hc }: any) {
  const [activeGame, setActiveGame] = useState<string | null>(gameId === 'select' ? null : gameId);
  const [difficulty, setDifficulty] = useState<string>(initialDiff);
  const [gameState, setGameState] = useState<string>('intro');
  const [score, setScore] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  
  const [cards, setCards] = useState<{ id: number; emoji: string }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [showNumber, setShowNumber] = useState<boolean>(false);
  
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSeqIndex, setUserSeqIndex] = useState<number>(0);
  const [flashing, setFlashing] = useState<number | null>(null);
  
  const [pattern, setPattern] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState<string | null>(null);

  useEffect(() => {
    if (activeGame && gameState === 'intro') {
      setScore(0); setMoves(0); setMatched([]); setFlipped([]); setUserInput('');
    }
  }, [activeGame, gameState]);

  const startGame = () => {
    setGameState('playing'); setStartTime(Date.now());
    if (activeGame === 'Memory Match') {
      const pairs = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 6 : 9;
      setTotal(pairs);
      const deck = [...EMOJIS.slice(0, pairs), ...EMOJIS.slice(0, pairs)].map((emoji, id) => ({ id, emoji })).sort(() => Math.random() - 0.5);
      setCards(deck);
    } else if (activeGame === 'Number Recall') {
      const digits = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 5 : 7;
      setTotal(1);
      setTargetNumber(Math.floor(Math.random() * Math.pow(10, digits)).toString().padStart(digits, '0'));
      setShowNumber(true); setTimeout(() => setShowNumber(false), difficulty === 'Hard' ? 2000 : 3500);
    } else if (activeGame === 'Sequence Recall') {
      const len = difficulty === 'Easy' ? 3 : difficulty === 'Medium' ? 5 : 7;
      setTotal(len);
      const newSeq = Array.from({length: len}, () => Math.floor(Math.random() * 4));
      setSequence(newSeq); playSequence(newSeq);
    } else if (activeGame === 'Pattern Recognition') {
      setTotal(1); const shapes = ['🔴', '🔵', '🟢', '🟡'];
      let p: string[] = [], ans = '';
      if (difficulty === 'Easy') { p = [shapes[0], shapes[1], shapes[0], shapes[1]]; ans = shapes[0]; }
      else if (difficulty === 'Medium') { p = [shapes[0], shapes[0], shapes[1], shapes[0], shapes[0]]; ans = shapes[1]; }
      else { p = [shapes[0], shapes[1], shapes[2], shapes[0], shapes[1]]; ans = shapes[2]; }
      setPattern(p); setCorrectOption(ans); setOptions([...shapes].sort(() => Math.random() - 0.5));
    }
  };

  const playSequence = async (seq: number[]) => {
    setUserSeqIndex(0); await new Promise(r => setTimeout(r, 500));
    for (let i = 0; i < seq.length; i++) {
      setFlashing(seq[i]); await new Promise(r => setTimeout(r, 600));
      setFlashing(null); await new Promise(r => setTimeout(r, 400));
    }
  };

  const finishGame = async (finalScore: number, finalTotal: number) => {
    const time = Math.round((Date.now() - startTime) / 1000);
    setGameState('result'); setScore(finalScore);
    try {
      await fetch(`${API_URL}/api/games/session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ game_id: activeGame, difficulty, score: finalScore, total: finalTotal, moves, completion_time: time })
      });
    } catch(e) {}
  };

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index]; setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      if (cards[newFlipped[0]].emoji === cards[newFlipped[1]].emoji) {
        setMatched([...matched, newFlipped[0], newFlipped[1]]); setFlipped([]);
        if (matched.length + 2 === cards.length) finishGame(total, total);
      } else setTimeout(() => setFlipped([]), 1000);
    }
  };

  if (!activeGame) {
    const gamesList = [
      { name: 'Memory Match', desc: 'Match the pairs and boost visual memory.', icon: '🧠', bg: 'bg-blue-50 text-blue-600' },
      { name: 'Number Recall', desc: 'Remember and repeat number sequences.', icon: '123', bg: 'bg-emerald-50 text-emerald-600' },
      { name: 'Sequence Recall', desc: 'Recall the correct visual sequence.', icon: '🟦', bg: 'bg-purple-50 text-purple-600' },
      { name: 'Pattern Recognition', desc: 'Identify patterns and shapes.', icon: '🧩', bg: 'bg-amber-50 text-amber-600' }
    ];

    return (
      <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-2xl font-bold tracking-tight ${hc ? 'text-white' : 'text-[#0f172a]'}`}>Cognitive Games</h2>
            <p className="text-sm font-medium text-slate-500">Fun activities to keep your mind sharp!</p>
          </div>
          <button onClick={onBack} className="text-sm font-bold text-slate-600 hover:text-[#0f172a] dark:text-slate-400 dark:hover:text-white flex items-center gap-1">
            <ArrowLeft size={16}/> Back
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {gamesList.map(g => (
            <div key={g.name} className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${hc ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 ${g.bg} dark:bg-opacity-20`}>{g.icon}</div>
                <h3 className="font-bold text-lg mb-2">{g.name}</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">{g.desc}</p>
                <div className="flex gap-2 text-[10px] font-bold">
                  <button onClick={() => { setActiveGame(g.name); setDifficulty('Easy'); }} className={`px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity ${difficulty === 'Easy' && activeGame === g.name ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-50 text-amber-600 border-transparent'}`}>Easy</button>
                  <button onClick={() => { setActiveGame(g.name); setDifficulty('Medium'); }} className={`px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity ${difficulty === 'Medium' && activeGame === g.name ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-50 text-emerald-600 border-transparent'}`}>Medium</button>
                  <button onClick={() => { setActiveGame(g.name); setDifficulty('Hard'); }} className={`px-3 py-1.5 rounded-full border hover:opacity-80 transition-opacity ${difficulty === 'Hard' && activeGame === g.name ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-purple-50 text-purple-600 border-transparent'}`}>Hard</button>
                </div>
                <div className="text-xs font-semibold text-slate-400 mt-4 flex items-center gap-1"><Clock size={12}/> ~5-10 min</div>
              </div>
              <button onClick={() => { setActiveGame(g.name); setGameState('intro'); }} className="w-full py-3 bg-[#1e40af] text-white font-bold rounded-xl shadow-sm hover:bg-[#1e3a8a] transition-all">Start</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active Gameplay Screens
  return (
    <div className={`max-w-4xl mx-auto p-6 md:p-8 rounded-2xl border shadow-sm ${hc ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-100 text-[#0f172a]'}`}>
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold">{activeGame}</h2>
          <span className="text-xs font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md mt-1 inline-block">{difficulty}</span>
        </div>
        <button onClick={() => setActiveGame(null)} className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg hover:bg-rose-100 transition-colors">Quit Game</button>
      </div>

      {gameState === 'intro' && (
        <div className="text-center py-12">
          <h3 className="text-3xl font-black mb-6">Ready to play?</h3>
          <button onClick={startGame} className="px-12 py-4 bg-[#1e40af] text-white text-lg font-bold rounded-xl shadow-md hover:bg-[#1e3a8a] transition-all flex items-center justify-center gap-2 mx-auto">
            <Play size={20} fill="currentColor" /> Start Now
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          {activeGame === 'Memory Match' && (
            <div className={`grid gap-4 mx-auto ${difficulty === 'Easy' ? 'grid-cols-3 max-w-sm' : difficulty === 'Medium' ? 'grid-cols-4 max-w-lg' : 'grid-cols-6 max-w-3xl'}`}>
              {cards.map((c, i) => {
                const isF = flipped.includes(i) || matched.includes(i);
                return <button key={i} onClick={() => handleCardClick(i)} className={`aspect-square rounded-xl text-4xl flex items-center justify-center shadow-sm transition-all transform ${isF ? (hc ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-200') : 'bg-[#1e40af] hover:bg-[#1e3a8a] active:scale-95'}`}>{isF ? c.emoji : ''}</button>
              })}
            </div>
          )}
          {activeGame === 'Number Recall' && (
            <div className="text-center py-12 max-w-sm mx-auto">
              {showNumber ? ( <div className="text-6xl font-black tracking-widest text-[#1e40af] dark:text-blue-400">{targetNumber}</div> ) : (
                <>
                  <input type="number" value={userInput} onChange={e => setUserInput(e.target.value)} className="w-full text-center text-4xl font-bold p-4 border-2 border-slate-200 rounded-xl mb-6 outline-none focus:border-[#1e40af] dark:bg-slate-800 dark:border-slate-700 dark:text-white" autoFocus />
                  <button onClick={() => { setMoves(m=>m+1); finishGame(userInput===targetNumber?1:0, 1); }} className="w-full py-4 bg-[#1e40af] text-white text-lg font-bold rounded-xl">Submit Answer</button>
                </>
              )}
            </div>
          )}
          {activeGame === 'Sequence Recall' && (
            <div className="py-8 grid grid-cols-2 gap-4 max-w-xs mx-auto">
              {COLORS.map((color, i) => (
                <button key={i} onClick={() => { setMoves(m=>m+1); if(i===sequence[userSeqIndex]){ const ni=userSeqIndex+1; setUserSeqIndex(ni); if(ni===sequence.length)finishGame(sequence.length,sequence.length); } else finishGame(userSeqIndex, sequence.length); }} disabled={flashing !== null} className={`aspect-square rounded-2xl shadow-sm transition-all ${color} ${flashing === i ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`} />
              ))}
            </div>
          )}
          {activeGame === 'Pattern Recognition' && (
            <div className="text-center py-8">
              <div className="flex justify-center gap-4 mb-12 text-5xl bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl inline-flex">{pattern.map((p, i) => <div key={i}>{p}</div>)}<div className="text-slate-300">?</div></div>
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                {options.map((opt, i) => <button key={i} onClick={() => { setMoves(m=>m+1); finishGame(opt===correctOption?1:0, 1); }} className="text-4xl p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-[#1e40af] dark:bg-slate-800 dark:border-slate-700">{opt}</button>)}
              </div>
            </div>
          )}
        </>
      )}

      {gameState === 'result' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"><Brain size={40}/></div>
          <h2 className="text-4xl font-black mb-2">Activity Complete!</h2>
          <p className="text-xl font-bold mb-8">Score: {Math.round((score/total)*100)}%</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => setGameState('intro')} className="px-8 py-3 bg-[#1e40af] text-white font-bold rounded-xl shadow-sm hover:bg-[#1e3a8a] flex items-center gap-2"><RefreshCw size={18}/> Play Again</button>
            <button onClick={() => setActiveGame(null)} className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Back to Games</button>
          </div>
        </div>
      )}
    </div>
  );
}
