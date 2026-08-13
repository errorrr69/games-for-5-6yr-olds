import type { Round } from '../core/types'
import { BondGarden } from './BondGarden'
import { FeedMonster } from './FeedMonster'
import { FeelingThermometer } from './FeelingThermometer'
import { FlashHide } from './FlashHide'
import { FreezeDance } from './FreezeDance'
import { MirrorFaces } from './MirrorFaces'
import { NumberLine } from './NumberLine'
import { OppositeGame } from './OppositeGame'
import { RockTheBuddy } from './RockTheBuddy'
import { ScavengerHunt } from './ScavengerHunt'
import { TenFrame } from './TenFrame'
import {
  RobotTranslator,
  SoundSafari,
  Skywriter,
} from './reading/EarlySounds'
import {
  MonsterLab,
  SoundBoxFactory,
  WordLadder,
} from './reading/BuildingWords'
import {
  BlendTrain,
  DigraphDetectives,
  MagicEWizard,
} from './reading/Patterns'
import { StoryQuest, TrickyTreasure } from './reading/ReadingOn'
import type { GameProps } from './shared'

/**
 * The one place a round turns into a screen. Adding a game means adding a
 * component and a case here — nothing else in the app changes.
 */
export function GameStage(props: GameProps<Round>) {
  const { round } = props
  switch (round.game) {
    case 'flash-hide':
      return <FlashHide {...props} round={round} />
    case 'feed-monster':
      return <FeedMonster {...props} round={round} />
    case 'bond-garden':
      return <BondGarden {...props} round={round} />
    case 'ten-frame':
      return <TenFrame {...props} round={round} />
    case 'number-line':
      return <NumberLine {...props} round={round} />
    case 'feeling-thermometer':
      return <FeelingThermometer {...props} round={round} />
    case 'opposite-game':
      return <OppositeGame {...props} round={round} />
    case 'mirror-faces':
      return <MirrorFaces {...props} round={round} />
    case 'scavenger-hunt':
      return <ScavengerHunt {...props} round={round} />
    case 'rock-buddy':
      return <RockTheBuddy {...props} round={round} />
    case 'freeze-dance':
      return <FreezeDance {...props} round={round} />
    case 'robot-translator':
      return <RobotTranslator {...props} round={round} />
    case 'sound-safari':
      return <SoundSafari {...props} round={round} />
    case 'skywriter':
      return <Skywriter {...props} round={round} />
    case 'sound-box-factory':
      return <SoundBoxFactory {...props} round={round} />
    case 'monster-lab':
      return <MonsterLab {...props} round={round} />
    case 'digraph-detectives':
      return <DigraphDetectives {...props} round={round} />
    case 'blend-train':
      return <BlendTrain {...props} round={round} />
    case 'magic-e-wizard':
      return <MagicEWizard {...props} round={round} />
    case 'tricky-treasure':
      return <TrickyTreasure {...props} round={round} />
    case 'word-ladder':
      return <WordLadder {...props} round={round} />
    case 'story-quest':
      return <StoryQuest {...props} round={round} />
  }
}

export {
  RobotTranslator,
  SoundSafari,
  Skywriter,
  SoundBoxFactory,
  MonsterLab,
  WordLadder,
  DigraphDetectives,
  BlendTrain,
  MagicEWizard,
  TrickyTreasure,
  StoryQuest,
  FlashHide,
  FeedMonster,
  BondGarden,
  TenFrame,
  NumberLine,
  FeelingThermometer,
  OppositeGame,
  MirrorFaces,
  ScavengerHunt,
  RockTheBuddy,
  FreezeDance,
}
