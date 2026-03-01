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
  
  // Drag state using pointer events
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; id: string | null }>({ x: 0, y: 0, id: null });
  const isDraggingRef = useRef(false);
  const dragThreshold = 8; // pixels before drag starts
  
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Unified pointer-based drag handlers (works for both mouse and touch)
  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    // Prevent parent handlers (audio selection)
    e.stopPropagation();
    
    // Don't start drag on checkbox or delete button
    const target = e.target as HTMLElement;
    if (target.closest('[data-name="Checkmark"]') || target.closest('button')) {
      return;
    }
    
    pointerStartRef.current = { 
      x: e.clientX, 
      y: e.clientY,
      id: id
    };
    isDraggingRef.current = false;
    
    // Capture pointer to receive events even outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current.id) return;
    
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
    
    // Start dragging once we move past threshold
    if (!isDraggingRef.current && (deltaX > dragThreshold || deltaY > dragThreshold)) {
      isDraggingRef.current = true;
      setDraggedId(pointerStartRef.current.id);
      hapticSounds.click();
    }

    // If we're dragging, find which task we're over
    if (isDraggingRef.current && listRef.current) {
      const taskElements = listRef.current.querySelectorAll('[data-task-id]');
      
      for (const el of taskElements) {
        const rect = el.getBoundingClientRect();
        if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const targetId = el.getAttribute('data-task-id');
          if (targetId && targetId !== pointerStartRef.current.id) {
            setDragOverId(targetId);
          } else {
            setDragOverId(null);
          }
          break;
        }
      }
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    
    const sourceId = pointerStartRef.current.id;
    
    // If we were dragging and have a target, reorder
    if (isDraggingRef.current && sourceId && dragOverId && sourceId !== dragOverId) {
      hapticSounds.tick();
      setTodos(prevTodos => {
        const sourceIndex = prevTodos.findIndex(t => t.id === sourceId);
        const targetIndex = prevTodos.findIndex(t => t.id === dragOverId);
        
        if (sourceIndex === -1 || targetIndex === -1) return prevTodos;
        
        const newTodos = [...prevTodos];
        const [removed] = newTodos.splice(sourceIndex, 1);
        newTodos.splice(targetIndex, 0, removed);
        
        return newTodos;
      });
    }

    // Reset state
    isDraggingRef.current = false;
    pointerStartRef.current = { x: 0, y: 0, id: null };
    setDraggedId(null);
    setDragOverId(null);
    
    // Release pointer capture
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [dragOverId]);

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
          onPointerDown={(e) => handlePointerDown(e, todo.id)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`content-stretch flex gap-2 items-start relative shrink-0 group w-full min-h-[24px] transition-all duration-150 touch-none select-none ${
            draggedId === todo.id ? 'opacity-50 scale-[1.02]' : ''
          } ${
            dragOverId === todo.id && draggedId !== todo.id
              ? (themeMode === 'light' ? 'bg-black/5 rounded' : 'bg-white/10 rounded')
              : ''
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
                 className={`font-['SF_Pro:Medium',sans-serif] font-[510] text-xs sm:text-sm lg:text-[14px] bg-transparent border-none outline-none w-full p-0 m-0 h-auto leading-[normal] transition-colors duration-500 ${themeMode === 'light' ? 'text-black' : 'text-[#FFFFFF]'}`}
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
               className={`font-['SF_Pro:Medium',sans-serif] font-[510] text-xs sm:text-sm lg:text-[14px] bg-transparent border-none outline-none w-full p-0 m-0 leading-[normal] transition-colors duration-500 ${themeMode === 'light' ? 'text-black placeholder:text-[#bdbdbd]' : 'text-[#FFFFFF] placeholder:text-[#FFFFFF]/60'}`}
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
