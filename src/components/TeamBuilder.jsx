import React, { useState } from 'react';
import FighterSlot from './FighterSlot';
import FighterRoster from './FighterRoster';

const TeamBuilder = () => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [team, setTeam] = useState([null, null, null]);

  const handleSlotClick = (slotIndex) => {
    setSelectedSlot(slotIndex);
    setIsPickerOpen(true);
  };

  const handleFighterSelect = (fighter) => {
    const newTeam = [...team];
    newTeam[selectedSlot] = fighter;
    setTeam(newTeam);
    setIsPickerOpen(false);
  };

  return (
    <div className="team-builder">
      <div className="team-slots">
        {team.map((fighter, index) => (
          <FighterSlot
            key={index}
            fighter={fighter}
            onClick={() => handleSlotClick(index)}
          />
        ))}
      </div>
      {isPickerOpen && (
        <div className="fighter-picker">
          <FighterRoster onSelect={handleFighterSelect} />
        </div>
      )}
    </div>
  );
};

export default TeamBuilder;