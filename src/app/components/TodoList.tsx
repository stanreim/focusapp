import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { hapticSounds } from '@/app/hooks/useHapticSound';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = 'zeno-app-todos';

function PlusIcon({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  return (
    <div className="relative rounded-[4px] shrink-0 size-3 sm:size-4 lg:size-[16px]" data-name="Plus">
      <div className="overflow-clip relative rounded-[inherit] size-full flex items-center justify-center">
        <Plus size={10} className={`transition-colors duration-500 ${themeMode === 'light' ? 'text-[#bdbdbd]' : 'text-[#FFFFFF]'}`} strokeWidth={2} />
      </div>
      <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[4px] transition-colors duration-500 ${themeMode === 'light' ? 'border-[#ccc]' : 'border-[#cccccc]'}`} />
    </div>
  );
}

const DEFAULT_TODOS: Todo[] = [
  { id: '1', text: 'Finish Landler Cadastre', completed: false },
  { id: '2', text: 'Add prototype', completed: false },
  { id: '3', text: 'Play around with Cursor', completed: false },
];

export function TodoList({ themeMode }: { themeMode?: 'light' | 'dark' | 'color' }) {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load todos from localStorage:', e);
    }
    return DEFAULT_TODOS;
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  // Drag state with whole-row drag + safeguards
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragPointerIdRef = useRef<number | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const lastHoverIndexRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number>(0);
  const didReorderRef = useRef(false);
  const dragHoldTimerRef = useRef<number | null>(null);
  const pendingPointerIdRef = useRef<number | null>(null);
  const pendingRowElRef = useRef<HTMLElement | null>(null);
  const pendingTodoIdRef = useRef<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const todosRef = useRef<Todo[]>(todos);

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  // Persist todos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error('Failed to save todos to localStorage:', e);
    }
  }, [todos]);

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      hapticSounds.pop();
      setTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim(), completed: false }]);
      setNewTodoText('');
      setIsAdding(false);
    } else {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTodoText('');
    }
  };

  const handleEditSave = () => {
    if (editingId) {
      if (editText.trim()) {
        setTodos(todos.map(t => t.id === editingId ? { ...t, text: editText.trim() } : t));
      } else {
        setTodos(todos.filter(t => t.id !== editingId));
      }
      setEditingId(null);
      setEditText('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditText('');
    }
  };

  const toggleComplete = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo && !todo.completed) {
      // Play pleasant completion chime when completing a task
      hapticSounds.complete();
    } else {
      // Simple click when uncompleting
      hapticSounds.click();
    }
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    hapticSounds.tick();
    setTodos(todos.filter(t => t.id !== id));
  };

  const startEditing = (todo: Todo) => {
    // Optional: Prevent editing if completed, but user request implies full inline edit capability.
    // I'll allow it.
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const moveTodo = useCallback((sourceId: string, targetIndex: number) => {
    setTodos((prevTodos) => {
      const sourceIndex = prevTodos.findIndex((t) => t.id === sourceId);
      if (sourceIndex === -1 || targetIndex < 0 || targetIndex >= prevTodos.length || sourceIndex === targetIndex) {
        return prevTodos;
      }
      const next = [...prevTodos];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }, []);

  const getHoverIndex = useCallback((clientY: number): number | null => {
    if (!listRef.current) return null;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLElement>('[data-task-id]'));
    if (rows.length === 0) return null;

    for (let i = 0; i < rows.length; i += 1) {
      const rect = rows[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) return i;
    }
    return rows.length - 1;
  }, []);

  const clearDragHoldTimer = useCallback(() => {
    if (dragHoldTimerRef.current != null) {
      window.clearTimeout(dragHoldTimerRef.current);
      dragHoldTimerRef.current = null;
    }
  }, []);

  const beginDrag = useCallback((pointerId: number, rowEl: HTMLElement, id: string) => {
    dragPointerIdRef.current = pointerId;
    draggedIdRef.current = id;
    lastHoverIndexRef.current = todosRef.current.findIndex((t) => t.id === id);
    didReorderRef.current = false;
    setDraggedId(id);
    setIsDragging(true);
    hapticSounds.click();
    rowEl.setPointerCapture(pointerId);
  }, []);

  const handleRowPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();

    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('button') ||
      target.closest('[data-name="Checkmark"]')
    ) {
      return;
    }

    dragStartYRef.current = e.clientY;
    pendingPointerIdRef.current = e.pointerId;
    pendingRowElRef.current = e.currentTarget as HTMLElement;
    pendingTodoIdRef.current = id;
    clearDragHoldTimer();
    dragHoldTimerRef.current = window.setTimeout(() => {
      const pointerId = pendingPointerIdRef.current;
      const rowEl = pendingRowElRef.current;
      const todoId = pendingTodoIdRef.current;
      if (pointerId == null || !rowEl || !todoId || isDragging) return;
      beginDrag(pointerId, rowEl, todoId);
      dragHoldTimerRef.current = null;
    }, 140);
  }, [beginDrag, clearDragHoldTimer, isDragging]);

  const handleRowPointerMove = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();

    // Allow quick drag start when user moves decisively before hold delay.
    if (!isDragging && dragHoldTimerRef.current != null) {
      const movedY = Math.abs(e.clientY - dragStartYRef.current);
      if (movedY >= 10) {
        clearDragHoldTimer();
        beginDrag(e.pointerId, e.currentTarget as HTMLElement, id);
      }
    }

    if (!isDragging || dragPointerIdRef.current !== e.pointerId || !draggedIdRef.current) return;
    e.preventDefault();

    const hoverIndex = getHoverIndex(e.clientY);
    if (hoverIndex == null || hoverIndex === lastHoverIndexRef.current) return;

    moveTodo(draggedIdRef.current, hoverIndex);
    lastHoverIndexRef.current = hoverIndex;
    didReorderRef.current = true;
  }, [beginDrag, clearDragHoldTimer, getHoverIndex, isDragging, moveTodo]);

  const finishDrag = useCallback((e: React.PointerEvent) => {
    clearDragHoldTimer();
    e.stopPropagation();
    if (dragPointerIdRef.current === e.pointerId) {
      e.preventDefault();
      if (didReorderRef.current) {
        hapticSounds.tick();
      }
    }

    dragPointerIdRef.current = null;
    draggedIdRef.current = null;
    lastHoverIndexRef.current = null;
    dragStartYRef.current = 0;
    didReorderRef.current = false;
    pendingPointerIdRef.current = null;
    pendingRowElRef.current = null;
    pendingTodoIdRef.current = null;
    setDraggedId(null);
    setIsDragging(false);

    const row = e.currentTarget as HTMLElement;
    if (row.hasPointerCapture(e.pointerId)) {
      row.releasePointerCapture(e.pointerId);
    }
  }, [clearDragHoldTimer]);

  useEffect(() => {
    return () => {
      clearDragHoldTimer();
    };
  }, [clearDragHoldTimer]);

  // Prevent parent handlers from triggering on the todo container
  const handleContainerPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div 
      ref={listRef}
      className="content-stretch flex flex-col gap-4 items-start justify-center relative shrink-0 w-full" 
      data-name="List"
      onPointerDown={handleContainerPointerDown}
    >
      {todos.map(todo => (
        <div 
          key={todo.id}
          data-task-id={todo.id}
          onPointerDown={(e) => handleRowPointerDown(e, todo.id)}
          onPointerMove={(e) => handleRowPointerMove(e, todo.id)}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          className={`content-stretch flex gap-2 items-start relative shrink-0 group w-full min-h-[24px] transition-all duration-150 select-none touch-none ${
            draggedId === todo.id ? 'opacity-50 scale-[1.02]' : ''
          }`}
          data-name="Task"
        >
          {/* Checkbox */}
          <div 
            onClick={() => toggleComplete(todo.id)}
            className={`relative rounded-[4px] shrink-0 size-3 sm:size-4 lg:size-[16px] cursor-pointer hover:opacity-80 transition-all duration-500 mt-[2px]`}
            data-name="Checkmark" 
            style={{ 
              backgroundImage: themeMode === 'light'
                ? "linear-gradient(158.875deg, rgb(239, 239, 239) 13.934%, rgb(255, 255, 255) 127.92%)"
                : "linear-gradient(158.875deg, rgb(60, 60, 60) 13.934%, rgb(50, 50, 50) 127.92%)"
            }}
          >
            <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[4px] transition-colors duration-500 ${themeMode === 'light' ? 'border-[#ccc]' : 'border-[#cccccc]'}`} />
            {todo.completed && (
              <div className="absolute inset-0 flex items-center justify-center">
                 <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="w-[70%] h-[70%]">
                    <path 
                      d="M1 4L3.5 6.5L9 1" 
                      stroke={themeMode === 'light' ? '#666' : '#FFFFFF'} 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="transition-all duration-500"
                    />
                 </svg>
              </div>
            )}
          </div>

          {/* Text or Input */}
          <div className="flex-1 min-w-0 relative flex items-start">
            {editingId === todo.id ? (
               <input
                 ref={editInputRef}
                 type="text"
                 value={editText}
                 onChange={(e) => setEditText(e.target.value)}
                 onBlur={handleEditSave}
                 onKeyDown={handleEditKeyDown}
                 className={`font-['SF_Pro:Medium',sans-serif] font-[510] text-[16px] sm:text-sm lg:text-[14px] bg-transparent border-none outline-none w-full p-0 m-0 h-auto leading-[normal] transition-colors duration-500 ${themeMode === 'light' ? 'text-black' : 'text-[#FFFFFF]'}`}
                 style={{ fontVariationSettings: "'wdth' 100" }}
               />
            ) : (
              <p 
                onClick={() => startEditing(todo)}
                className={`font-['SF_Pro:Medium',sans-serif] font-[510] leading-[1.4] relative text-xs sm:text-sm lg:text-[14px] text-left cursor-text w-full break-words transition-colors duration-500 ${todo.completed ? 'line-through opacity-70' : ''} ${themeMode === 'light' ? (todo.completed ? 'text-[#bdbdbd]' : 'text-black') : 'text-[#FFFFFF]'}`} 
                style={{ fontVariationSettings: "'wdth' 100" }}
              >
                {todo.text}
              </p>
            )}
          </div>

          {/* Delete Icon - Visible on Hover */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              deleteTodo(todo.id);
            }}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer shrink-0 mt-[-2px] ${themeMode === 'light' ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}
            title="Delete task"
          >
            <X size={14} className={`transition-colors duration-500 ${themeMode === 'light' ? 'text-[#999]' : 'text-[#FFFFFF]'}`} />
          </button>
        </div>
      ))}

      {/* Add To-Do Row */}
      <div className="content-stretch flex gap-2 items-center relative shrink-0 w-full min-h-[24px]" data-name="Task">
        <PlusIcon themeMode={themeMode} />
        <div className="flex-1 relative">
           {isAdding ? (
             <input
               ref={inputRef}
               type="text"
               value={newTodoText}
               onChange={(e) => setNewTodoText(e.target.value)}
               onBlur={handleAddTodo}
               onKeyDown={handleKeyDown}
               placeholder="Enter task..."
               className={`font-['SF_Pro:Medium',sans-serif] font-[510] text-[16px] sm:text-sm lg:text-[14px] bg-transparent border-none outline-none w-full p-0 m-0 leading-[normal] transition-colors duration-500 ${themeMode === 'light' ? 'text-black placeholder:text-[#bdbdbd]' : 'text-[#FFFFFF] placeholder:text-[#FFFFFF]/60'}`}
               style={{ fontVariationSettings: "'wdth' 100" }}
             />
           ) : (
            <p 
              onClick={() => setIsAdding(true)}
              className={`font-['SF_Pro:Medium',sans-serif] font-[510] leading-[normal] relative shrink-0 text-xs sm:text-sm lg:text-[14px] text-left cursor-pointer transition-colors duration-500 w-full ${themeMode === 'light' ? 'text-[#bdbdbd] hover:text-[#999]' : 'text-[#FFFFFF]/80 hover:text-[#FFFFFF]'}`} 
              style={{ fontVariationSettings: "'wdth' 100" }}
            >
               Add to-do
             </p>
           )}
        </div>
      </div>
    </div>
  );
}
