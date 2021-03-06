import { useState } from 'react';
import { useSpring, animated as a } from 'react-spring';

import { Item } from './Item';

import { BLOCK_NAMES } from '../game/blocks';
import { PLANETS } from '../game/missions';
import {  obj_y } from '../game/objects';

const AItem = a(Item);

export default ({ currentInstruction, planetIndex, missionIndex,
                  onSuccess, onFailure,
                  setCurrentInstruction, program, programSubmitted }) => {

  const planet = PLANETS[planetIndex];
  const mission = planet.missions[missionIndex];
  
  const [instructionsCompleted, setInstructionsCompleted] = useState(0);
  const [items, setItems] = useState(mission.items);
  const [winMessage, setWinMessage] = useState(false);
  const [loseMessage, setLoseMessage] = useState(false);

  // Check if level is won
  function checkWin() {
    for (let i = 0; i < mission.criteria.length; i++) {
      if (!checkCriteria(mission.criteria[i])) {
        return false;
      }
    }
    return true;
  }

  // Check if particular criteria is true
  function checkCriteria(criterion) {
    switch (criterion.category) {
      
      // Confirm x location of rover
      case 'rover_x':
        if (criterion.value === items.rover.x) {
          return true;
        }
        return false;
        break;

      default:
        console.log('Error: Unknown criterion.');
        return false;
    }

  }

  // Run an instruction
  if (programSubmitted && currentInstruction < program.length && instructionsCompleted == currentInstruction) {
    const instruction = program[currentInstruction];
    
    // Decide which instruction to use
    switch (instruction) {

      // Move the rover forward
      case BLOCK_NAMES.FORWARD:
        setInstructionsCompleted(x => x + 1);
        setItems(items => {
          const rover = items['rover'];
          return {
            ...items,
            rover: {
              ...rover,
              x: rover.x + 100,
              prev: {
                x: rover.x + 100
              }
            }
          }
        });
        break;

      default:
        console.log('ERROR: Unknown block.');
    }
}

const winSpring = useSpring({
  to: {opacity: winMessage ? 1 : 0},
  from: {opacity: 0},
  config: {duration: 1000},
  delay: 500,
  onRest: () => {
    if (winMessage) {
      setTimeout(() => {
        onSuccess();
      }, 2500);
    }
  }
});

const loseSpring = useSpring({
  to: {opacity: loseMessage ? 1 : 0},
  from: {opacity: 0},
  config: {duration: 1000},
  delay: 500,
  onRest: () => {
    if (loseMessage) {
      setTimeout(() => {
        onFailure();
      }, 2500);
    }
  }
});

return (
    <g>
      {Object.keys(items).map((itemName, i) => {

        const item = items[itemName];

        const itemSpring = useSpring({
          to: {x: item.x, elevation: item.elevation || 0},
          from: {
            x: (item.prev && item.prev.x) ? item.prev.x : item.x,
            elevation: (item.prev && item.prev.elevation) ? item.prev.elevation : item.elevation || 0
          },
          config: {duration: 1000},
          onRest: () => {
            
            if (itemName === 'rover' && programSubmitted && instructionsCompleted === program.length) {
              if (checkWin()) {
                setWinMessage(true); 
              } else {
                setLoseMessage(true);
              }
            }

            // When rover completes its action, move on to the next instruction
            if (itemName === 'rover' && programSubmitted
                && instructionsCompleted > currentInstruction
                && instructionsCompleted != program.length) {
              setTimeout(() => {
                setCurrentInstruction(currentInstruction + 1);


              }, 250);
            }
          }
        });

        // Non-agent doesn't need to move
        return <AItem
          key={i}
          object={item.object}
          x={itemSpring.x}
          y={itemSpring.elevation.interpolate(e => obj_y(item.object, e))}
        /> 
      })}
      <a.text
        x='50%'
        y='20%'
        dominantBaseline='middle'
        textAnchor='middle'
        opacity={winSpring.opacity}
        style={{ fontSize: '80px', fill: planet.colors.text }}
      >
        Mission Success
      </a.text>
      <a.text
        x='50%'
        y='20%'
        dominantBaseline='middle'
        textAnchor='middle'
        opacity={loseSpring.opacity}
        style={{ fontSize: '80px', fill: planet.colors.text }}
      >
        Try Again
      </a.text>
    </g>
  );
}