import React from 'react';

const FighterRoster = ({ onSelect }) => {
  // This would normally come from a data source
  const fighters = [
    { id: 1, name: 'Goku', type: 'Saiyan' },
    { id: 2, name: 'Vegeta', type: 'Saiyan' },
    { id: 3, name: 'Piccolo', type: 'Namekian' },
    // ... more fighters
  ];

  return (
    <div className="fighter-roster">
      <h2>Select a Fighter</h2>
      <ul>
        {fighters.map((fighter) => (
          <li key={fighter.id} onClick={() => onSelect(fighter)}>
            {fighter.name} ({fighter.type})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FighterRoster;