import React from 'react';

export const EventBlock = ({ event, isRegistered, onRegister, onUnregister }) => {
  
  // 1. SAFETY CHECK MUST BE FIRST!
  // If no event data exists yet, render nothing and prevent crashes.
  if (!event) return null;

  // 2. Now it is safe to calculate times because we know 'event' exists
  const duration = Math.floor(
    (new Date(event.end_time) - new Date(event.start_time)) / 60000
  );

  const startTime = new Date(event.start_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const getTypeColor = (type) => {
    const colors = {
      workshop: 'from-blue-500 to-blue-600',
      keynote: 'from-red-500 to-red-600',
      breakout: 'from-purple-500 to-purple-600',
      networking: 'from-green-500 to-green-600',
      break: 'from-yellow-500 to-yellow-600',
      lunch: 'from-orange-500 to-orange-600'
    };
    return colors[type] || colors.breakout; 
  };

  const getTypeIcon = (type) => {
    const icons = {
      workshop: '🛠',
      keynote: '🎤',
      breakout: '💬',
      networking: '🤝',
      break: '☕'
    };
    return icons[type] || '📅';
  };

  return (
    <div className={`bg-gradient-to-br ${getTypeColor(event.session_type)} text-white rounded-lg p-4 mb-3 hover:shadow-lg transition-all cursor-pointer`}>
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(event.session_type)}</span>
          <div>
            <p className="font-bold text-lg">{event.title}</p>
            <p className="text-sm opacity-90">{startTime} • {duration} min</p>
          </div>
        </div>
        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded uppercase">
          {event.session_type ? event.session_type.toUpperCase() : 'EVENT'}
        </span>
      </div>

      <div className="text-sm opacity-90 mb-3 space-y-1">
        {event.speaker_name && (
          <p className="flex items-center gap-2">🎤 {event.speaker_name}</p>
        )}
        {event.location && (
          <p className="flex items-center gap-2">📍 {event.location}</p>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/20">
         <div className="flex gap-2 text-xs">
           <span className="bg-white/20 px-2 py-1 rounded">
             👥 {event.registered_count || 0}/{event.capacity || '∞'}
           </span>
           <span className="bg-white/20 px-2 py-1 rounded">
             {event.difficulty_level || 'All levels'}
           </span>
         </div>
      </div>

      {event.tags && (
         <div className="mt-3 flex flex-wrap gap-1">
          {event.tags.split(',').slice(0, 2).map((tag, idx) => (
            <span key={idx} className="text-xs bg-white/10 px-2 py-0.5 rounded">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        {isRegistered ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onUnregister(event.id); }} 
            className="w-full py-2 bg-white/20 hover:bg-white/30 rounded text-sm font-bold transition-colors"
          >
            ✓ Registered
          </button>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onRegister(event.id); }} 
            className="w-full py-2 bg-white text-blue-600 hover:bg-gray-100 rounded text-sm font-bold transition-colors"
          >
            + Register
          </button>
        )}
      </div>

    </div>
  );
};

export default EventBlock;