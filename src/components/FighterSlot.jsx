import React from 'react';

const FighterSlot = ({ fighter, onClick }) => {
  return (
    <div className="fighter-slot" onClick={onClick}>
      {fighter ? fighter.name : 'Select Fighter'}
    </div>
  );
};

export default FighterSlot;