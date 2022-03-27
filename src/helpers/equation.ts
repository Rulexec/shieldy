import {Equation} from '@sesuritu/types/src/models/Chat';

export function generateEquation(): Equation {
  const a = getRandomInt(10);
  const b = getRandomInt(10);
  return {
    question: `${a} + ${b}`,
    answer: `${a + b}`,
  };
}

function getRandomInt(max): number {
  return Math.floor(Math.random() * Math.floor(max)) + 1;
}
