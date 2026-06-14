'use client';

import { useState, useEffect, useCallback } from 'react';

interface TambolaProps {
  allUsers: any[];
}

interface TambolaEntry {
  id: number;
  name: string;
  clue: string;
}

function buildClue(u: any): string {
  const parts: string[] = [];
  if (u.gender) parts.push(u.gender);
  if (u.city) parts.push(`lives in ${u.city}`);
  else if (u.state) parts.push(`lives in ${u.state}`);
  else if (u.country) parts.push(`lives in ${u.country}`);
  if (u.spouse_name) parts.push(`spouse is ${u.spouse_name}`);
  if (parts.length === 0) parts.push('family member');
  return parts.join(' · ');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCard(pool: TambolaEntry[]): TambolaEntry[][] {
  // 3 rows × 5 cols = 15 cells. Pick 15 random entries.
  const picked = shuffle(pool).slice(0, 15);
  return [picked.slice(0, 5), picked.slice(5, 10), picked.slice(10, 15)];
}

const WIN_PATTERNS = [
  { label: 'Top Row', rows: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { label: 'Middle Row', rows: [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]] },
  { label: 'Bottom Row', rows: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
  { label: 'Full House', rows: Array.from({ length: 15 }, (_, i) => [Math.floor(i / 5), i % 5]) },
];

export default function FamilyTambola({ allUsers }: TambolaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pool, setPool] = useState<TambolaEntry[]>([]);
  const [card, setCard] = useState<TambolaEntry[][]>([]);
  const [calledClues, setCalledClues] = useState<string[]>([]);
  const [callerQueue, setCallerQueue] = useState<TambolaEntry[]>([]);
  const [currentCall, setCurrentCall] = useState<TambolaEntry | null>(null);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [wins, setWins] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isAutoCall, setIsAutoCall] = useState(false);

  const checkWins = useCallback((markedSet: Set<string>, cardGrid: TambolaEntry[][]) => {
    const newWins: string[] = [];
    WIN_PATTERNS.forEach(({ label, rows }) => {
      const complete = rows.every(([r, c]) => markedSet.has(`${r}-${c}`));
      if (complete && !wins.includes(label)) newWins.push(label);
    });
    return newWins;
  }, [wins]);

  const startGame = () => {
    const entries: TambolaEntry[] = allUsers
      .filter((u: any) => buildClue(u) !== 'family member')
      .map((u: any) => ({ id: u.id, name: u.primary_name, clue: buildClue(u) }));

    if (entries.length < 15) return;
    const shuffledPool = shuffle(entries);
    const grid = buildCard(shuffledPool);
    const remaining = shuffle(shuffledPool);

    setPool(entries);
    setCard(grid);
    setCallerQueue(remaining);
    setCalledClues([]);
    setCurrentCall(null);
    setMarked(new Set());
    setWins([]);
    setGameOver(false);
    setIsOpen(true);
  };

  const callNext = useCallback(() => {
    setCallerQueue(prev => {
      if (prev.length === 0) { setGameOver(true); return prev; }
      const [next, ...rest] = prev;
      setCurrentCall(next);
      setCalledClues(c => [next.clue, ...c]);
      return rest;
    });
  }, []);

  // Auto-caller
  useEffect(() => {
    if (!isAutoCall || gameOver) return;
    const t = setTimeout(callNext, 3500);
    return () => clearTimeout(t);
  }, [isAutoCall, currentCall, callNext, gameOver]);

  const handleMark = (row: number, col: number) => {
    if (!currentCall) return;
    const cell = card[row][col];
    // Only allow marking if this cell's person just got called
    if (calledClues[0] !== cell.clue && !calledClues.includes(cell.clue)) return;
    const key = `${row}-${col}`;
    const next = new Set(marked);
    if (next.has(key)) next.delete(key); else next.add(key);
    setMarked(next);
    const newWins = checkWins(next, card);
    if (newWins.length > 0) setWins(w => [...w, ...newWins]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={startGame}
        disabled={allUsers.filter((u: any) => buildClue(u) !== 'family member').length < 15}
        className="w-full rounded-2xl border-2 border-dashed border-purple-200 p-5 text-center hover:border-purple-400 hover:bg-purple-50 transition group disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <div className="text-3xl mb-2">🎱</div>
        <p className="font-bold text-slate-800 group-hover:text-purple-700 transition">Family Tambola</p>
        <p className="text-xs text-slate-500 mt-1">Housie with family member clues — first to a row wins!</p>
        {allUsers.filter((u: any) => buildClue(u) !== 'family member').length < 15 && (
          <p className="text-xs text-rose-400 mt-1">Need at least 15 members with details to play</p>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-purple-200 bg-white p-4 sm:p-6 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">🎱 Family Tambola</h3>
          <p className="text-xs text-slate-500">{callerQueue.length} clues remaining</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startGame}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-600 transition"
          >
            New Card
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2"
          >✕</button>
        </div>
      </div>

      {/* Wins */}
      {wins.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-wrap gap-2 items-center animate-in zoom-in">
          <span className="text-xl">🎉</span>
          {wins.map(w => (
            <span key={w} className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">{w}!</span>
          ))}
        </div>
      )}

      {/* Caller area */}
      <div className="bg-purple-600 rounded-2xl p-4 text-white text-center min-h-[80px] flex flex-col items-center justify-center">
        {currentCall ? (
          <>
            <p className="text-[10px] uppercase tracking-widest text-purple-200 mb-1">Who is this?</p>
            <p className="text-base sm:text-lg font-bold leading-snug">{currentCall.clue}</p>
          </>
        ) : (
          <p className="text-purple-200 text-sm">Press "Call" to start the game</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={callNext}
          disabled={gameOver || callerQueue.length === 0}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40 active:scale-95"
        >
          {gameOver ? 'Game Over' : '📢 Call Next'}
        </button>
        <button
          onClick={() => setIsAutoCall(a => !a)}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm transition border-2 ${
            isAutoCall
              ? 'bg-amber-100 border-amber-400 text-amber-700'
              : 'bg-white border-slate-200 text-slate-600 hover:border-purple-300'
          }`}
        >
          {isAutoCall ? '⏸ Auto' : '▶ Auto'}
        </button>
      </div>

      {/* Tambola Card */}
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Card — tap to mark</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[320px]">
            <tbody>
              {card.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    const key = `${ri}-${ci}`;
                    const isMarked = marked.has(key);
                    const isCalled = calledClues.includes(cell.clue);
                    return (
                      <td
                        key={ci}
                        onClick={() => handleMark(ri, ci)}
                        className={`border border-slate-200 p-2 text-center cursor-pointer transition-all select-none
                          ${isMarked
                            ? 'bg-purple-600 text-white'
                            : isCalled
                              ? 'bg-purple-50 border-purple-300 hover:bg-purple-100'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        style={{ minWidth: 60, maxWidth: 100 }}
                      >
                        <p className={`text-[10px] sm:text-xs font-bold leading-tight ${isMarked ? 'text-white' : 'text-slate-700'}`}>
                          {cell.name.split(' ')[0]}
                        </p>
                        <p className={`text-[8px] sm:text-[9px] leading-tight mt-0.5 ${isMarked ? 'text-purple-200' : 'text-slate-400'}`}>
                          {cell.clue.split(' · ')[0]}
                        </p>
                        {isMarked && <div className="text-base mt-0.5">✓</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Last 5 called */}
      {calledClues.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Recently Called</p>
          <div className="flex flex-wrap gap-1.5">
            {calledClues.slice(0, 6).map((c, i) => (
              <span key={i} className={`text-[10px] px-2 py-1 rounded-full border font-medium ${i === 0 ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}